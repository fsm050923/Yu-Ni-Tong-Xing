import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTripStore } from '../stores/useTripStore'
import { useMapStore } from '../stores/useMapStore'
import { getPoiIcon, getPoiLabel, getPoiColor } from '../constants/poi-types'
import { searchPoi, isAmapConfigured } from '../services/amap'
import type { TripNode, TripDay } from '../types/trip'

const SEGMENT_META = {
  morning: { label: '上午', icon: '☀️', bg: 'bg-warm-yellow/5', badge: 'bg-warm-yellow/10 text-warm-yellow' },
  afternoon: { label: '下午', icon: '🌤️', bg: 'bg-sky-blue/5', badge: 'bg-sky-blue/10 text-sky-blue' },
  evening: { label: '晚上', icon: '🌙', bg: 'bg-purple-50', badge: 'bg-purple-100 text-purple-600' },
} as const

type SegmentKey = keyof typeof SEGMENT_META

export default function PlannerPage() {
  const currentTrip = useTripStore((s) => s.currentTrip)
  const updateNode = useTripStore((s) => s.updateNode)
  const removeNode = useTripStore((s) => s.removeNode)
  const setTrip = useTripStore((s) => s.setTrip)
  const selectNode = useMapStore((s) => s.selectNode)
  const navigate = useNavigate()

  // Which node is being edited (expanded)
  const [editNodeId, setEditNodeId] = useState<string | null>(null)
  // Add POI panel state
  const [showAddPanel, setShowAddPanel] = useState<{ dayIdx: number; segment: SegmentKey } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{ name: string; lat: number; lng: number; address: string; type: string }>>([])
  const [searching, setSearching] = useState(false)
  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

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

  const allNodes = currentTrip.days.flatMap((d) =>
    [...d.segments.morning, ...d.segments.afternoon, ...d.segments.evening]
  )
  const totalWalkMin = allNodes.reduce((s, n) => s + (n.walkingFromPrev?.duration || 0), 0)
  const indoorCount = allNodes.filter((n) => n.indoor).length

  function handleMoveNode(nodeId: string, fromSeg: SegmentKey, toSeg: SegmentKey, dayIdx: number) {
    const trip = { ...currentTrip, days: currentTrip.days.map((d) => ({ ...d, segments: { morning: [...d.segments.morning], afternoon: [...d.segments.afternoon], evening: [...d.segments.evening] } })) }
    const day = trip.days[dayIdx]
    const node = day.segments[fromSeg].find((n) => n.id === nodeId)
    if (!node) return
    day.segments[fromSeg] = day.segments[fromSeg].filter((n) => n.id !== nodeId)
    day.segments[toSeg].push({ ...node, segment: toSeg })
    setTrip(trip)
  }

  function handleEditTime(nodeId: string, field: 'startTime' | 'duration', value: string) {
    if (field === 'startTime') {
      updateNode(nodeId, { startTime: value })
    } else {
      const mins = parseInt(value) || 60
      updateNode(nodeId, { duration: mins })
    }
  }

  async function handleSearchPoi() {
    if (!searchQuery.trim()) return
    setSearching(true)

    const results: Array<{ name: string; lat: number; lng: number; address: string; type: string }> = []

    if (isAmapConfigured()) {
      try {
        const result = await searchPoi({
          keywords: searchQuery,
          city: currentTrip!.destination,
          offset: 8,
        })
        result.pois.filter((p) => p.location).forEach((p) => {
          const [lng, lat] = p.location.split(',').map(Number)
          if (lat && lng) results.push({ name: p.name, lat, lng, address: p.address || '', type: p.type || '' })
        })
      } catch { /* fall through to local fallback */ }
    }

    // Local fallback: search within current trip nodes + built-in city POIs
    if (results.length === 0) {
      const q = searchQuery.toLowerCase()
      // Search within existing trip nodes
      const tripMatches = allNodes.filter((n) =>
        n.name.includes(searchQuery) || n.address?.includes(searchQuery)
      ).map((n) => ({ name: n.name, lat: n.lat, lng: n.lng, address: n.address, type: n.poiType }))
      results.push(...tripMatches)

      // Built-in POI database for popular cities
      const CITY_POIS: Record<string, Array<{ name: string; lat: number; lng: number; type: string }>> = {
        '大连': [
          { name: '大连圣亚海洋世界', lat: 38.887, lng: 121.586, type: '海洋馆' },
          { name: '大连森林动物园', lat: 38.882, lng: 121.630, type: '动物园' },
          { name: '大连自然博物馆', lat: 38.868, lng: 121.592, type: '博物馆' },
          { name: '金石滩黄金海岸', lat: 39.081, lng: 121.621, type: '海滩' },
          { name: '星海广场', lat: 38.881, lng: 121.583, type: '广场' },
          { name: '老虎滩海洋公园', lat: 38.872, lng: 121.679, type: '海洋公园' },
          { name: '大连儿童公园', lat: 38.913, lng: 121.632, type: '公园' },
          { name: '大连贝壳博物馆', lat: 38.885, lng: 121.590, type: '博物馆' },
          { name: '发现王国主题公园', lat: 39.095, lng: 121.698, type: '游乐园' },
          { name: '棒棰岛风景区', lat: 38.903, lng: 121.712, type: '风景区' },
          { name: '大连现代博物馆', lat: 38.891, lng: 121.596, type: '博物馆' },
          { name: '傅家庄公园', lat: 38.861, lng: 121.618, type: '公园' },
        ],
        '北京': [
          { name: '北京动物园', lat: 39.942, lng: 116.337, type: '动物园' },
          { name: '中国科技馆', lat: 39.999, lng: 116.393, type: '科技馆' },
          { name: '北京自然博物馆', lat: 39.882, lng: 116.393, type: '博物馆' },
          { name: '颐和园', lat: 39.999, lng: 116.275, type: '公园' },
          { name: '朝阳公园', lat: 39.945, lng: 116.481, type: '公园' },
          { name: '奥林匹克公园', lat: 39.993, lng: 116.392, type: '公园' },
          { name: '北京天文馆', lat: 39.936, lng: 116.335, type: '博物馆' },
          { name: '故宫博物院', lat: 39.916, lng: 116.397, type: '博物馆' },
        ],
      }

      const cityKey = Object.keys(CITY_POIS).find((c) => currentTrip!.destination.includes(c))
      const cityPois = cityKey ? CITY_POIS[cityKey] : []
      if (cityPois.length > 0) {
        const matches = cityPois.filter((p) =>
          p.name.includes(searchQuery) || p.type.includes(searchQuery) ||
          (q.includes('海洋') && p.type.includes('海洋')) ||
          (q.includes('动物') && p.type.includes('动物')) ||
          (q.includes('博物馆') && p.type.includes('博物馆')) ||
          (q.includes('公园') && p.type.includes('公园')) ||
          (q.includes('游乐') && p.type.includes('游乐'))
        )
        results.push(...matches.map((p) => ({ ...p, address: currentTrip!.destination })))
      }

      // Deduplicate by name
      const seen = new Set(tripMatches.map((n) => n.name))
      const deduped = results.filter((r) => {
        if (seen.has(r.name)) return false
        seen.add(r.name)
        return true
      })
      setSearchResults(deduped)
    } else {
      setSearchResults(results)
    }

    setSearching(false)
  }

  function handleAddPoi(poi: { name: string; lat: number; lng: number; address: string }) {
    if (!showAddPanel) return
    const { dayIdx, segment } = showAddPanel
    const trip = { ...currentTrip, days: currentTrip.days.map((d) => ({ ...d, segments: { morning: [...d.segments.morning], afternoon: [...d.segments.afternoon], evening: [...d.segments.evening] } })) }
    const newNode: TripNode = {
      id: Math.random().toString(36).slice(2),
      type: 'attraction',
      poiType: 'park',
      name: poi.name,
      address: poi.address,
      lat: poi.lat,
      lng: poi.lng,
      startTime: '10:00',
      endTime: '11:30',
      duration: 90,
      dayIndex: dayIdx,
      segment,
      walkingFromPrev: null,
      ticketInfo: null,
      childFriendlinessRating: 4,
      crowdLevel: 2,
      tips: [],
      indoor: false,
      photos: [],
    }
    trip.days[dayIdx].segments[segment].push(newNode)
    setTrip(trip)
    setShowAddPanel(null)
    setSearchQuery('')
    setSearchResults([])
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Trip summary header */}
      <div className="bg-white px-4 py-3 shadow-sm border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold text-text-primary">{currentTrip.title}</h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-warm-yellow/10 text-warm-yellow font-medium">
            {currentTrip.mode === 'relaxed' ? '🐢 悠闲' : currentTrip.mode === 'compact' ? '🐇 紧凑' : '🚶 标准'}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-text-muted">
          <span>📍 {currentTrip.destination}</span>
          <span>📅 {currentTrip.days.length}天</span>
          <span>🎯 {allNodes.length}个点</span>
          <span>🚶 步行{totalWalkMin}分钟</span>
          <span>🏠 {indoorCount}室内</span>
        </div>
      </div>

      {/* Day tabs + timeline */}
      <div className="flex-1 overflow-y-auto pb-24">
        {currentTrip.days.map((day, dayIdx) => (
          <div key={dayIdx} className="mb-2">
            {/* Day header */}
            <div className="sticky top-0 z-10 px-4 py-2 bg-gray-50/90 backdrop-blur-sm flex items-center gap-2">
              <span className="text-xs font-bold text-text-primary">
                {currentTrip.days.length > 1 ? `📅 第${dayIdx + 1}天` : '📅 行程'}
              </span>
              <span className="text-[10px] text-text-muted">{day.date}</span>
              <span className="flex-1" />
              <button
                onClick={() => setShowAddPanel({ dayIdx, segment: 'morning' })}
                className="text-[10px] px-2 py-1 rounded-full bg-warm-yellow/10 text-warm-yellow font-medium active:scale-95"
              >
                + 添加
              </button>
            </div>

            {/* Segments */}
            {(['morning', 'afternoon', 'evening'] as SegmentKey[]).map((seg) => {
              const nodes = day.segments[seg]
              const meta = SEGMENT_META[seg]

              return (
                <div key={seg} className={`mx-3 mb-2 rounded-2xl ${meta.bg} p-3`}>
                  {/* Segment label + add */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.badge}`}>
                      {meta.icon} {meta.label}
                    </span>
                    <span className="text-[10px] text-text-muted">{nodes.length}个点</span>
                    <span className="flex-1" />
                    <button
                      onClick={() => setShowAddPanel({ dayIdx, segment: seg })}
                      className="text-[10px] text-text-muted hover:text-warm-yellow active:scale-95"
                    >
                      ＋
                    </button>
                  </div>

                  {nodes.length === 0 ? (
                    <p className="text-[10px] text-text-muted text-center py-3">暂无安排</p>
                  ) : (
                    <div className="space-y-2">
                      {nodes.map((node, nodeIdx) => (
                        <NodeCard
                          key={node.id}
                          node={node}
                          nodeIdx={nodeIdx}
                          isEditing={editNodeId === node.id}
                          isConfirmingDelete={confirmDelete === node.id}
                          onToggleEdit={() => setEditNodeId(editNodeId === node.id ? null : node.id)}
                          onDelete={() => { removeNode(node.id); setConfirmDelete(null) }}
                          onConfirmDelete={() => setConfirmDelete(node.id)}
                          onCancelDelete={() => setConfirmDelete(null)}
                          onEditTime={(field, val) => handleEditTime(node.id, field, val)}
                          onMove={(toSeg) => handleMoveNode(node.id, seg, toSeg, dayIdx)}
                          onViewOnMap={() => { selectNode(node.id); navigate('/map') }}
                          availableSegments={
                            (['morning', 'afternoon', 'evening'] as SegmentKey[]).filter((s) => s !== seg)
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Add POI panel (bottom sheet) */}
      {showAddPanel && (
        <>
          <div className="fixed inset-0 bg-black/25 z-[1000]" onClick={() => { setShowAddPanel(null); setSearchQuery(''); setSearchResults([]) }} />
          <div className="fixed bottom-0 left-0 right-0 z-[1001] bg-white rounded-t-[20px] shadow-2xl max-w-md mx-auto max-h-[60vh] flex flex-col">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="px-4 pb-1">
              <h3 className="text-sm font-bold text-text-primary">
                添加地点到 {SEGMENT_META[showAddPanel.segment].label}
              </h3>
            </div>
            <div className="px-4 py-2 flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchPoi()}
                placeholder={`搜索${currentTrip.destination}的景点...`}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-warm-yellow"
              />
              <button
                onClick={handleSearchPoi}
                disabled={searching}
                className="px-4 py-2 bg-warm-yellow text-white text-sm font-bold rounded-xl active:scale-95 disabled:opacity-60"
              >
                {searching ? '...' : '搜索'}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((poi, i) => (
                    <button
                      key={i}
                      onClick={() => handleAddPoi(poi)}
                      className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl active:bg-warm-yellow/5 hover:bg-gray-50"
                    >
                      <span className="text-lg">📍</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{poi.name}</p>
                        <p className="text-[10px] text-text-muted truncate">{poi.address || poi.type}</p>
                      </div>
                      <span className="text-[10px] text-warm-yellow font-bold">+添加</span>
                    </button>
                  ))}
                </div>
              ) : searchQuery && !searching ? (
                <p className="text-xs text-text-muted text-center py-4">未找到结果，换个关键词试试</p>
              ) : null}
              {!isAmapConfigured() && searchResults.length > 0 && (
                <p className="text-[10px] text-text-muted text-center py-2">使用本地数据，配置API Key可获得实时结果</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Node Card (expandable, with edit controls) ───

function NodeCard({
  node, nodeIdx, isEditing, isConfirmingDelete,
  onToggleEdit, onDelete, onConfirmDelete, onCancelDelete,
  onEditTime, onMove, onViewOnMap, availableSegments,
}: {
  node: TripNode
  nodeIdx: number
  isEditing: boolean
  isConfirmingDelete: boolean
  onToggleEdit: () => void
  onDelete: () => void
  onConfirmDelete: () => void
  onCancelDelete: () => void
  onEditTime: (field: 'startTime' | 'duration', value: string) => void
  onMove: (toSeg: SegmentKey) => void
  onViewOnMap: () => void
  availableSegments: SegmentKey[]
}) {
  const color = getPoiColor(node.poiType)

  return (
    <div className={`bg-white rounded-xl overflow-hidden transition-all ${isEditing ? 'shadow-md ring-1 ring-warm-yellow/30' : 'shadow-sm'}`}>
      {/* Main row — always visible */}
      <button
        onClick={onToggleEdit}
        className="w-full text-left flex items-center gap-2.5 px-3 py-2.5"
      >
        {/* Order number */}
        <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-text-muted flex-shrink-0">
          {nodeIdx + 1}
        </span>

        {/* Icon */}
        <span className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: color + '18' }}>
          {getPoiIcon(node.poiType)}
        </span>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-text-primary truncate">{node.name}</span>
            {node.indoor ? (
              <span className="text-[8px] px-1 py-0.5 rounded bg-sky-blue/10 text-sky-blue flex-shrink-0">室内</span>
            ) : (
              <span className="text-[8px] px-1 py-0.5 rounded bg-warm-yellow/10 text-warm-yellow flex-shrink-0">户外</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-text-muted mt-0.5">
            <span>{node.startTime}-{node.endTime}</span>
            <span>{node.duration}min</span>
            {node.walkingFromPrev && <span>🚶 {node.walkingFromPrev.duration}min</span>}
          </div>
        </div>

        {/* Rating + chevron */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <span className="text-[10px] text-warm-yellow">★</span>
          <span className="text-[10px] text-text-muted">{node.childFriendlinessRating}</span>
        </div>
        <span className="text-[10px] text-text-muted">{isEditing ? '▲' : '▼'}</span>
      </button>

      {/* Delete confirmation */}
      {isConfirmingDelete && (
        <div className="px-3 pb-2 flex items-center gap-2">
          <span className="text-[10px] text-red-500 flex-1">确认删除「{node.name}」？</span>
          <button onClick={onDelete} className="text-[10px] px-2 py-1 bg-red-500 text-white rounded-lg font-bold">删除</button>
          <button onClick={onCancelDelete} className="text-[10px] px-2 py-1 bg-gray-100 rounded-lg">取消</button>
        </div>
      )}

      {/* Edit panel — visible when expanded */}
      {isEditing && !isConfirmingDelete && (
        <div className="px-3 pb-3 pt-0 border-t border-gray-50 space-y-2">
          {/* Kid knowledge card */}
          {node.tips.length > 0 && (
            <div className="bg-mint-green/8 rounded-xl px-3 py-2.5 flex items-start gap-2">
              <span className="text-base flex-shrink-0">💡</span>
              <div>
                <span className="text-[9px] text-mint-green font-bold">讲给孩子的小知识</span>
                <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">{node.tips[0]}</p>
              </div>
            </div>
          )}

          {/* Time & duration */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] text-text-muted block mb-0.5">开始时间</label>
              <input
                type="time"
                value={node.startTime}
                onChange={(e) => onEditTime('startTime', e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-warm-yellow"
              />
            </div>
            <div>
              <label className="text-[9px] text-text-muted block mb-0.5">游玩时长(分钟)</label>
              <input
                type="number"
                value={node.duration}
                onChange={(e) => onEditTime('duration', e.target.value)}
                min={30} max={240} step={15}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-warm-yellow"
              />
            </div>
          </div>

          {/* Move to another segment */}
          {availableSegments.length > 0 && (
            <div>
              <label className="text-[9px] text-text-muted block mb-1">移动到</label>
              <div className="flex gap-1.5">
                {availableSegments.map((seg) => (
                  <button
                    key={seg}
                    onClick={() => onMove(seg)}
                    className={`text-[10px] px-2 py-1 rounded-full font-medium active:scale-95 ${SEGMENT_META[seg].badge}`}
                  >
                    {SEGMENT_META[seg].icon} {SEGMENT_META[seg].label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button onClick={onViewOnMap} className="flex-1 py-1.5 text-[10px] font-bold bg-sky-blue text-white rounded-lg active:scale-95">
              🗺 地图查看
            </button>
            <button onClick={onConfirmDelete} className="py-1.5 px-3 text-[10px] font-bold bg-red-50 text-red-500 rounded-lg active:scale-95">
              🗑 删除
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
