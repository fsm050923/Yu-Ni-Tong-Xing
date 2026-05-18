import { useMemoryStore } from '../../stores/useMemoryStore'

export default function MemoryIndicator() {
  const preferences = useMemoryStore((s) => s.preferences)
  const longTerm = useMemoryStore((s) => s.longTerm)

  if (preferences.length === 0 && longTerm.length === 0) return null

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-soft-purple/10 rounded-full border border-soft-purple/20">
      <span className="text-xs">🧠</span>
      <span className="text-[10px] text-soft-purple font-medium">
        {preferences.length + longTerm.length} 条记忆
      </span>
    </div>
  )
}
