import { useWeatherStore } from '../../stores/useWeatherStore'

export default function WeatherBadge() {
  const forecast = useWeatherStore((s) => s.forecast)
  const location = useWeatherStore((s) => s.location)

  if (forecast.length === 0) return null

  const today = forecast[0]
  const weatherEmoji: Record<string, string> = {
    sunny: '☀️', rainy: '🌧️', cloudy: '☁️', snow: '❄️', storm: '⛈️', hot: '🥵', cold: '🥶',
  }

  return (
    <div className="flex items-center gap-1 px-2 py-0.5 bg-warm-bg rounded-full text-xs mx-4 mb-1">
      <span>{weatherEmoji[today.condition] || '🌤️'}</span>
      <span className="text-text-secondary">
        {location} {today.tempHigh}°/{today.tempLow}°
      </span>
    </div>
  )
}
