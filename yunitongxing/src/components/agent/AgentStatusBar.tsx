import { useAgentStore, type AgentPhase } from '../../stores/useAgentStore'
import { useTripStore } from '../../stores/useTripStore'

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
  const isCompanionMode = useAgentStore((s) => s.isCompanionMode)
  const toggleCompanionMode = useAgentStore((s) => s.toggleCompanionMode)
  const trip = useTripStore((s) => s.currentTrip)
  const config = phaseConfig[phase]

  const showCompanionToggle = !!trip
  const isActivePhase = phase !== 'idle'

  if (!isActivePhase && !showCompanionToggle) return null

  return (
    <>
      <div className="flex items-center justify-between px-4 py-1.5 bg-white border-b border-gray-100">
        {isActivePhase ? (
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${config.color}`}>
            <span className="text-xs">{config.emoji}</span>
            <span>{config.label}</span>
          </div>
        ) : isCompanionMode ? (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-blue/10 text-sky-blue">
            <span className="text-xs animate-pulse-soft">🛰️</span>
            <span>随行中</span>
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          {activeToolCalls.length > 0 && (
            <div className="flex items-center gap-1">
              {activeToolCalls.map((tc, i) => (
                <span key={i} className="text-[10px] text-text-muted">
                  {tc.status === 'done' ? '✅' : '⏳'} {tc.name}
                </span>
              ))}
            </div>
          )}
          {showCompanionToggle && (
            <button
              onClick={toggleCompanionMode}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all active:scale-95 ${
                isCompanionMode
                  ? 'bg-sky-blue/15 text-sky-blue border border-sky-blue/30'
                  : 'bg-gray-100 text-text-muted'
              }`}
              title="模拟出行当天，Agent 按行程时间线主动推送提醒"
            >
              <span>{isCompanionMode ? '🛰️' : '📍'}</span>
              <span>{isCompanionMode ? '随行中' : '随行模式'}</span>
            </button>
          )}
        </div>
      </div>
      {isCompanionMode && (
        <div className="px-4 py-1.5 bg-sky-blue/5 border-b border-sky-blue/10 text-center">
          <p className="text-[10px] text-sky-blue leading-relaxed">
            🛰️ <strong>随行模式已开启</strong> — Agent 将按行程时间线自动推送提醒：出发提醒、午餐建议、休息提示、结束总结，模拟真实出行陪伴体验。
          </p>
        </div>
      )}
    </>
  )
}
