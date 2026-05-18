export interface FindNearbyFacilityArgs {
  lat: number
  lng: number
  facilityType: 'nursery' | 'restroom' | 'water-fountain' | 'restaurant'
  maxDistance?: number
}

const MOCK_FACILITIES: Record<string, Array<{ name: string; lat: number; lng: number; distance: number }>> = {
  nursery: [
    { name: '母婴室(A区)', lat: 38.887, lng: 121.588, distance: 120 },
    { name: '母婴室(B区)', lat: 38.885, lng: 121.583, distance: 250 },
    { name: '家庭卫生间(母婴)', lat: 38.89, lng: 121.59, distance: 180 },
  ],
  restroom: [
    { name: '亲子卫生间', lat: 38.886, lng: 121.587, distance: 80 },
    { name: '儿童卫生间', lat: 38.888, lng: 121.589, distance: 150 },
  ],
  'water-fountain': [
    { name: '饮水处(南门)', lat: 38.885, lng: 121.585, distance: 100 },
    { name: '热水供应点', lat: 38.888, lng: 121.59, distance: 200 },
  ],
  restaurant: [
    { name: '亲子餐厅·海洋主题', lat: 38.888, lng: 121.587, distance: 100 },
    { name: '儿童套餐专门店', lat: 38.886, lng: 121.586, distance: 150 },
  ],
}

export async function findNearbyFacility(args: FindNearbyFacilityArgs) {
  const facilities = MOCK_FACILITIES[args.facilityType] || []
  const maxDist = args.maxDistance || 500

  const nearby = facilities
    .filter((f) => f.distance <= maxDist)
    .sort((a, b) => a.distance - b.distance)

  const labels: Record<string, string> = {
    nursery: '母婴室',
    restroom: '亲子卫生间',
    'water-fountain': '饮水处',
    restaurant: '亲子餐厅',
  }

  return {
    facilityType: args.facilityType,
    label: labels[args.facilityType] || args.facilityType,
    location: { lat: args.lat, lng: args.lng },
    nearby: nearby.map((f) => ({
      name: f.name,
      lat: f.lat,
      lng: f.lng,
      distance: f.distance,
      walkTime: Math.round(f.distance / 80), // approximate walk time in minutes
    })),
    count: nearby.length,
  }
}
