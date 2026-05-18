import { findNearbyFacility } from './findNearbyFacility'

export interface SuggestRestSpotArgs {
  childAge: number
  elapsedMinutes: number
  lat: number
  lng: number
}

export async function suggestRestSpot(args: SuggestRestSpotArgs) {
  // Age-based thresholds for suggesting rest
  const maxPlayTime: Record<string, number> = {
    infant: 90,    // 0-3: rest every 90 min
    preschool: 120, // 4-6: rest every 120 min
    school: 150,    // 7-12: rest every 150 min
  }

  const ageGroup = args.childAge <= 3 ? 'infant' : args.childAge <= 6 ? 'preschool' : 'school'
  const threshold = maxPlayTime[ageGroup]
  const needsRest = args.elapsedMinutes >= threshold

  // Find nearby facilities
  const [restaurants, nurseries] = await Promise.all([
    findNearbyFacility({ lat: args.lat, lng: args.lng, facilityType: 'restaurant', maxDistance: 500 }),
    findNearbyFacility({ lat: args.lat, lng: args.lng, facilityType: 'nursery', maxDistance: 300 }),
  ])

  return {
    childAge: args.childAge,
    ageGroup,
    elapsedMinutes: args.elapsedMinutes,
    needsRest,
    threshold,
    recommendation: needsRest
      ? `孩子已游玩${args.elapsedMinutes}分钟，建议休息！${ageGroup === 'infant' ? '婴幼儿需要频繁休息' : '让孩子歇歇吧'}`
      : `当前已游玩${args.elapsedMinutes}分钟，还可以继续玩${threshold - args.elapsedMinutes}分钟`,
    nearbyRest: restaurants.nearby.slice(0, 2).map((r) => ({
      name: r.name,
      distance: r.distance,
      walkTime: r.walkTime,
    })),
    nearbyNursery: ageGroup === 'infant' ? nurseries.nearby.slice(0, 1) : [],
    suggestedRestDuration: ageGroup === 'infant' ? 30 : 20,
  }
}
