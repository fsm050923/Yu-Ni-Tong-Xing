import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTripStore } from '../stores/useTripStore'
import { useMapStore } from '../stores/useMapStore'
import AgentStatusBar from '../components/agent/AgentStatusBar'
import ChildMap from '../components/map/ChildMap'
import FootprintMap from '../components/map/FootprintMap'
import NodeInfoCard from '../components/map/NodeInfoCard'
import type { TripNode } from '../types/trip'

function Pill({ emoji, label, bg }: { emoji: string; label: string; bg: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ backgroundColor: bg, color: '#5B4636' }}
    >
      <span className="text-xs">{emoji}</span>
      {label}
    </span>
  )
}

function totalWalk(nodes: TripNode[]): number {
  return nodes.reduce((sum, n) => sum + (n.walkingFromPrev?.distance || 0), 0)
}

export default function MapPage() {
  const currentTrip = useTripStore((s) => s.currentTrip)
  const selectedNodeId = useMapStore((s) => s.selectedNodeId)
  const selectNode = useMapStore((s) => s.selectNode)
  const navigate = useNavigate()
  const [showFootprint, setShowFootprint] = useState(false)

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

      {/* Kid-friendly bottom card — cloud shape */}
      <div className="px-4 pt-3 pb-4 relative">
        {/* Cloud bubble background */}
        <div className="rounded-[28px] px-5 py-3 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #FFF9E6 0%, #FFF0F5 40%, #F0F4FF 100%)',
            boxShadow: '0 -2px 16px rgba(255,180,150,0.2), 0 4px 20px rgba(180,200,255,0.18)',
            border: '2px solid rgba(255,200,150,0.3)',
          }}
        >
          {/* Cloud bumps decoration */}
          <div className="absolute -top-3 left-1/4 w-10 h-6 bg-white/80 rounded-full" />
          <div className="absolute -top-3 left-1/2 w-12 h-7 bg-white/70 rounded-full" />
          <div className="absolute -top-2 right-1/3 w-8 h-5 bg-white/80 rounded-full" />

          {/* Trip summary line */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm" role="img" aria-label="map">🗺️</span>
              <span className="text-sm font-bold" style={{ color: '#5B4636' }}>
                {currentTrip.title}
              </span>
            </div>
            <div className="flex gap-1.5">
              {selectedNodeId && (
                <button
                  onClick={() => selectNode(null)}
                  className="text-[10px] px-2 py-1 rounded-full bg-white/80 text-text-muted font-medium active:scale-95"
                >
                  取消选中
                </button>
              )}
              <button
                onClick={() => navigate('/planner')}
                className="text-[10px] px-2 py-1 rounded-full bg-white/80 text-text-muted font-medium active:scale-95"
              >
                📋 编辑行程
              </button>
            </div>
          </div>

          {/* Stats pills */}
          <div className="flex flex-wrap items-center gap-2">
            <Pill emoji="📅" label={`${currentTrip.days.length}天`} bg="#FFF1E6" />
            <Pill emoji="📍" label={`${allNodes.length}个景点`} bg="#E8F4FD" />
            <Pill emoji="🚶" label={`${totalWalk(allNodes)}m步行`} bg="#F0FCE8" />
            <button
              onClick={() => setShowFootprint(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold active:scale-95"
              style={{ backgroundColor: '#F3E8FF', color: '#7C3AED' }}
            >
              <span className="text-xs">👣</span>
              成长足迹
            </button>
          </div>
        </div>
      </div>

      <NodeInfoCard />
      {showFootprint && <FootprintMap onClose={() => setShowFootprint(false)} />}
    </div>
  )
}
