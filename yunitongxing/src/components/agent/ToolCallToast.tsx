import { useAgentStore } from '../../stores/useAgentStore'

const TOOL_ICONS: Record<string, string> = {
  searchPoi: '🔍',
  getWeather: '🌤️',
  generateTripPlan: '📋',
  adjustTrip: '🔧',
  findNearbyFacility: '📍',
  checkTicketInfo: '🎫',
  generateAlternativePlan: '🔄',
  suggestRestSpot: '☕',
  saveToMemory: '🧠',
  queryMemory: '📝',
}

const TOOL_LABELS: Record<string, string> = {
  searchPoi: '搜索景点中',
  getWeather: '查询天气中',
  generateTripPlan: '生成行程中',
  adjustTrip: '调整行程中',
  findNearbyFacility: '查找设施中',
  checkTicketInfo: '查询票务中',
  generateAlternativePlan: '生成备选方案',
  suggestRestSpot: '查找休息点',
  saveToMemory: '保存记忆中',
  queryMemory: '检索记忆中',
}

export default function ToolCallToast() {
  const activeToolCalls = useAgentStore((s) => s.activeToolCalls)
  const running = activeToolCalls.filter((tc) => tc.status === 'running')

  if (running.length === 0) return null

  const latest = running[running.length - 1]

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[2000] animate-fade-in pointer-events-none">
      <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md shadow-lg rounded-2xl px-4 py-2.5 border border-warm-yellow/30">
        <span className="text-base animate-pulse-soft">
          {TOOL_ICONS[latest.name] || '⚙️'}
        </span>
        <span className="text-sm text-text-secondary font-medium">
          {TOOL_LABELS[latest.name] || latest.name}
        </span>
        <span className="flex gap-0.5 ml-1">
          <span className="w-1 h-1 rounded-full bg-warm-yellow animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1 h-1 rounded-full bg-warm-yellow animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1 h-1 rounded-full bg-warm-yellow animate-bounce" style={{ animationDelay: '300ms' }} />
        </span>
      </div>
    </div>
  )
}
