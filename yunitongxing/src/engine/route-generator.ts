import type { TripNode } from '../types/trip'

interface RoutePoint {
  lat: number
  lng: number
}

interface RouteSegment {
  from: RoutePoint
  to: RoutePoint
  distance: number
  estimatedMinutes: number
  points: RoutePoint[]
}

/**
 * Generate intermediate route points between two nodes.
 * Uses simple linear interpolation with slight random offset for a natural look.
 */
export function generateRoutePoints(from: RoutePoint, to: RoutePoint, steps = 8): RoutePoint[] {
  const points: RoutePoint[] = []
  const midLat = (from.lat + to.lat) / 2
  const midLng = (from.lng + to.lng) / 2
  const perpLat = -(to.lng - from.lng) * 0.15
  const perpLng = (to.lat - from.lat) * 0.15

  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    // Quadratic bezier for a gentle curve
    const lat = (1 - t) ** 2 * from.lat + 2 * (1 - t) * t * (midLat + perpLat) + t ** 2 * to.lat
    const lng = (1 - t) ** 2 * from.lng + 2 * (1 - t) * t * (midLng + perpLng) + t ** 2 * to.lng
    points.push({ lat, lng })
  }

  return points
}

/**
 * Calculate approximate distance between two coordinates (Haversine in meters)
 */
export function haversineDistance(a: RoutePoint, b: RoutePoint): number {
  const R = 6371000
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const sinDlat = Math.sin(dLat / 2)
  const sinDlng = Math.sin(dLng / 2)
  const h = sinDlat * sinDlat + Math.cos(lat1) * Math.cos(lat2) * sinDlng * sinDlng
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

/**
 * Generate full route segments for a sequence of nodes with distance and times
 */
export function generateRouteSegments(nodes: TripNode[]): RouteSegment[] {
  const segments: RouteSegment[] = []

  for (let i = 1; i < nodes.length; i++) {
    const from = { lat: nodes[i - 1].lat, lng: nodes[i - 1].lng }
    const to = { lat: nodes[i].lat, lng: nodes[i].lng }
    const distance = Math.round(haversineDistance(from, to))
    const estimatedMinutes = Math.round(distance / 75) // ~75m/min walking speed

    segments.push({
      from,
      to,
      distance,
      estimatedMinutes,
      points: generateRoutePoints(from, to, Math.min(10, Math.max(4, Math.round(distance / 200)))),
    })
  }

  return segments
}

/**
 * Estimate walking duration in minutes between two points
 */
export function estimateWalkingTime(from: RoutePoint, to: RoutePoint, childAge: number): number {
  const distance = haversineDistance(from, to)
  // Adjust speed by age: 0-3: 50m/min, 4-6: 70m/min, 7-12: 85m/min
  const speed = childAge <= 3 ? 50 : childAge <= 6 ? 70 : 85
  return Math.round(distance / speed)
}

/**
 * Generate a complete set of polylines for map rendering grouped by segment type
 */
export function generateTripPolylines(nodes: TripNode[]): Array<{
  segment: string
  points: [number, number][]
  color: string
}> {
  const polylines: Array<{ segment: string; points: [number, number][]; color: string }> = []
  const segments = generateRouteSegments(nodes)

  const segmentColors: Record<string, string> = {
    morning: '#FFB347',
    afternoon: '#FF6B6B',
    evening: '#7B68EE',
  }

  for (const seg of segments) {
    // Determine time of day from midpoint
    const midLat = (seg.from.lat + seg.to.lat) / 2
    const midLng = (seg.from.lng + seg.to.lng) / 2
    const hour = 11 // Default midday; in real usage derive from node startTime

    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'

    polylines.push({
      segment: timeOfDay,
      points: seg.points.map((p) => [p.lat, p.lng]),
      color: segmentColors[timeOfDay] || '#FFB347',
    })
  }

  return polylines
}
