const MODES = [
  { value: 'standard' as const, label: '标准', icon: '📍', desc: '适中节奏' },
  { value: 'relaxed' as const, label: '悠闲', icon: '🌿', desc: '慢享时光' },
  { value: 'compact' as const, label: '紧凑', icon: '⚡', desc: '高效游玩' },
]

interface ModeSwitcherProps {
  mode: 'standard' | 'relaxed' | 'compact'
  onModeChange: (mode: 'standard' | 'relaxed' | 'compact') => void
}

export default function ModeSwitcher({ mode, onModeChange }: ModeSwitcherProps) {
  return (
    <div className="flex gap-1 p-1 bg-gray-50 rounded-2xl">
      {MODES.map((m) => (
        <button
          key={m.value}
          onClick={() => onModeChange(m.value)}
          className={`flex-1 flex flex-col items-center py-1.5 rounded-xl transition-all text-xs ${
            mode === m.value
              ? 'bg-white shadow-sm text-warm-orange font-bold'
              : 'text-text-muted'
          }`}
        >
          <span>{m.icon}</span>
          <span>{m.label}</span>
        </button>
      ))}
    </div>
  )
}
