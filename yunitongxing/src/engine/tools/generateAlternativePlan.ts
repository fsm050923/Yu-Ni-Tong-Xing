import { useTripStore } from '../../stores/useTripStore'
import { v4Id } from '../../utils/id'
import type { TripNode } from '../../types/trip'

export interface GenerateAlternativePlanArgs {
  weatherCondition: 'rainy' | 'hot' | 'cold' | 'storm'
  childAge: number
}

const INDOOR_ALTERNATIVES: Record<string, Array<Partial<TripNode>>> = {
  '大连': [
    { name: '大连圣亚海洋世界', poiType: 'museum', lat: 38.887, lng: 121.586, duration: 120, childFriendlinessRating: 5, crowdLevel: 3, indoor: true },
    { name: '大连自然博物馆', poiType: 'museum', lat: 38.868, lng: 121.592, duration: 90, childFriendlinessRating: 4, crowdLevel: 1, indoor: true },
    { name: '恒隆广场儿童乐园', poiType: 'indoor-play', lat: 38.897, lng: 121.59, duration: 120, childFriendlinessRating: 4, crowdLevel: 2, indoor: true },
    { name: '亲子烘焙体验馆', poiType: 'restaurant', lat: 38.893, lng: 121.588, duration: 90, childFriendlinessRating: 5, crowdLevel: 1, indoor: true },
  ],
  '北京': [
    { name: '中国科技馆', poiType: 'science-center', lat: 39.999, lng: 116.393, duration: 120, childFriendlinessRating: 5, crowdLevel: 2, indoor: true },
    { name: '自然博物馆', poiType: 'museum', lat: 39.882, lng: 116.393, duration: 90, childFriendlinessRating: 4, crowdLevel: 2, indoor: true },
    { name: '蓝港儿童乐园', poiType: 'indoor-play', lat: 39.953, lng: 116.474, duration: 120, childFriendlinessRating: 5, crowdLevel: 3, indoor: true },
    { name: '水立方嬉水乐园', poiType: 'indoor-play', lat: 39.991, lng: 116.386, duration: 120, childFriendlinessRating: 5, crowdLevel: 3, indoor: true },
  ],
}

export async function generateAlternativePlan(args: GenerateAlternativePlanArgs) {
  const tripStore = useTripStore.getState()
  const trip = tripStore.currentTrip

  if (!trip) {
    return { success: false, error: '没有当前行程，先生成一个行程吧' }
  }

  const cityAlts = Object.keys(INDOOR_ALTERNATIVES).find((c) => trip.destination.includes(c))
    ? INDOOR_ALTERNATIVES[trip.destination]
    : INDOOR_ALTERNATIVES['大连']

  const ageGroup = args.childAge <= 3 ? 'infant' : args.childAge <= 6 ? 'preschool' : 'school'

  // Create indoor-only day
  const indoorNodes = cityAlts.map((alt, i) => {
    const startH = 9 + i * 2
    return {
      id: v4Id(),
      type: 'attraction' as TripNode['type'],
      poiType: alt.poiType!,
      name: alt.name!,
      address: '',
      lat: alt.lat!,
      lng: alt.lng!,
      startTime: `${String(startH).padStart(2, '0')}:00`,
      endTime: `${String(startH + 1.5).padStart(2, '0')}:30`,
      duration: ageGroup === 'infant' ? 60 : alt.duration!,
      dayIndex: 0,
      segment: 'morning' as const,
      walkingFromPrev: null,
      ticketInfo: null,
      childFriendlinessRating: alt.childFriendlinessRating!,
      crowdLevel: alt.crowdLevel!,
      tips: [],
      indoor: true,
    } as TripNode
  })

  // Switch to rainy plan in current trip
  tripStore.switchWeatherPlan('rainy')

  return {
    success: true,
    weatherCondition: args.weatherCondition,
    alternativeNodes: indoorNodes.map((n) => ({
      name: n.name,
      poiType: n.poiType,
      lat: n.lat,
      lng: n.lng,
      duration: n.duration,
      rating: n.childFriendlinessRating,
    })),
    message: `已为您生成${args.weatherCondition === 'rainy' ? '雨天' : args.weatherCondition === 'hot' ? '高温天' : '室内'}备选方案，共${indoorNodes.length}个室内景点`,
  }
}
