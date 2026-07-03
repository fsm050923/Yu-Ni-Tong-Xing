// ============ 高德地图 Web API 服务层 ============
// 文档: https://lbs.amap.com/api/webservice/summary

const BASE_URL = 'https://restapi.amap.com/v3'

function getApiKey(): string {
  // @ts-ignore Vite env
  return import.meta.env.VITE_AMAP_API_KEY || ''
}

function hasApiKey(): boolean {
  const key = getApiKey()
  return !!(key && key !== 'your_amap_key_here')
}

async function request<T>(endpoint: string, params: Record<string, string | number | undefined>): Promise<T> {
  const key = getApiKey()
  if (!key || key === 'your_amap_key_here') throw new Error('AMAP_KEY_MISSING')

  const url = new URL(`${BASE_URL}${endpoint}`)
  url.searchParams.set('key', key)
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v))
  }

  console.log(`[Amap] GET ${endpoint}?${url.searchParams.toString().replace(key, '***')}`)
  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) })
  if (!res.ok) throw new Error(`Amap API ${res.status}`)
  const json = await res.json()
  if (json.status !== '1') throw new Error(`Amap error: ${json.info || 'unknown'}`)
  return json as T
}

// ============ 类型定义 ============

export interface AmapPOI {
  id: string
  name: string
  type: string
  typecode: string
  address: string
  location: string // "lng,lat"
  distance?: string
  tel?: string
  website?: string
  photos?: Array<{ url: string; title?: string }>
  biz_ext?: { rating?: string; cost?: string; open_time?: string }
  childtype?: string // "1" means child-friendly
  children?: Array<{
    id: string
    name: string
    location: string
    address: string
    distance?: string
  }>
}

export interface AmapWeather {
  province: string
  city: string
  adcode: string
  reporttime: string
  casts: Array<{
    date: string
    week: string
    dayweather: string
    nightweather: string
    daytemp: string
    nighttemp: string
    daywind: string
    nightwind: string
    daypower: string
    nightpower: string
  }>
}

export interface AmapWalkingRoute {
  origin: string
  destination: string
  distance: string
  duration: string
  paths: Array<{
    distance: string
    duration: string
    steps: Array<{
      instruction: string
      road: string
      distance: string
      duration: string
      polyline: string
      action: string
      assistant_action: string
    }>
  }>
}

export interface GeocodeResult {
  address: string
  location: [number, number] // [lng, lat]
  adcode: string
  city: string
  district: string
}

// ============ API 方法 ============

// 亲子友好 POI 类型码
const CHILD_FRIENDLY_TYPES = '110000|110100|080500|080507|080508|080509|140000|140200|141000'

// 搜索 POI
export async function searchPoi(params: {
  keywords?: string
  types?: string
  city?: string
  citylimit?: boolean
  offset?: number
  page?: number
  children?: number // 1=只返回亲子POI
}): Promise<{ pois: AmapPOI[]; count: string }> {
  if (!hasApiKey()) return mockSearchPoi(params)

  const types = params.types || (params.children === 1 ? CHILD_FRIENDLY_TYPES : undefined)

  const data = await request<{ count: string; pois: AmapPOI[] }>('/place/text', {
    keywords: params.keywords?.replace(/\s+/g, '|'),
    types,
    city: params.city,
    citylimit: params.citylimit ? 'true' : undefined,
    offset: params.offset || 20,
    page: params.page || 1,
    extensions: 'all',
    children: params.children || 0,
  })

  return { pois: data.pois || [], count: data.count }
}

// 周边搜索
export async function searchAround(params: {
  location: string // "lng,lat"
  keywords?: string
  types?: string
  radius?: number
  offset?: number
  children?: number
}): Promise<{ pois: AmapPOI[]; count: string }> {
  if (!hasApiKey()) return mockSearchPoi({ ...params, city: '' })

  const types = params.types || (params.children === 1 ? CHILD_FRIENDLY_TYPES : undefined)

  const data = await request<{ count: string; pois: AmapPOI[] }>('/place/around', {
    location: params.location,
    keywords: params.keywords?.replace(/\s+/g, '|'),
    types,
    radius: params.radius || 3000,
    offset: params.offset || 20,
    extensions: 'all',
    children: params.children || 0,
  })

  return { pois: data.pois || [], count: data.count }
}

// 地理编码 (地址→坐标)
export async function geocode(address: string, city?: string): Promise<GeocodeResult | null> {
  if (!hasApiKey()) return mockGeocode(address)

  const data = await request<{
    geocodes: Array<{
      formatted_address: string
      location: string
      adcode: string
      city: string
      district: string
    }>
  }>('/geocode/geo', { address, city })

  if (!data.geocodes?.length) return null
  const g = data.geocodes[0]
  const [lng, lat] = g.location.split(',').map(Number)
  return {
    address: g.formatted_address,
    location: [lng, lat],
    adcode: g.adcode,
    city: g.city || city || '',
    district: g.district || '',
  }
}

// 逆地理编码 (坐标→地址)
export async function regeo(lng: number, lat: number): Promise<string> {
  if (!hasApiKey()) return `(${lng.toFixed(4)}, ${lat.toFixed(4)})`

  const data = await request<{ regeocode: { formatted_address: string } }>('/geocode/regeo', {
    location: `${lng},${lat}`,
    extensions: 'base',
  })

  return data.regeocode?.formatted_address || ''
}

// 天气查询
export async function getWeather(city: string): Promise<AmapWeather | null> {
  if (!hasApiKey()) return mockWeather(city)

  // First get adcode by city name
  const geo = await geocode(city)
  if (!geo) return null

  const data = await request<{ forecasts: AmapWeather[] }>('/weather/weatherInfo', {
    city: geo.adcode,
    extensions: 'all',
  })

  return data.forecasts?.[0] || null
}

// 步行路线规划
export async function walkingRoute(
  origin: string, // "lng,lat"
  destination: string, // "lng,lat"
): Promise<{ distance: number; duration: number; polyline: string } | null> {
  if (!hasApiKey()) {
    const dist = 300 + Math.random() * 1200
    return { distance: dist, duration: dist / 50, polyline: `${origin};${destination}` }
  }

  const data = await request<{ route: { paths: Array<{ distance: string; duration: string; steps: Array<{ polyline: string }> }> } }>(
    '/direction/walking',
    { origin, destination },
  )

  if (!data.route?.paths?.length) return null
  const path = data.route.paths[0]
  const polyline = path.steps.map((s) => s.polyline).join(';')
  return {
    distance: parseInt(path.distance),
    duration: parseInt(path.duration) / 60, // seconds → minutes
    polyline,
  }
}

// 输入提示
export async function inputTips(keywords: string, city?: string): Promise<Array<{ name: string; address: string; location: string }>> {
  if (!hasApiKey()) return []

  const data = await request<{
    tips: Array<{ name: string; address: string; location: string; district: string }>
  }>('/assistant/inputtips', {
    keywords,
    city,
    citylimit: 'false',
  })

  return (data.tips || [])
    .filter((t) => t.location && t.location.length > 0)
    .map((t) => ({ name: t.name, address: t.address, location: t.location }))
}

// ============ Mock Fallbacks ============

function mockSearchPoi(params: {
  keywords?: string
  city?: string
  types?: string
  children?: number
  location?: string
  radius?: number
}): { pois: AmapPOI[]; count: string } {
  const kw = params.keywords || '亲子'
  const city = params.city || '大连'

  // Generate varied mock POIs based on keywords
  const mockNames: Record<string, string[]> = {
    '博物馆': [`${city}自然博物馆`, `${city}历史博物馆`, `${city}科技馆`, `${city}海洋博物馆`],
    '公园': [`${city}中央公园`, `${city}儿童公园`, `${city}森林公园`, `${city}湿地公园`],
    '游乐': [`${city}欢乐世界`, `${city}儿童乐园`, `${city}亲子游乐场`, `${city}主题公园`],
    '海洋': [`${city}海洋世界`, `${city}极地馆`, `${city}水族馆`, `${city}海底世界`],
    '动物': [`${city}动物园`, `${city}野生动物园`, `${city}飞鸟世界`],
    '科技': [`${city}科技馆`, `${city}科学中心`, `${city}航天馆`],
    '餐厅': [`${city}亲子餐厅`, `${city}儿童主题餐厅`, `${city}家庭厨房`, `${city}宝贝餐厅`],
  }

  let selectedPool: string[] = []
  for (const [key, names] of Object.entries(mockNames)) {
    if (kw.includes(key) || params.types?.includes(key)) selectedPool.push(...names)
  }
  if (selectedPool.length === 0) {
    selectedPool = Object.values(mockNames).flat()
  }

  const shuffled = selectedPool.sort(() => Math.random() - 0.5).slice(0, Math.min(selectedPool.length, 20))
  const pois: AmapPOI[] = shuffled.map((name, i) => ({
    id: `mock_${i}`,
    name,
    type: '风景名胜',
    typecode: '110000',
    address: `${city}市中心区域`,
    location: `${121.5 + Math.random() * 0.5},${38.8 + Math.random() * 0.3}`,
    photos: [],
    biz_ext: { rating: String(3.5 + Math.random() * 1.5), cost: '0-100' },
    children: [{ id: `c_${i}`, name: `${name}儿童区`, location: `${121.55 + Math.random() * 0.4},${38.85 + Math.random() * 0.2}`, address: '' }],
  }))

  return { pois, count: String(pois.length) }
}

function mockGeocode(address: string): GeocodeResult | null {
  const coords: Record<string, [number, number]> = {
    '北京': [116.4074, 39.9042], '上海': [121.4737, 31.2304],
    '广州': [113.2644, 23.1291], '深圳': [114.0579, 22.5431],
    '成都': [104.0665, 30.5728], '杭州': [120.1551, 30.2741],
    '南京': [118.7969, 32.0603], '西安': [108.9402, 34.3416],
    '厦门': [118.0894, 24.4798], '三亚': [109.5082, 18.2528],
    '大连': [121.6147, 38.914], '武汉': [114.3054, 30.5931],
    '青岛': [120.3826, 36.0671], '重庆': [106.5516, 29.5630],
    '苏州': [120.5853, 31.2989], '天津': [117.1901, 39.1252],
  }

  for (const [city, loc] of Object.entries(coords)) {
    if (address.includes(city)) {
      return { address, location: loc, adcode: '', city, district: '' }
    }
  }
  return { address, location: [116.4074, 39.9042], adcode: '', city: '北京', district: '' }
}

function mockWeather(city: string): AmapWeather {
  const today = new Date()
  const conditions = ['晴', '多云', '阴', '小雨']
  const cond = conditions[Math.floor(Math.random() * conditions.length)]

  const casts = []
  for (let i = 0; i < 4; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().slice(0, 10)
    const temp = 18 + Math.floor(Math.random() * 12)
    casts.push({
      date: dateStr,
      week: ['一', '二', '三', '四', '五', '六', '日'][d.getDay()],
      dayweather: cond,
      nightweather: cond,
      daytemp: String(temp + 3),
      nighttemp: String(temp - 5),
      daywind: '南风',
      nightwind: '北风',
      daypower: '1-3级',
      nightpower: '1-3级',
    })
  }

  return {
    province: '省',
    city,
    adcode: '',
    reporttime: today.toISOString(),
    casts,
  }
}

// 检查是否配置了 API Key
export function isAmapConfigured(): boolean {
  return hasApiKey()
}

// 为行程所有相邻节点批量获取步行路线，直接写入 store
export async function enrichTripRoutes(): Promise<boolean> {
  // Dynamic import to avoid circular dependency at module level
  const { useTripStore } = await import('../stores/useTripStore')
  const trip = useTripStore.getState().currentTrip
  if (!trip || !isAmapConfigured()) return false

  const pairs: Array<{ prevIdx: number; dayIdx: number; prevLng: number; prevLat: number; currLng: number; currLat: number }> = []

  trip.days.forEach((day, dayIdx) => {
    const ordered = [...day.segments.morning, ...day.segments.afternoon, ...day.segments.evening]
    for (let i = 1; i < ordered.length; i++) {
      pairs.push({
        dayIdx, prevIdx: i - 1,
        prevLng: ordered[i - 1].lng, prevLat: ordered[i - 1].lat,
        currLng: ordered[i].lng, currLat: ordered[i].lat,
      })
    }
  })

  if (pairs.length === 0) return false

  const results = await Promise.allSettled(
    pairs.map(({ prevLng, prevLat, currLng, currLat }) =>
      walkingRoute(`${prevLng},${prevLat}`, `${currLng},${currLat}`)
    )
  )

  const updatedTrip = {
    ...trip,
    days: trip.days.map((day) => ({
      ...day,
      segments: {
        morning: [...day.segments.morning],
        afternoon: [...day.segments.afternoon],
        evening: [...day.segments.evening],
      },
    })),
  }
  let appliedCount = 0

  results.forEach((result, idx) => {
    if (result.status !== 'fulfilled' || !result.value) return
    const { dayIdx, prevIdx } = pairs[idx]
    const day = updatedTrip.days[dayIdx]
    const ordered = [...day.segments.morning, ...day.segments.afternoon, ...day.segments.evening]
    const curr = ordered[prevIdx + 1]
    if (!curr) return
    curr.walkingFromPrev = {
      distance: Math.round(result.value.distance),
      duration: Math.round(result.value.duration),
      childFriendly: result.value.distance < 2000,
      polyline: result.value.polyline,
    }
    appliedCount++
  })

  useTripStore.getState().setTrip(updatedTrip)
  console.log(`[enrichTripRoutes] Applied ${appliedCount} walking routes`)
  return appliedCount > 0
}
