import { useTripStore } from '../stores/useTripStore'
import { useWeatherStore } from '../stores/useWeatherStore'
import { useAgentStore } from '../stores/useAgentStore'
import { useMapStore } from '../stores/useMapStore'
import AgentStatusBar from '../components/agent/AgentStatusBar'
import DayTimeline from '../components/planner/DayTimeline'

export default function PlannerPage() {
  const currentTrip = useTripStore((s) => s.currentTrip)
  const activePlan = useWeatherStore((s) => s.activePlan)
  const setActivePlan = useWeatherStore((s) => s.setActivePlan)

  if (!currentTrip) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="text-5xl mb-3">📋</div>
          <p className="text-sm text-text-muted">暂无行程方案</p>
          <p className="text-xs text-text-muted mt-1">在首页或助手页面开始规划</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <AgentStatusBar />
      <div className="flex-1 overflow-y-auto">
        {/* Weather plan toggle */}
        <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-gray-100">
          <button
            onClick={() => setActivePlan('sunny')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
              activePlan === 'sunny' ? 'bg-warm-yellow text-white' : 'bg-gray-50 text-text-muted'
            }`}
          >
            ☀️ 晴天方案
          </button>
          <button
            onClick={() => setActivePlan('rainy')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
              activePlan === 'rainy' ? 'bg-sky-blue text-white' : 'bg-gray-50 text-text-muted'
            }`}
          >
            🌧️ 雨天方案
          </button>
        </div>

        {/* Day timeline */}
        {currentTrip.days.map((day, idx) => (
          <DayTimeline key={idx} day={day} />
        ))}
      </div>
    </div>
  )
}
