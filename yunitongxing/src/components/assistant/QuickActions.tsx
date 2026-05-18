const QUICK_ACTIONS = [
  { label: '换个室内景点', emoji: '🏛️' },
  { label: '附近有母婴室吗', emoji: '🍼' },
  { label: '下雨了怎么办', emoji: '🌧️' },
  { label: '孩子走累了', emoji: '😮‍💨' },
]

interface QuickActionsProps {
  onSelect: (text: string) => void
}

export default function QuickActions({ onSelect }: QuickActionsProps) {
  return (
    <div className="flex gap-1.5 px-3 py-2 overflow-x-auto no-scrollbar">
      {QUICK_ACTIONS.map((action) => (
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
