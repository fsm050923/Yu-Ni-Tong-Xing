import { useWeatherStore } from '../../stores/useWeatherStore'

export default function WeatherBadge() {
  const forecast = useWeatherStore((s) => s.forecast)
  const location = useWeatherStore((s) => s.location)
  const activePlan = useWeatherStore((s) => s.activePlan)

  if (forecast.length === 0) return null

  const today = forecast[0]
  const weatherEmoji: Record<string, string> = {
    sunny: '☀️', rainy: '🌧️', cloudy: '☁️', snow: '❄️', storm: '⛈️', hot: '🥵', cold: '🥶',
  }

  return (
    <button
      className="flex items-center gap-1 px-2 py-0.5 bg-warm-bg rounded-full text-xs"
      onClick={() => useWeatherStore.getState().setActivePlan(activePlan === 'sunny' ? 'rainy' : 'sunny')}
    >
      <span>{weatherEmoji[today.condition] || '🌤️'}</span>
      <span className="text-text-secondary">
        {location} {today.tempHigh}°/{today.tempLow}°
      </span>
      <span className="text-[10px] text-warm-orange font-bold ml-1">
        {activePlan === 'sunny' ? '☀️' : '🌧️'}
      </span>
    </button>
  )
}
