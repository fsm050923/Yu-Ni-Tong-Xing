import { useAgentStore } from '../../stores/useAgentStore'
import { useTripStore } from '../../stores/useTripStore'
import MemoryIndicator from './MemoryIndicator'

const PHASE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  idle: { label: '待命中', color: 'text-text-muted', bg: 'bg-gray-100' },
  perceiving: { label: '👁️ 感知中', color: 'text-sky-blue', bg: 'bg-sky-blue/10' },
  thinking: { label: '🤔 思考中', color: 'text-soft-purple', bg: 'bg-soft-purple/10' },
  executing: { label: '⚡ 执行中', color: 'text-warm-orange', bg: 'bg-warm-orange/10' },
  responding: { label: '💬 回复中', color: 'text-mint-green', bg: 'bg-mint-green/10' },
}

export default function AgentDashboard() {
  const phase = useAgentStore((s) => s.phase)
  const toolCalls = useAgentStore((s) => s.activeToolCalls)
  const isAutonomous = useAgentStore((s) => s.isAutonomousMode)
  const trip = useTripStore((s) => s.currentTrip)

  const config = PHASE_CONFIG[phase] || PHASE_CONFIG.idle
  const isActive = phase !== 'idle'

  return (
    <div className={`px-3 py-2 border-b transition-colors duration-500 ${config.bg}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 ${config.color}`}>
            {isActive && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: 'currentColor' }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: 'currentColor' }} />
              </span>
            )}
            <span className="text-xs font-semibold">{config.label}</span>
          </div>
          {trip && (
            <span className="text-[10px] text-text-muted truncate max-w-[120px]">
              📍 {trip.destination}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <MemoryIndicator />
          {isAutonomous && (
            <span className="text-[10px] bg-warm-orange/10 text-warm-orange px-1.5 py-0.5 rounded-full font-medium">
              自主模式
            </span>
          )}
        </div>
      </div>

      {/* Tool call progress */}
      {toolCalls.length > 0 && (
        <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto no-scrollbar">
          {toolCalls.map((tc, i) => (
            <span
              key={i}
              className={`text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                tc.status === 'done'
                  ? 'bg-mint-green/20 text-mint-green'
                  : tc.status === 'running'
                  ? 'bg-warm-yellow/20 text-warm-yellow'
                  : 'bg-gray-100 text-text-muted'
              }`}
            >
              {tc.status === 'done' ? '✅' : tc.status === 'running' ? '⏳' : '⬜'} {tc.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
