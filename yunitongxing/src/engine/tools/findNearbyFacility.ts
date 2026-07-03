import { searchAround, isAmapConfigured } from '../../services/amap'

export interface FindNearbyFacilityArgs {
  lat: number
  lng: number
  facilityType: 'nursery' | 'restroom' | 'water-fountain' | 'restaurant'
  maxDistance?: number
}

const FACILITY_KEYWORDS: Record<string, string> = {
  nursery: '母婴室',
  restroom: '卫生间',
  'water-fountain': '饮水处|便利店',
  restaurant: '亲子餐厅|儿童餐厅',
}

const FACILITY_LABELS: Record<string, string> = {
  nursery: '母婴室',
  restroom: '亲子卫生间',
  'water-fountain': '饮水处',
  restaurant: '亲子餐厅',
}

export async function findNearbyFacility(args: FindNearbyFacilityArgs) {
  const maxDist = args.maxDistance || 500
  const keywords = FACILITY_KEYWORDS[args.facilityType] || args.facilityType

  if (!isAmapConfigured()) {
    return {
      facilityType: args.facilityType,
      label: FACILITY_LABELS[args.facilityType] || args.facilityType,
      location: { lat: args.lat, lng: args.lng },
      nearby: [],
      count: 0,
      source: 'no_api_key',
    }
  }

  try {
    const result = await searchAround({
      location: `${args.lng},${args.lat}`,
      keywords,
      radius: maxDist,
      offset: 10,
    })

    const nearby = result.pois
      .filter((p) => p.location)
      .map((p) => {
        const [lng, lat] = p.location.split(',').map(Number)
        const distance = p.distance ? parseInt(p.distance) : 0
        return {
          name: p.name,
          lat,
          lng,
          distance,
          walkTime: Math.round(distance / 80),
        }
      })
      .filter((f) => f.distance <= maxDist)
      .sort((a, b) => a.distance - b.distance)

    return {
      facilityType: args.facilityType,
      label: FACILITY_LABELS[args.facilityType] || args.facilityType,
      location: { lat: args.lat, lng: args.lng },
      nearby,
      count: nearby.length,
      source: 'amap_live',
    }
  } catch (err) {
    console.warn('[findNearbyFacility] Amap search failed:', err)
    return {
      facilityType: args.facilityType,
      label: FACILITY_LABELS[args.facilityType] || args.facilityType,
      location: { lat: args.lat, lng: args.lng },
      nearby: [],
      count: 0,
      source: 'error',
    }
  }
}
