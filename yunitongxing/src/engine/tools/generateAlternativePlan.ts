import { useTripStore } from '../../stores/useTripStore'
import { v4Id } from '../../utils/id'
import { searchPoi, isAmapConfigured } from '../../services/amap'
import type { TripNode } from '../../types/trip'

export interface GenerateAlternativePlanArgs {
  weatherCondition: 'rainy' | 'hot' | 'cold' | 'storm'
  childAge: number
}

const WEATHER_LABELS: Record<string, string> = {
  rainy: '雨天', hot: '高温天', cold: '寒冷', storm: '暴风雨',
}

export async function generateAlternativePlan(args: GenerateAlternativePlanArgs) {
  const tripStore = useTripStore.getState()
  const trip = tripStore.currentTrip

  if (!trip) {
    return { success: false, error: '没有当前行程，先生成一个行程吧' }
  }

  const label = WEATHER_LABELS[args.weatherCondition] || '室内'

  if (!isAmapConfigured()) {
    return {
      success: false,
      error: '需要配置高德API Key才能搜索室内备选方案',
    }
  }

  try {
    const result = await searchPoi({
      keywords: '室内 博物馆 科技馆 儿童乐园 亲子餐厅',
      city: trip.destination,
      offset: 10,
    })

    if (result.pois.length === 0) {
      return { success: false, error: `未找到${trip.destination}的室内备选场所` }
    }

    const ageGroup = args.childAge <= 3 ? 'infant' : args.childAge <= 6 ? 'preschool' : 'school'

    const indoorNodes = result.pois.slice(0, 6).map((poi, i) => {
      if (!poi.location) return null
      const [lng, lat] = poi.location.split(',').map(Number)
      if (!lat || !lng) return null

      const startH = 9 + i * 2
      const rating = poi.biz_ext?.rating ? parseFloat(poi.biz_ext.rating) : 4

      return {
        id: v4Id(),
        type: 'attraction' as TripNode['type'],
        poiType: (poi.typecode?.startsWith('14') ? 'museum'
          : poi.typecode?.startsWith('1101') ? 'park'
          : 'indoor-play') as TripNode['poiType'],
        name: poi.name,
        address: poi.address || '',
        lat,
        lng,
        startTime: `${String(startH).padStart(2, '0')}:00`,
        endTime: `${String(startH + 1).padStart(2, '0')}:30`,
        duration: ageGroup === 'infant' ? 60 : 90,
        dayIndex: 0,
        segment: 'morning' as const,
        walkingFromPrev: null,
        ticketInfo: null,
        childFriendlinessRating: Math.max(1, Math.min(5, Math.round(rating))) as TripNode['childFriendlinessRating'],
        crowdLevel: 2 as TripNode['crowdLevel'],
        tips: [],
        indoor: true,
        photos: (poi.photos || []).slice(0, 5).map((p: { url: string }) => p.url),
        amapId: poi.id,
      } as TripNode
    }).filter(Boolean) as TripNode[]

    if (indoorNodes.length === 0) {
      return { success: false, error: '未找到有效的室内备选场所' }
    }

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
      source: 'amap_live',
      message: `已为您生成${label}备选方案，共${indoorNodes.length}个室内景点`,
    }
  } catch (err) {
    console.warn('[generateAlternativePlan] Amap search failed:', err)
    return { success: false, error: '搜索室内备选方案失败，请稍后重试' }
  }
}
