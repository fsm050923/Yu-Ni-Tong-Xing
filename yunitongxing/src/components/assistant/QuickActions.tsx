import { useTripStore } from '../../stores/useTripStore'
import { useWeatherStore } from '../../stores/useWeatherStore'

interface QuickActionsProps {
  onSelect: (text: string) => void
}

export default function QuickActions({ onSelect }: QuickActionsProps) {
  const trip = useTripStore((s) => s.currentTrip)
  const forecast = useWeatherStore((s) => s.forecast)
  const isRainy = forecast[0]?.condition?.includes('雨')

  let actions: Array<{ label: string; emoji: string }> = []

  if (trip) {
    actions = [
      { label: '换个室内景点', emoji: '🏛️' },
      { label: '附近有母婴室吗', emoji: '🍼' },
      { label: '孩子走累了', emoji: '😮‍💨' },
      { label: isRainy ? '下雨了换方案' : '天气不好怎么办', emoji: isRainy ? '🌧️' : '☁️' },
    ]
  } else {
    actions = [
      { label: '带5岁孩子去大连玩一天', emoji: '🏖️' },
      { label: '周末2日亲子游推荐', emoji: '🌳' },
      { label: '推荐室内博物馆', emoji: '🏛️' },
      { label: '下雨了去哪玩', emoji: '🌧️' },
    ]
  }

  return (
    <div className="flex gap-1.5 px-3 py-2 overflow-x-auto no-scrollbar">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => onSelect(action.label)}
          className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-100 rounded-full text-[11px] text-text-secondary active:bg-warm-yellow/10 active:border-warm-yellow/30 transition-colors"
        >
          <span>{action.emoji}</span>
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  )
}
