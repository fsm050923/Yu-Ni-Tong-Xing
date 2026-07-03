import { useTripStore } from '../../stores/useTripStore'
import { useMemoryStore } from '../../stores/useMemoryStore'
import { v4Id } from '../../utils/id'
import { callLLM } from '../../services/llm'
import { searchPoi as amapSearchPoi, isAmapConfigured, type AmapPOI } from '../../services/amap'
import { generateMockTrip } from '../mock-trip-generator'
import type { Trip, TripNode, TripDay, AgeGroup } from '../../types/trip'

export interface GenerateTripPlanArgs {
  destination: string
  date?: string
  childAge: number
  duration?: number // days
  preferences?: string
}

function getAgeGroup(age: number): AgeGroup {
  return age <= 3 ? 'infant' : age <= 6 ? 'preschool' : 'school'
}

function detectDays(input: string, duration?: number): number {
  if (duration && duration > 0) return Math.min(duration, 5)
  if (/[两三3]天|[两三3]日|周末/.test(input)) return /周末/.test(input) ? 2 : 3
  if (/[一两2]天|[一两2]日/.test(input)) return 2
  if (/[四五4]天/.test(input)) return 4
  if (/[五5]天/.test(input)) return 5
  return 1
}

function getKidFactFallback(name: string, type: string): string[] {
  const FACT_DB: Record<string, string> = {
    '海洋': '海豚睡觉时只有一半大脑休息，另一半保持清醒！',
    '动物': '长颈鹿的舌头有50厘米长，可以舔到自己的耳朵哦～',
    '恐龙': '霸王龙的前肢只有1米长，比成年人的手臂还短！',
    '博物馆': '中国最早的博物馆是1905年建成的南通博物苑。',
    '科技馆': '声音在空气中的传播速度是每秒340米，比高铁快3倍！',
    '公园': '一棵成年大树一天能吸收16公斤二氧化碳，释放氧气。',
    '天文': '太阳光到达地球需要8分20秒，你看到的太阳是8分钟前的！',
    '自然': '蜜蜂采一斤蜂蜜需要飞45万公里，相当于绕地球11圈！',
    '贝壳': '世界上最大的贝壳是砗磲，可以长到1.3米长，重200多公斤。',
    '广场': '星海广场是世界最大的城市广场之一，面积比两个北京故宫还大！',
    '游乐园': '最快的过山车时速可达240公里，比高铁还要快！',
    '海滩': '沙滩上的沙子大多是被河流冲刷几百公里带来的岩石碎片。',
    '海洋世界': '世界上最大的动物蓝鲸，它的心脏有一辆小汽车那么大！',
    '森林': '森林里的树木通过地下菌丝网络互相传递营养和信号！',
    '景观': '地球上有超过10万种不同的树木，每一种都是大自然的馈赠。',
  }

  for (const [key, fact] of Object.entries(FACT_DB)) {
    if (name.includes(key) || type?.includes(key)) {
      return [fact]
    }
  }

  // Default fallback based on POI name
  return [`${name}是${type || '一个很棒的地方'}，带着好奇心一起去探索吧！`]
}

function amapPoiToRichNode(
  poi: AmapPOI,
  idx: number,
  startTime: string,
  segment: TripNode['segment'],
  dayIndex: number,
): TripNode | null {
  if (!poi.location) return null
  const [lng, lat] = poi.location.split(',').map(Number)
  if (!lat || !lng) return null

  const [startH, startM] = startTime.split(':').map(Number)
  const duration = 60 + Math.floor(Math.random() * 30)
  const endTotalMin = startH * 60 + startM + duration
  const endH = Math.floor(endTotalMin / 60) % 24
  const endM = endTotalMin % 60

  const isRestaurant = poi.typecode?.startsWith('05') || poi.type?.includes('餐饮')
  const rating = poi.biz_ext?.rating ? parseFloat(poi.biz_ext.rating) : 4
  const ratingClamped = Math.max(1, Math.min(5, Math.round(rating))) as TripNode['childFriendlinessRating']

  return {
    id: v4Id(),
    type: isRestaurant ? 'restaurant' : 'attraction',
    poiType: (isRestaurant ? 'restaurant' : poi.typecode?.startsWith('1101')
      ? 'park'
      : poi.typecode?.startsWith('14')
        ? 'museum'
        : 'playground') as TripNode['poiType'],
    name: poi.name,
    address: poi.address || '',
    lat,
    lng,
    startTime,
    endTime: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
    duration,
    dayIndex,
    segment,
    walkingFromPrev: idx > 0 ? { distance: 300 + Math.floor(Math.random() * 800), duration: 5 + Math.floor(Math.random() * 12), childFriendly: true } : null,
    ticketInfo: null,
    childFriendlinessRating: ratingClamped,
    crowdLevel: 2 as TripNode['crowdLevel'],
    tips: [],
    indoor: false,
    photos: (poi.photos || []).slice(0, 5).map((p: { url: string }) => p.url),
    description: poi.address || '',
    amapId: poi.id,
    tel: poi.tel,
    rating,
  }
}

function buildMultiDayPrompt(
  destination: string,
  args: GenerateTripPlanArgs,
  ageGroup: AgeGroup,
  numDays: number,
  pois: AmapPOI[],
  profile: ReturnType<typeof useMemoryStore.getState>['profile'],
): string {
  const ageLabels: Record<AgeGroup, string> = { infant: '0-3岁 婴幼', preschool: '4-6岁 学龄前', school: '7-12岁 学龄' }
  const dayRules: Record<AgeGroup, string> = {
    infant: '每天不超过4个景点，2-3个即可，节奏放慢',
    preschool: '每天3-5个景点，上午2个下午2个',
    school: '每天4-6个景点，节奏可以紧凑',
  }

  const poiText = pois.map((p, i) =>
    `${i}. ${p.name} | ${p.type || ''} | ${p.address || ''} | loc:${p.location}` +
    (p.biz_ext?.rating ? ` | ★${p.biz_ext.rating}` : '') +
    (p.tel ? ` | tel:${p.tel}` : '')
  ).join('\n')

  return `为${args.childAge}岁孩子（${ageLabels[ageGroup]}）规划${destination} ${numDays}日亲子游。

## 孩子信息
${profile.childName ? `名字:${profile.childName} ` : ''}年龄:${args.childAge}岁${profile.energyLevel ? ` 体力:${profile.energyLevel}` : ''}${profile.interests.length ? ` 兴趣:${profile.interests.join('、')}` : ''}${profile.avoidCrowds ? ' 避人流密集' : ''}

## 节奏要求
${dayRules[ageGroup]}

## 偏好
${args.preferences || '推荐最经典亲子路线'}

## ${destination}可用地点（高德实时搜，必须从中选择）
${poiText}

## 输出JSON（只输出JSON，不要其他文字）
{
  "title": "${destination}${numDays}日亲子游",
  "days": [
    {
      "schedule": [
        {"name": "地点名", "startTime": "09:00", "segment": "morning", "kidFact": "讲给孩子的小知识（10-20字，趣味科普）"},
        {"name": "地点名", "startTime": "11:00", "segment": "morning", "kidFact": ""},
        {"name": "午餐推荐名", "startTime": "12:30", "segment": "afternoon", "kidFact": ""}
      ]
    }
  ]
}

要求：
- 每天schedule中上午1-3个、下午2-3个（含1个午餐）
- 地点名必须与上面完全一致
- **严禁跨天重复：不同天不能出现同一个地点名，每个地点只能用一次**
- 优先选择★评分高的热门景点（≥4.0优先），高评分景点放在每天的黄金时段
- 室内外搭配，避免同类连续
- 每天不同区域/主题
- kidFact为10-20字科普小知识，方便家长讲给孩子听；景点必有kidFact，餐厅可为空
- ${numDays}个day对象，schedule数组不用太满`
}

export async function generateTripPlan(args: GenerateTripPlanArgs) {
  const ageGroup = getAgeGroup(args.childAge)
  const destination = args.destination || '大连'
  const profile = useMemoryStore.getState().profile
  const numDays = detectDays(args.preferences || '', args.duration)

  console.log(`[generateTripPlan] destination="${destination}" age=${args.childAge} days=${numDays}`)

  // Step 1: Search real POIs from Amap
  let pois: AmapPOI[] = []

  if (isAmapConfigured()) {
    try {
      console.log(`[generateTripPlan] searching Amap for: "${destination}"`)
      // Diverse keyword strategy: family-friendly + popular attractions + hidden gems
      const queries = [
        { kw: '热门景点 必玩 5A', offset: 15 },
        { kw: '亲子 儿童 游乐 公园 博物馆', offset: 15 },
        { kw: '网红打卡 人气 推荐', offset: 10 },
      ]
      const results = await Promise.all(queries.map((q) =>
        amapSearchPoi({ keywords: q.kw, city: destination, offset: q.offset })
      ))
      const seen = new Set<string>()
      pois = results.flatMap((r) => r.pois).filter((p) => {
        if (!p.name || seen.has(p.id)) return false
        seen.add(p.id)
        return true
      })
      // Sort by rating (highest first), then take top results
      pois.sort((a, b) => {
        const ra = a.biz_ext?.rating ? parseFloat(a.biz_ext.rating) : 0
        const rb = b.biz_ext?.rating ? parseFloat(b.biz_ext.rating) : 0
        return rb - ra
      })
      pois = pois.slice(0, numDays >= 3 ? 30 : 20)
      console.log(`[generateTripPlan] Amap returned ${pois.length} POIs for ${numDays} days`)
    } catch (err) {
      console.warn('[generateTripPlan] Amap search failed:', err)
    }
  }

  if (pois.length < 2) {
    console.log('[generateTripPlan] Amap returned too few POIs, using local fallback')
    return generateFallbackTrip(args, ageGroup, destination, profile, numDays)
  }

  // Step 2: Ask DeepSeek to plan from real POIs
  try {
    const prompt = buildMultiDayPrompt(destination, args, ageGroup, numDays, pois, profile)
    console.log('[generateTripPlan] asking DeepSeek to plan from real POIs...')

    const response = await callLLM({
      messages: [
        { role: 'system', content: '你是亲子出行规划师。严格输出JSON，只能从提供的地点库中选择。优先推荐★评分最高的热门景点。' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 3072,
    })

    if (response.content) {
      const parsed = JSON.parse(response.content)
      const daysData = parsed.days && Array.isArray(parsed.days) ? parsed.days : [{ schedule: parsed.schedule }]

      const tripDays: TripDay[] = []
      const usedPoiIds = new Set<string>() // cross-day dedup

      for (let d = 0; d < daysData.length && d < 5; d++) {
        const schedule = daysData[d]?.schedule || []
        if (!Array.isArray(schedule) || schedule.length === 0) continue

        const nodes: TripNode[] = []
        const dayUsedNames = new Set<string>() // within-day dedup

        for (let i = 0; i < schedule.length; i++) {
          const item = schedule[i]
          if (!item.name || dayUsedNames.has(item.name)) continue

          const match = pois.find(
            (p) => p.name === item.name || p.name.includes(item.name) || item.name.includes(p.name),
          )
          if (!match || usedPoiIds.has(match.id)) continue

          usedPoiIds.add(match.id)
          dayUsedNames.add(item.name)

          const node = amapPoiToRichNode(match, nodes.length, item.startTime || '09:00', item.segment || 'morning', d)
          if (node) {
            // Attach kid fact from LLM response or fallback
            if (item.kidFact) {
              node.tips = [item.kidFact]
            } else {
              node.tips = getKidFactFallback(match.name, match.type || '')
            }
            nodes.push(node)
          }
        }

        if (nodes.length >= 2) {
          const date = new Date()
          date.setDate(date.getDate() + d)
          tripDays.push({
            date: args.date ? new Date(args.date).toISOString().slice(0, 10) : date.toISOString().slice(0, 10),
            dayIndex: d,
            segments: {
              morning: nodes.filter((n) => n.segment === 'morning'),
              afternoon: nodes.filter((n) => n.segment === 'afternoon'),
              evening: nodes.filter((n) => n.segment === 'evening'),
            },
          })
        }
      }

      if (tripDays.length > 0) {
        const trip: Trip = {
          id: v4Id(),
          title: parsed.title || `${destination}${numDays}日亲子游`,
          destination,
          destinationCoords: pois[0]?.location
            ? (pois[0].location.split(',').map(Number).reverse() as [number, number])
            : [39.9042, 116.4074],
          childAge: args.childAge,
          ageGroup,
          mode: ageGroup === 'infant' ? 'relaxed' : 'standard',
          days: tripDays,
          weatherPlan: 'sunny',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }

        useTripStore.getState().setTrip(trip)
        console.log(`[generateTripPlan] ✅ ${trip.title}, ${tripDays.length} days, ${tripDays.reduce((s, d) => s + d.segments.morning.length + d.segments.afternoon.length, 0)} nodes from Amap`)

        return buildResult(trip)
      }
    }
  } catch (err) {
    console.warn('[generateTripPlan] DeepSeek planning failed:', err)
  }

  return generateFallbackTrip(args, ageGroup, destination, profile, numDays)
}

function generateFallbackTrip(
  args: GenerateTripPlanArgs, ageGroup: AgeGroup, destination: string,
  profile: ReturnType<typeof useMemoryStore.getState>['profile'], numDays: number,
) {
  const prefs = [args.preferences || '', profile.interests.join(' '), profile.avoidCrowds ? '安静' : ''].filter(Boolean).join(' ')
  const trip = generateMockTrip(`${destination} ${numDays > 1 ? numDays + '天' : ''} ${prefs}`, ageGroup)
  if (args.date) trip.days[0].date = args.date
  useTripStore.getState().setTrip(trip)
  return buildResult(trip)
}

function buildResult(trip: Trip) {
  const allNodes = trip.days.flatMap((d) => [...d.segments.morning, ...d.segments.afternoon, ...d.segments.evening])
  return {
    tripId: trip.id, title: trip.title, destination: trip.destination,
    childAge: trip.childAge, ageGroup: trip.ageGroup,
    days: trip.days.map((day) => ({
      date: day.date,
      morningCount: day.segments.morning.length,
      afternoonCount: day.segments.afternoon.length,
    })),
    totalDays: trip.days.length,
    totalNodes: allNodes.length,
    nodes: allNodes.map((n) => ({ name: n.name, time: n.startTime, indoor: n.indoor, photos: n.photos?.length || 0 })),
  }
}
