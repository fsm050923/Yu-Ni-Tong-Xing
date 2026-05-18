interface GeoResult {
  lat: number
  lng: number
  displayName: string
  city: string
}

// Hard-coded Chinese city coordinates for common destinations
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  '北京': { lat: 39.9042, lng: 116.4074 },
  '大连': { lat: 38.9140, lng: 121.6147 },
  '上海': { lat: 31.2304, lng: 121.4737 },
  '广州': { lat: 23.1291, lng: 113.2644 },
  '深圳': { lat: 22.5431, lng: 114.0579 },
  '成都': { lat: 30.5728, lng: 104.0668 },
  '杭州': { lat: 30.2741, lng: 120.1551 },
  '南京': { lat: 32.0603, lng: 118.7969 },
  '西安': { lat: 34.3416, lng: 108.9398 },
  '厦门': { lat: 24.4798, lng: 118.0819 },
  '三亚': { lat: 18.2528, lng: 109.5120 },
  '武汉': { lat: 30.5928, lng: 114.3055 },
  '重庆': { lat: 29.4316, lng: 106.9123 },
  '青岛': { lat: 36.0671, lng: 120.3826 },
  '苏州': { lat: 31.2990, lng: 120.5853 },
}

/**
 * Geocode a place name to coordinates.
 * For demo, uses a hard-coded city database + offset for POI names.
 */
export async function geocode(query: string): Promise<GeoResult | null> {
  // Try exact city match
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (query.includes(city)) {
      return {
        lat: coords.lat + (Math.random() - 0.5) * 0.05,
        lng: coords.lng + (Math.random() - 0.5) * 0.05,
        displayName: query,
        city,
      }
    }
  }

  // Fuzzy search
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    const queryChars = [...query]
    const cityChars = [...city]
    const overlap = queryChars.filter((c) => cityChars.includes(c)).length
    if (overlap >= Math.min(cityChars.length * 0.5, 2)) {
      return {
        lat: coords.lat + (Math.random() - 0.5) * 0.1,
        lng: coords.lng + (Math.random() - 0.5) * 0.1,
        displayName: query,
        city,
      }
    }
  }

  // Default to Dalian
  return {
    lat: CITY_COORDS['大连'].lat,
    lng: CITY_COORDS['大连'].lng,
    displayName: query,
    city: '大连',
  }
}

/**
 * Reverse geocode coordinates to an address/POI name
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  let closest = { city: '大连', distance: Infinity }

  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    const d = Math.sqrt((lat - coords.lat) ** 2 + (lng - coords.lng) ** 2)
    if (d < closest.distance) {
      closest = { city, distance: d }
    }
  }

  return `${closest.city} (${lat.toFixed(4)}, ${lng.toFixed(4)})`
}

/**
 * Get city coordinates directly
 */
export function getCityCoords(city: string): { lat: number; lng: number } | null {
  return CITY_COORDS[city] || null
}
