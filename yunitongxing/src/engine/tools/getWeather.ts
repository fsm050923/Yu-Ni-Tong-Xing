export interface GetWeatherArgs {
  location: string
  date: string
}

export async function getWeather(args: GetWeatherArgs) {
  // Mock weather data — in production, integrate with 和风天气 API
  const conditions = ['晴', '多云', '阴', '小雨', '阵雨'] as const
  const randomCondition = conditions[Math.floor(Math.random() * conditions.length)]

  return {
    location: args.location,
    date: args.date,
    condition: randomCondition,
    temperature: { high: 22 + Math.floor(Math.random() * 10), low: 12 + Math.floor(Math.random() * 8) },
    humidity: 40 + Math.floor(Math.random() * 40),
    windLevel: Math.floor(Math.random() * 4) + 1,
    suitableForOutdoor: !randomCondition.includes('雨'),
    tip: randomCondition.includes('雨')
      ? '可能有雨，建议准备室内备选方案'
      : '天气不错，适合户外活动！记得给孩子涂防晒',
  }
}
