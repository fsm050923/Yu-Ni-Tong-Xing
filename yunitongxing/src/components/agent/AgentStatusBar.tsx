import { useAgentStore, type AgentPhase } from '../../stores/useAgentStore'

const phaseConfig: Record<AgentPhase, { label: string; emoji: string; color: string }> = {
  idle: { label: '就绪', emoji: '✅', color: 'bg-green-100 text-green-600' },
  perceiving: { label: '感知中', emoji: '👁️', color: 'bg-blue-100 text-blue-600' },
  thinking: { label: '思考中', emoji: '🧠', color: 'bg-purple-100 text-purple-600' },
  executing: { label: '执行中', emoji: '⚡', color: 'bg-warm-orange/10 text-warm-orange' },
  responding: { label: '回复中', emoji: '💬', color: 'bg-sky-100 text-sky-600' },
}

export default function AgentStatusBar() {
  const phase = useAgentStore((s) => s.phase)
  const activeToolCalls = useAgentStore((s) => s.activeToolCalls)
  const config = phaseConfig[phase]

  if (phase === 'idle') return null

  return (
    <div className="flex items-center justify-between px-4 py-1.5 bg-white border-b border-gray-100">
      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${config.color}`}>
        <span className="text-xs">{config.emoji}</span>
        <span>{config.label}</span>
      </div>
      {activeToolCalls.length > 0 && (
        <div className="flex items-center gap-1">
          {activeToolCalls.map((tc, i) => (
            <span key={i} className="text-[10px] text-text-muted">
              {tc.status === 'done' ? '✅' : '⏳'} {tc.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
