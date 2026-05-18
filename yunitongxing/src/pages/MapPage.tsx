import { useTripStore } from '../stores/useTripStore'
import { useMapStore } from '../stores/useMapStore'
import { useAgentStore } from '../stores/useAgentStore'
import AgentStatusBar from '../components/agent/AgentStatusBar'
import ModeSwitcher from '../components/map/ModeSwitcher'
import ChildMap from '../components/map/ChildMap'
import NodeInfoCard from '../components/map/NodeInfoCard'

export default function MapPage() {
  const currentTrip = useTripStore((s) => s.currentTrip)
  const selectedNodeId = useMapStore((s) => s.selectedNodeId)
  const setMode = useTripStore((s) => s.setMode)
  const phase = useAgentStore((s) => s.phase)

  if (!currentTrip) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="text-5xl mb-3">🗺️</div>
          <p className="text-sm text-text-muted">暂无行程数据</p>
          <p className="text-xs text-text-muted mt-1">在首页开始规划，地图将在此展示</p>
        </div>
      </div>
    )
  }

  const allNodes = currentTrip.days.flatMap((d) =>
    [...d.segments.morning, ...d.segments.afternoon, ...d.segments.evening]
  )

  return (
    <div className="flex flex-col h-full">
      <AgentStatusBar />
      {/* Actual Leaflet Map */}
      <div className="flex-1 relative overflow-hidden">
        <ChildMap />
      </div>

      {/* Mode switcher */}
      <div className="p-3 bg-white border-t border-gray-100">
        <ModeSwitcher mode={currentTrip.mode} onModeChange={setMode} />
      </div>

      {/* Node count info */}
      <div className="px-4 py-2 bg-white/80 flex items-center justify-between">
        <span className="text-xs text-text-muted">
          {currentTrip.days.length}天行程 · {
            allNodes.length
          }个节点
        </span>
        {selectedNodeId && (
          <span className="text-xs text-warm-orange font-bold">已选中节点</span>
        )}
      </div>

      <NodeInfoCard />
    </div>
  )
}
