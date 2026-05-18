import { useTripStore } from '../../stores/useTripStore'
import { useMemoryStore } from '../../stores/useMemoryStore'
import { generateMockTrip, ALL_POIS, type POIEntry } from '../mock-trip-generator'
import { v4Id } from '../../utils/id'
import { callLLM } from '../../services/llm'
import type { Trip, TripNode, TripDay, AgeGroup } from '../../types/trip'

export interface GenerateTripPlanArgs {
  destination: string
  date?: string
  childAge: number
  duration?: number
  preferences?: string
}

function getAgeGroup(age: number): AgeGroup {
  return age <= 3 ? 'infant' : age <= 6 ? 'preschool' : 'school'
}

function poiToTripNode(poi: POIEntry, idx: number, startHour: number, startMin: number): TripNode {
  const duration = poi.poiType === 'restaurant' ? 60 : 90
  const endTotalMin = startHour * 60 + startMin + duration
  const endH = Math.floor(endTotalMin / 60) % 24
  const endM = endTotalMin % 60

  return {
    id: v4Id(),
    type: poi.poiType === 'restaurant' ? 'restaurant' : 'attraction',
    poiType: poi.poiType as TripNode['poiType'],
    name: poi.name,
    address: '',
    lat: poi.lat,
    lng: poi.lng,
    startTime: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`,
    endTime: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
    duration,
    dayIndex: 0,
    segment: 'morning',
    walkingFromPrev: idx > 0 ? { distance: Math.round(200 + Math.random() * 800), estimatedMinutes: Math.round(3 + Math.random() * 12), childFriendly: true } : null,
    ticketInfo: poi.ticket ? {
      adultPrice: poi.ticket.adult,
      childPrice: poi.ticket.child,
      hasChildTicket: poi.ticket.child > 0,
      bookingUrl: '',
      openTime: '09:00',
      closeTime: '17:00',
    } : null,
    childFriendlinessRating: (Math.max(1, Math.min(5, poi.rating)) as TripNode['childFriendlinessRating']),
    crowdLevel: (Math.max(1, Math.min(4, poi.crowd)) as TripNode['crowdLevel']),
    tips: poi.tips,
    indoor: poi.indoor,
  }
}

function buildLLMPrompt(
  destination: string,
  args: GenerateTripPlanArgs,
  ageGroup: AgeGroup,
  poiPool: POIEntry[],
  profile: ReturnType<typeof useMemoryStore.getState>['profile'],
): string {
  const ageLabels: Record<AgeGroup, string> = { infant: '0-3岁 婴幼', preschool: '4-6岁 学龄前', school: '7-12岁 学龄' }
  const ageRules: Record<AgeGroup, string> = {
    infant: '每次游玩≤2小时, 步行≤2km, 每60分钟需休息',
    preschool: '每次游玩≤3小时, 步行≤3km, 每90分钟需休息',
    school: '每次游玩≤4小时, 步行≤4km, 每120分钟需休息',
  }

  const poiListText = poiPool.map((p, i) =>
    `${i}. ${p.name} [${p.poiType}] ${p.indoor ? '室内' : '户外'} ⭐${p.rating} 人流${p.crowd}/4` +
    (p.ticket ? ` 票价:成人¥${p.ticket.adult}/儿童¥${p.ticket.child}` : ' 免费') +
    ` 特点: ${p.keywords.join(', ')}` +
    (p.tips.length ? ` 提示: ${p.tips.join('; ')}` : '')
  ).join('\n')

  return `请为一位${args.childAge}岁孩子（${ageLabels[ageGroup]}）规划在${destination}的一日亲子游行程。

## 年龄规则
${ageRules[ageGroup]}

## 孩子信息
${profile.childName ? `名字: ${profile.childName}, ` : ''}年龄: ${args.childAge}岁${profile.gender ? `, 性别: ${profile.gender}` : ''}${profile.energyLevel ? `, 体力: ${profile.energyLevel}` : ''}${profile.interests.length ? `, 兴趣: ${profile.interests.join('、')}` : ''}${profile.avoidCrowds ? ', 避开人流密集处' : ''}${profile.notes ? `, 备注: ${profile.notes}` : ''}

## 用户偏好
${args.preferences || '无特殊偏好，推荐最经典的亲子路线'}

## ${destination}可用地点库（只能从以下地点中选择）
${poiListText}

## 输出格式
请返回一个JSON对象，格式如下（只输出JSON，不要其他文字）：
{
  "title": "行程标题（有趣吸引人的）",
  "destination": "${destination}",
  "planningReasoning": "一句话解释为什么这样安排",
  "schedule": [
    {"name": "地点名（必须与上面地点库中的名称完全一致）", "startTime": "09:00", "duration": 90, "segment": "morning"},
    {"name": "地点名", "startTime": "11:00", "duration": 60, "segment": "morning"},
    {"name": "地点名（午餐推荐）", "startTime": "12:30", "duration": 60, "segment": "afternoon"},
    {"name": "地点名", "startTime": "14:30", "duration": 60, "segment": "afternoon"},
    {"name": "地点名", "startTime": "16:30", "duration": 60, "segment": "afternoon"}
  ]
}

要求：
- 上午2-3个景点，下午2-3个景点（含1个午餐）
- 必须从地点库中选择，名称完全一致
- 优先选择高评分(⭐4-5)、适合${args.childAge}岁孩子的景点
- 室内外搭配，避免连续2个以上同类型
- 午餐安排在11:30-12:30之间
- 如果有免费景点(票价¥0)，至少选一个
- 时间安排要合理，考虑步行换场（景点间步行约10-15分钟）
- 行程不要太赶，${ageGroup === 'infant' ? '婴幼组要轻松' : ageGroup === 'preschool' ? '学龄前组节奏适中' : '学龄组可以紧凑些'}`
}

export async function generateTripPlan(args: GenerateTripPlanArgs) {
  const ageGroup = getAgeGroup(args.childAge)
  const destination = args.destination || '大连'

  // Resolve POI pool
  let poiPool = ALL_POIS['大连']!
  for (const key of Object.keys(ALL_POIS)) {
    if (destination.includes(key) || key.includes(destination)) {
      poiPool = ALL_POIS[key]!
      break
    }
  }

  const profile = useMemoryStore.getState().profile

  // Try DeepSeek for personalized plan
  try {
    const prompt = buildLLMPrompt(destination, args, ageGroup, poiPool, profile)
    console.log('[generateTripPlan] calling DeepSeek for personalized plan...')

    const response = await callLLM({
      messages: [
        { role: 'system', content: '你是一个专业的亲子出行规划师。你必须严格按照JSON格式输出行程计划，只能从提供的地点库中选择地点，名称必须完全一致。' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 2048,
    })

    if (response.content) {
      console.log('[generateTripPlan] LLM response:', response.content.slice(0, 300))
      const parsed = JSON.parse(response.content)

      if (parsed.schedule && Array.isArray(parsed.schedule) && parsed.schedule.length > 0) {
        // Look up each selected POI from our database
        const nodes: TripNode[] = []
        const usedNames = new Set<string>()

        for (let i = 0; i < parsed.schedule.length; i++) {
          const item = parsed.schedule[i]
          const match = poiPool.find(
            (p) => p.name === item.name || p.name.includes(item.name) || item.name.includes(p.name),
          )

          if (match && !usedNames.has(match.name)) {
            usedNames.add(match.name)
            const [h, m] = (item.startTime || '09:00').split(':').map(Number)
            nodes.push(poiToTripNode(match, nodes.length, h || 9, m || 0))
          } else if (!match) {
            console.warn(`[generateTripPlan] POI not found: "${item.name}", skipping`)
          }
        }

        if (nodes.length >= 3) {
          // Build trip from LLM selections
          const morningNodes = nodes.filter((n) => {
            const h = parseInt(n.startTime.split(':')[0])
            return h < 12
          })
          const afternoonNodes = nodes.filter((n) => {
            const h = parseInt(n.startTime.split(':')[0])
            return h >= 12
          })

          const day: TripDay = {
            date: args.date || new Date().toISOString().slice(0, 10),
            dayIndex: 0,
            segments: {
              morning: morningNodes,
              afternoon: afternoonNodes,
              evening: [],
            },
          }

          const trip: Trip = {
            id: v4Id(),
            title: parsed.title || `${destination}亲子一日游`,
            destination,
            destinationCoords: destination === '北京' ? [39.9042, 116.4074] : [38.914, 121.615],
            childAge: args.childAge,
            ageGroup,
            mode: ageGroup === 'infant' ? 'relaxed' : 'standard',
            days: [day],
            weatherPlan: 'sunny',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }

          useTripStore.getState().setTrip(trip)

          const allNodes = [...morningNodes, ...afternoonNodes]
          const indoorCount = allNodes.filter((n) => n.indoor).length

          console.log(`[generateTripPlan] ✅ LLM-generated trip: ${trip.title}, ${allNodes.length} nodes (${indoorCount} indoor), reasoning: ${parsed.planningReasoning || 'N/A'}`)

          return {
            tripId: trip.id,
            title: trip.title,
            destination: trip.destination,
            childAge: trip.childAge,
            ageGroup: trip.ageGroup,
            planningReasoning: parsed.planningReasoning || '',
            days: [{
              date: day.date,
              morningCount: morningNodes.length,
              afternoonCount: afternoonNodes.length,
              eveningCount: 0,
            }],
            totalNodes: allNodes.length,
            nodes: allNodes.map((n) => ({
              name: n.name,
              time: n.startTime,
              indoor: n.indoor,
              rating: n.childFriendlinessRating,
            })),
          }
        }
      }
    }
  } catch (err) {
    console.warn('[generateTripPlan] DeepSeek call failed, falling back to smart mock:', err)
  }

  // Fallback to smart mock generator
  console.log('[generateTripPlan] using smart mock fallback')
  const preferences = [
    args.preferences || '',
    profile.interests.join(' '),
    profile.avoidCrowds ? '安静' : '',
    profile.energyLevel === 'low' ? '轻松' : '',
  ].filter(Boolean).join(' ')

  const trip = generateMockTrip(`${args.destination} ${preferences}`, ageGroup)
  if (args.date) trip.days[0].date = args.date
  useTripStore.getState().setTrip(trip)

  return {
    tripId: trip.id,
    title: trip.title,
    destination: trip.destination,
    childAge: trip.childAge,
    ageGroup: trip.ageGroup,
    days: trip.days.map((day) => ({
      date: day.date,
      morningCount: day.segments.morning.length,
      afternoonCount: day.segments.afternoon.length,
      eveningCount: day.segments.evening.length,
    })),
    totalNodes: trip.days.reduce(
      (sum, d) => sum + d.segments.morning.length + d.segments.afternoon.length + d.segments.evening.length,
      0,
    ),
  }
}
