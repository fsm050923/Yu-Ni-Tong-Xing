import { getWeather as amapGetWeather, isAmapConfigured } from '../../services/amap'

export interface GetWeatherArgs {
  location: string
  date: string
}

export async function getWeather(args: GetWeatherArgs) {
  if (!isAmapConfigured()) {
    return fallbackWeather(args)
  }

  try {
    const data = await amapGetWeather(args.location)

    if (!data?.casts?.length) return fallbackWeather(args)

    // Find the forecast for the requested date (or today)
    const target = data.casts.find((c) => c.date === args.date) || data.casts[0]

    const isRainy = target.dayweather.includes('雨') || target.dayweather.includes('雪')
    const isHot = parseInt(target.daytemp) > 35
    const isCold = parseInt(target.daytemp) < 10

    return {
      location: args.location,
      date: target.date,
      city: data.city,
      condition: target.dayweather,
      temperature: { high: parseInt(target.daytemp), low: parseInt(target.nighttemp) },
      wind: `${target.daywind} ${target.daypower}`,
      suitableForOutdoor: !isRainy && !isHot && !isCold,
      tips: [
        isRainy ? '有降雨，建议准备室内备选方案' : '',
        isHot ? '天气炎热，注意给孩子防暑补水' : '',
        isCold ? '天气较冷，给孩子多穿点' : '',
        !isRainy && !isHot && !isCold ? '天气不错，适合户外活动！记得给孩子涂防晒' : '',
        target.daywind.includes('大') || target.daypower.includes('3') ? '风力较大，户外注意安全' : '',
      ].filter(Boolean),
      forecasts: data.casts.slice(0, 3).map((c) => ({
        date: c.date,
        dayWeather: c.dayweather,
        nightWeather: c.nightweather,
        tempHigh: parseInt(c.daytemp),
        tempLow: parseInt(c.nighttemp),
      })),
      source: 'amap_live',
    }
  } catch (err) {
    console.warn('[getWeather] Amap API failed, using fallback:', err)
    return fallbackWeather(args)
  }
}

function fallbackWeather(args: { location: string; date: string }) {
  const conditions = ['晴', '多云', '阴', '小雨', '阵雨']
  const cond = conditions[Math.floor(Math.random() * conditions.length)]
  const today = new Date()
  const forecasts = []
  for (let i = 0; i < 3; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    forecasts.push({
      date: d.toISOString().slice(0, 10),
      dayWeather: cond,
      nightWeather: cond,
      tempHigh: 22 + Math.floor(Math.random() * 8),
      tempLow: 14 + Math.floor(Math.random() * 6),
    })
  }

  return {
    location: args.location,
    date: args.date,
    condition: cond,
    temperature: { high: 26, low: 16 },
    wind: '南风 1-3级',
    suitableForOutdoor: !cond.includes('雨'),
    tips: [cond.includes('雨') ? '可能有雨，建议准备室内备选方案' : '天气不错，适合户外活动！'],
    forecasts,
    source: 'local_fallback',
  }
}
