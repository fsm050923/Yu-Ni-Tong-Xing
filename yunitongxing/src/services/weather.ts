import type { WeatherDay } from '../types/weather'

const WEATHER_CACHE = new Map<string, { data: WeatherDay[]; expires: number }>()
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

/**
 * Get weather forecast for a location.
 * Uses mock data with realistic patterns based on city and month.
 */
export async function getWeatherForecast(location: string, days = 3): Promise<WeatherDay[]> {
  const cacheKey = `${location}_${days}`
  const cached = WEATHER_CACHE.get(cacheKey)
  if (cached && cached.expires > Date.now()) return cached.data

  const forecast = generateMockForecast(location, days)

  WEATHER_CACHE.set(cacheKey, { data: forecast, expires: Date.now() + CACHE_TTL })
  return forecast
}

function generateMockForecast(location: string, days = 3): WeatherDay[] {
  const conditions: WeatherDay['condition'][] = ['晴', '多云', '阴', '小雨', '多云转晴', '晴间多云']
  const result: WeatherDay[] = []

  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() + i)
    const month = date.getMonth() + 1

    const highBase = location.includes('大连') ? 22 : location.includes('北京') ? 26 : 25
    const lowBase = location.includes('大连') ? 15 : location.includes('北京') ? 16 : 17

    // Seasonal adjustment
    const seasonFactor = month >= 6 && month <= 8 ? 1.3 : month >= 3 && month <= 5 ? 1.0 : 0.5
    const high = Math.round(highBase * seasonFactor + Math.random() * 5)
    const low = Math.round(lowBase * seasonFactor - Math.random() * 3)

    const conditionIndex = (i + Math.floor(Math.random() * 3)) % conditions.length

    result.push({
      date: date.toISOString().slice(0, 10),
      condition: conditions[conditionIndex],
      temperature: { high, low },
      humidity: Math.round(40 + Math.random() * 40),
      windLevel: Math.round(1 + Math.random() * 4),
      suitableForOutdoor: !conditions[conditionIndex].includes('雨') && (1 + Math.round(Math.random() * 3)) < 4,
      uvIndex: Math.round(1 + Math.random() * 8),
      tip: conditions[conditionIndex].includes('雨')
        ? '建议准备室内备选方案和雨具'
        : high > 30
          ? '天气较热，注意防晒补水'
          : '适合户外活动',
    })
  }

  return result
}

/**
 * Check if weather conditions are suitable for outdoor activities
 */
export function isOutdoorWeather(forecast: WeatherDay[]): boolean {
  return forecast.length > 0 && forecast[0].suitableForOutdoor !== false
}
