import { useAgentStore } from '../../stores/useAgentStore'

export default function ProactiveCard() {
  const suggestion = useAgentStore((s) => s.proactiveSuggestion)
  const setProactiveSuggestion = useAgentStore((s) => s.setProactiveSuggestion)

  if (!suggestion) return null

  return (
    <div
      className="mx-3 mb-2 p-3 bg-white rounded-2xl shadow-lg border border-warm-yellow/30 animate-slide-up cursor-pointer"
      onClick={() => setProactiveSuggestion(null)}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">💡</span>
        <div className="flex-1">
          <p className="text-xs text-text-primary font-medium">童行助手建议</p>
          <p className="text-[11px] text-text-secondary mt-0.5">{suggestion}</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setProactiveSuggestion(null) }}
          className="text-text-muted text-xs"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
