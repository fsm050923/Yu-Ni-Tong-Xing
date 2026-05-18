import type { Trip, TripNode, TripDay } from '../types/trip'
import { v4Id } from '../utils/id'

export interface POIEntry {
  name: string
  poiType: string
  lat: number
  lng: number
  rating: number
  crowd: number
  indoor: boolean
  keywords: string[]
  tips: string[]
  ticket?: { adult: number; child: number }
}

// Extended POI database with keywords for smart matching
const DALIAN_POIS: POIEntry[] = [
  { name: '大连圣亚海洋世界', poiType: 'museum', lat: 38.887, lng: 121.586, rating: 5, crowd: 3, indoor: true, keywords: ['海洋', '动物', '水族', '表演', '室内'], tips: ['海底隧道必看', '有海豚表演'], ticket: { adult: 190, child: 95 } },
  { name: '金石滩黄金海岸', poiType: 'playground', lat: 39.081, lng: 121.621, rating: 5, crowd: 2, indoor: false, keywords: ['沙滩', '海边', '玩沙', '游泳', '户外'], tips: ['沙子很细', '适合玩沙', '注意防晒'], ticket: { adult: 0, child: 0 } },
  { name: '大连森林动物园', poiType: 'playground', lat: 38.882, lng: 121.630, rating: 5, crowd: 3, indoor: false, keywords: ['动物', '户外', '熊猫', '自然'], tips: ['坐观光车省体力', '散养区很好玩'], ticket: { adult: 120, child: 60 } },
  { name: '大连自然博物馆', poiType: 'museum', lat: 38.868, lng: 121.592, rating: 4, crowd: 1, indoor: true, keywords: ['博物馆', '恐龙', '免费', '室内', '自然'], tips: ['免费入馆', '有恐龙骨架', '人少安静'], ticket: { adult: 0, child: 0 } },
  { name: '发现王国主题公园', poiType: 'playground', lat: 39.095, lng: 121.698, rating: 4, crowd: 4, indoor: false, keywords: ['游乐园', '刺激', '过山车', '户外'], tips: ['大孩子更合适', '排队较长'], ticket: { adult: 220, child: 110 } },
  { name: '星海广场', poiType: 'park', lat: 38.881, lng: 121.583, rating: 5, crowd: 2, indoor: false, keywords: ['广场', '免费', '散步', '户外', '海景'], tips: ['亚洲最大广场', '适合放风筝', '傍晚很舒服'], ticket: { adult: 0, child: 0 } },
  { name: '老虎滩海洋公园', poiType: 'museum', lat: 38.872, lng: 121.679, rating: 5, crowd: 3, indoor: true, keywords: ['海洋', '动物', '表演', '水族'], tips: ['极地馆很赞', '有白鲸表演'], ticket: { adult: 180, child: 90 } },
  { name: '大连贝壳博物馆', poiType: 'museum', lat: 38.885, lng: 121.590, rating: 4, crowd: 1, indoor: true, keywords: ['博物馆', '贝壳', '室内', '安静'], tips: ['贝壳种类超多', '适合安静参观'], ticket: { adult: 100, child: 50 } },
  { name: '棒棰岛风景区', poiType: 'park', lat: 38.903, lng: 121.712, rating: 4, crowd: 2, indoor: false, keywords: ['海边', '自然', '户外', '风景', '散步'], tips: ['海水很清', '适合拍照'], ticket: { adult: 20, child: 0 } },
  { name: '大连儿童公园', poiType: 'playground', lat: 38.913, lng: 121.632, rating: 4, crowd: 2, indoor: false, keywords: ['公园', '儿童', '游乐', '户外', '滑梯'], tips: ['有沙坑和滑梯', '免费'], ticket: { adult: 0, child: 0 } },
  { name: '大连现代博物馆', poiType: 'museum', lat: 38.891, lng: 121.596, rating: 4, crowd: 1, indoor: true, keywords: ['博物馆', '历史', '室内', '安静'], tips: ['了解大连历史', '免费'], ticket: { adult: 0, child: 0 } },
  { name: '傅家庄公园', poiType: 'park', lat: 38.861, lng: 121.618, rating: 4, crowd: 2, indoor: false, keywords: ['海边', '公园', '免费', '户外', '沙滩'], tips: ['有沙滩可以玩', '水质好'], ticket: { adult: 0, child: 0 } },
  { name: '亲子西餐厅咕噜咕噜', poiType: 'restaurant', lat: 38.895, lng: 121.605, rating: 4, crowd: 2, indoor: true, keywords: ['餐厅', '西餐', '儿童', '室内', '吃饭'], tips: ['有儿童套餐和游乐角', '环境好'], ticket: { adult: 80, child: 40 } },
  { name: '海味亲子餐厅', poiType: 'restaurant', lat: 38.899, lng: 121.598, rating: 4, crowd: 2, indoor: true, keywords: ['餐厅', '海鲜', '儿童', '吃饭'], tips: ['海鲜新鲜', '有儿童餐'], ticket: { adult: 100, child: 50 } },
  { name: '鲸MALL亲子商场', poiType: 'indoor-play', lat: 38.888, lng: 121.588, rating: 4, crowd: 2, indoor: true, keywords: ['商场', '室内', '购物', '游乐'], tips: ['下雨天备选', '有室内游乐场'], ticket: { adult: 0, child: 80 } },
]

const BEIJING_POIS: POIEntry[] = [
  { name: '北京动物园', poiType: 'playground', lat: 39.942, lng: 116.337, rating: 5, crowd: 3, indoor: false, keywords: ['动物', '户外', '熊猫', '经典'], tips: ['早点去避开人流', '熊猫馆必看'], ticket: { adult: 15, child: 7 } },
  { name: '中国科技馆', poiType: 'science-center', lat: 39.999, lng: 116.393, rating: 5, crowd: 2, indoor: true, keywords: ['科技', '室内', '互动', '科学'], tips: ['儿童科学乐园适合5-10岁'], ticket: { adult: 30, child: 0 } },
  { name: '朝阳公园', poiType: 'playground', lat: 39.945, lng: 116.481, rating: 4, crowd: 1, indoor: false, keywords: ['公园', '户外', '草坪', '野餐', '免费'], tips: ['有超大草坪可野餐'], ticket: { adult: 0, child: 0 } },
  { name: '自然博物馆', poiType: 'museum', lat: 39.882, lng: 116.393, rating: 4, crowd: 2, indoor: true, keywords: ['博物馆', '恐龙', '自然', '室内'], tips: ['恐龙展厅孩子最爱', '免费需预约'], ticket: { adult: 0, child: 0 } },
  { name: '蓝港儿童乐园', poiType: 'indoor-play', lat: 39.953, lng: 116.474, rating: 5, crowd: 3, indoor: true, keywords: ['游乐', '室内', '商场'], tips: ['周末人多建议工作日'], ticket: { adult: 0, child: 120 } },
  { name: '奥林匹克公园', poiType: 'park', lat: 39.993, lng: 116.392, rating: 4, crowd: 1, indoor: false, keywords: ['公园', '户外', '免费', '运动'], tips: ['可以骑车', '空间大'], ticket: { adult: 0, child: 0 } },
  { name: '亲子餐厅小绿洲', poiType: 'restaurant', lat: 39.960, lng: 116.420, rating: 4, crowd: 2, indoor: true, keywords: ['餐厅', '儿童', '室内', '吃饭', '游乐'], tips: ['有儿童套餐', '有游乐区'], ticket: { adult: 80, child: 40 } },
  { name: '北京天文馆', poiType: 'museum', lat: 39.936, lng: 116.335, rating: 4, crowd: 2, indoor: true, keywords: ['天文', '宇宙', '室内', '科学', '星星'], tips: ['球幕电影很棒'], ticket: { adult: 45, child: 20 } },
  { name: '国家博物馆', poiType: 'museum', lat: 39.905, lng: 116.397, rating: 4, crowd: 4, indoor: true, keywords: ['博物馆', '历史', '室内', '文化'], tips: ['免费需预约', '很大别走太累'], ticket: { adult: 0, child: 0 } },
  { name: '颐和园', poiType: 'park', lat: 39.999, lng: 116.275, rating: 5, crowd: 3, indoor: false, keywords: ['公园', '历史', '户外', '划船', '风景'], tips: ['可以划船', '春天超美'], ticket: { adult: 30, child: 15 } },
  { name: '海淀公园', poiType: 'playground', lat: 39.985, lng: 116.293, rating: 4, crowd: 1, indoor: false, keywords: ['公园', '免费', '户外', '草坪'], tips: ['人少安静', '有儿童游乐区'], ticket: { adult: 0, child: 0 } },
]

// Combine all POIs
export const ALL_POIS: Record<string, POIEntry[]> = { '大连': DALIAN_POIS, '北京': BEIJING_POIS }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function scorePOI(poi: POIEntry, keywords: string[], preferIndoor: boolean): number {
  let score = 0
  for (const kw of keywords) {
    if (poi.keywords.some((k) => k.includes(kw) || kw.includes(k))) score += 3
    if (poi.name.includes(kw)) score += 5
  }
  if (preferIndoor && poi.indoor) score += 2
  if (!preferIndoor && !poi.indoor) score += 1
  // Rating bonus
  score += poi.rating
  return score
}

function extractKeywords(input: string): { keywords: string[]; preferIndoor: boolean } {
  const text = input.toLowerCase()
  const preferIndoor = /室内|下雨|雨天|冬天|冷|热|雾霾/.test(text)

  const keywordMap: Record<string, string[]> = {
    '海洋': ['海洋', '海', '水族', '鱼'],
    '动物': ['动物', '熊猫', '老虎', '狮子', '猴子', '鸟', '恐龙'],
    '科技': ['科技', '科学', '天文', '宇宙', '机器人', '实验'],
    '自然': ['自然', '花', '草', '森林', '植物', '山'],
    '游乐': ['游乐', '乐园', '滑梯', '过山车', '旋转木马', '蹦床'],
    '沙滩': ['沙滩', '沙', '海边', '海', '游泳', '玩水'],
    '博物馆': ['博物馆', '展览', '历史', '文物', '文化'],
    '运动': ['运动', '骑车', '跑步', '球', '游泳', '攀岩'],
  }

  const found: string[] = []
  for (const [topic, kws] of Object.entries(keywordMap)) {
    if (kws.some((kw) => text.includes(kw))) {
      found.push(topic)
    }
  }

  // Extract specific search terms
  if (text.includes('免费')) found.push('免费')
  if (text.includes('安静')) found.push('安静')

  return { keywords: found, preferIndoor }
}

function poiToTripNode(poi: POIEntry, idx: number, segment: 'morning' | 'afternoon' | 'evening', startHour: number): TripNode {
  const duration = segment === 'afternoon' ? 60 : 90
  const startH = startHour % 24
  const endH = (startHour + Math.ceil(duration / 60)) % 24

  return {
    id: v4Id(),
    type: poi.poiType === 'restaurant' ? 'restaurant' : 'attraction',
    poiType: poi.poiType as TripNode['poiType'],
    name: poi.name,
    lat: poi.lat,
    lng: poi.lng,
    startTime: `${String(startH).padStart(2, '0')}:${String(Math.floor(Math.random() * 30)).padStart(2, '0')}`,
    endTime: `${String(endH).padStart(2, '0')}:${String(Math.floor(Math.random() * 30)).padStart(2, '0')}`,
    duration,
    walkingFromPrev: idx > 0 ? { distance: Math.round(200 + Math.random() * 800), estimatedMinutes: Math.round(3 + Math.random() * 12) } : undefined,
    childFriendlinessRating: poi.rating,
    crowdLevel: poi.crowd,
    tips: poi.tips,
    indoor: poi.indoor,
    ticketInfo: poi.ticket ? {
      adultPrice: poi.ticket.adult,
      childPrice: poi.ticket.child,
      childPolicy: poi.ticket.child === 0 ? '儿童免费' : poi.ticket.child < poi.ticket.adult ? '儿童半价' : '全价',
      bookingUrl: '',
      openingHours: '09:00-17:00',
    } : undefined,
  }
}

export function generateMockTrip(userInput: string, ageGroupStr: string): Trip {
  // Detect city
  let city = '大连' // default
  for (const c of Object.keys(ALL_POIS)) {
    if (userInput.includes(c)) { city = c; break }
  }

  const poiPool = ALL_POIS[city as keyof typeof ALL_POIS] || DALIAN_POIS
  const { keywords, preferIndoor } = extractKeywords(userInput)
  const ageGroup = ageGroupStr as 'infant' | 'preschool' | 'school'
  const childAge = ageGroup === 'infant' ? 2 : ageGroup === 'preschool' ? 5 : 8

  // Score and select POIs
  const scored = shuffle(poiPool).map((p) => ({ poi: p, score: scorePOI(p, keywords, preferIndoor) }))
  scored.sort((a, b) => b.score - a.score)

  // Build itinerary: pick top-scored POIs, ensure variety
  const selected: POIEntry[] = []
  const usedTypes = new Set<string>()

  // First pass: pick best matching of each type
  for (const { poi } of scored) {
    if (selected.length >= 5) break
    if (!usedTypes.has(poi.poiType) || selected.length < 3) {
      selected.push(poi)
      usedTypes.add(poi.poiType)
    }
  }

  // If not enough, fill with remaining
  for (const { poi } of scored) {
    if (selected.length >= 5) break
    if (!selected.includes(poi)) selected.push(poi)
  }

  // Ensure at least one restaurant for afternoon
  const hasRestaurant = selected.some((p) => p.poiType === 'restaurant')
  if (!hasRestaurant) {
    const restaurant = poiPool.find((p) => p.poiType === 'restaurant')
    if (restaurant && selected.length >= 3) selected[2] = restaurant
    else if (restaurant) selected.push(restaurant)
  }

  // If prefer indoor, prioritize indoor POIs
  if (preferIndoor) {
    selected.sort((a, b) => (b.indoor ? 1 : 0) - (a.indoor ? 1 : 0))
  }

  const morningNodes = selected.slice(0, 3).map((p, i) => poiToTripNode(p, i, 'morning', 9 + i * 2))
  const afternoonNodes = selected.slice(3, 5).map((p, i) => poiToTripNode(p, i, 'afternoon', 14 + i * 2))

  const day: TripDay = {
    date: new Date().toISOString().slice(0, 10),
    dayIndex: 0,
    segments: { morning: morningNodes, afternoon: afternoonNodes, evening: [] },
  }

  const title = keywords.length > 0
    ? `${city}${keywords[0]}主题亲子游`
    : preferIndoor ? `${city}室内亲子一日游` : `${city}亲子一日游`

  return {
    id: v4Id(),
    title,
    destination: city,
    destinationCoords: city === '北京' ? [39.9042, 116.4074] : [38.914, 121.615],
    childAge,
    ageGroup,
    mode: ageGroup === 'infant' ? 'relaxed' : 'standard',
    days: [day],
    weatherPlan: preferIndoor ? 'rainy' : 'sunny',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}
