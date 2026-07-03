import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Trip, TripNode } from '../../types/trip'
import { enrichTripRoutes } from '../../services/amap'

interface TripResultCardProps {
  trip: Trip
}

const POI_ICONS: Record<string, string> = {
  museum: '🏛️', playground: '🎠', park: '🌳', restaurant: '🍽️',
  'indoor-play': '🎮', 'science-center': '🔬', nursery: '🍼', restroom: '🚻',
  'water-fountain': '💧', parking: '🅿️', rest: '☕', transport: '🚗',
}

const SEGMENT_LABELS: Record<string, string> = {
  morning: '上午', afternoon: '下午', evening: '晚上',
}

function NodeCard({ node, isLast }: { node: TripNode; isLast: boolean }) {
  return (
    <div className="flex items-start gap-3 relative">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
          node.indoor ? 'bg-sky-blue border-sky-blue/30' : 'bg-warm-yellow border-warm-yellow/30'
        }`} />
        {!isLast && <div className="w-0.5 h-full min-h-[20px] bg-gray-200 mt-1" />}
      </div>

      <div className={`flex-1 min-w-0 ${!isLast ? 'pb-3' : ''}`}>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[11px] font-mono text-text-muted">{node.startTime}</span>
          <span className="text-[10px] text-gray-300">→</span>
          <span className="text-[11px] font-mono text-text-muted">{node.endTime}</span>
          <span className="text-[10px] text-gray-400 ml-0.5">({node.duration}min)</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-medium text-text-primary">{POI_ICONS[node.poiType] || '📍'}</span>
          <span className="text-sm font-medium text-text-primary">{node.name}</span>
          {node.indoor
            ? <span className="text-[9px] px-1 py-0.5 rounded bg-sky-blue/10 text-sky-blue">室内</span>
            : <span className="text-[9px] px-1 py-0.5 rounded bg-warm-yellow/10 text-warm-yellow">户外</span>
          }
        </div>

        <div className="flex items-center gap-2 mt-1">
          {/* Stars */}
          <span className="text-[10px] text-warm-yellow">
            {'★'.repeat(node.childFriendlinessRating)}{'☆'.repeat(5 - node.childFriendlinessRating)}
          </span>
          {node.tips?.slice(0, 1).map((t, i) => (
            <span key={i} className="text-[10px] text-text-muted truncate">💡 {t}</span>
          ))}
        </div>

        {node.ticketInfo && (
          <span className="text-[10px] text-mint-green mt-0.5 block">
            {node.ticketInfo.adultPrice > 0
              ? `🎫 成人¥${node.ticketInfo.adultPrice} 儿童¥${node.ticketInfo.childPrice}`
              : '🆓 免费'}
          </span>
        )}
      </div>
    </div>
  )
}

export default function TripResultCard({ trip }: TripResultCardProps) {
  const navigate = useNavigate()
  const [goingToMap, setGoingToMap] = useState(false)
  const allNodes = trip.days.flatMap((d) => [
    ...d.segments.morning,
    ...d.segments.afternoon,
    ...d.segments.evening,
  ])

  const morningNodes = trip.days.flatMap((d) => d.segments.morning)
  const afternoonNodes = trip.days.flatMap((d) => d.segments.afternoon)
  const indoorCount = allNodes.filter((n) => n.indoor).length
  const outdoorCount = allNodes.filter((n) => !n.indoor).length
  const restaurantCount = allNodes.filter((n) => n.type === 'restaurant').length
  const freeCount = allNodes.filter((n) => !n.ticketInfo || n.ticketInfo.adultPrice === 0).length

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden max-w-[92%]">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 bg-gradient-to-r from-warm-yellow/10 to-sky-blue/10">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-text-primary" style={{ fontFamily: 'var(--font-display)' }}>
            {trip.title}
          </h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/80 text-text-muted">
            {trip.mode === 'relaxed' ? '🐢 悠闲' : trip.mode === 'compact' ? '🐇 紧凑' : '🚶 标准'}
          </span>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <span className="text-[10px] text-text-muted">📍 {trip.destination}</span>
          {trip.days.length > 1 && <span className="text-[10px] text-warm-orange font-medium">📅 {trip.days.length}天</span>}
          <span className="text-[10px] text-text-muted">👶 {trip.childAge}岁</span>
          <span className="text-[10px] text-text-muted">🏠 {indoorCount}室内</span>
          <span className="text-[10px] text-text-muted">🌤 {outdoorCount}户外</span>
          {restaurantCount > 0 && <span className="text-[10px] text-text-muted">🍽 {restaurantCount}餐厅</span>}
          {freeCount > 0 && <span className="text-[10px] text-mint-green">🆓 {freeCount}免费</span>}
        </div>
      </div>

      {/* Timeline — grouped by day */}
      <div className="px-4 py-2 space-y-3">
        {trip.days.map((day, di) => {
          const dayMorning = day.segments.morning
          const dayAfternoon = day.segments.afternoon
          const dayEvening = day.segments.evening
          const dayAll = [...dayMorning, ...dayAfternoon, ...dayEvening]
          const isMultiDay = trip.days.length > 1

          return (
            <div key={di}>
              {isMultiDay && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-text-primary">
                    📅 第{di + 1}天
                  </span>
                  <span className="text-[10px] text-text-muted">{day.date}</span>
                </div>
              )}
              {dayMorning.length > 0 && (
                <div className="mb-2">
                  <span className="text-[10px] font-bold text-warm-yellow bg-warm-yellow/10 px-2 py-0.5 rounded-full">☀️ 上午</span>
                  <div className="mt-2 ml-1">
                    {dayMorning.map((n, i) => (
                      <NodeCard key={n.id} node={n} isLast={i === dayMorning.length - 1 && dayAfternoon.length === 0 && dayEvening.length === 0} />
                    ))}
                  </div>
                </div>
              )}
              {dayAfternoon.length > 0 && (
                <div className="mb-2">
                  <span className="text-[10px] font-bold text-sky-blue bg-sky-blue/10 px-2 py-0.5 rounded-full">🌤 下午</span>
                  <div className="mt-2 ml-1">
                    {dayAfternoon.map((n, i) => (
                      <NodeCard key={n.id} node={n} isLast={i === dayAfternoon.length - 1 && dayEvening.length === 0} />
                    ))}
                  </div>
                </div>
              )}
              {dayEvening.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-purple-500 bg-purple-50 px-2 py-0.5 rounded-full">🌙 晚上</span>
                  <div className="mt-2 ml-1">
                    {dayEvening.map((n, i) => (
                      <NodeCard key={n.id} node={n} isLast={i === dayEvening.length - 1} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer actions */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-t border-gray-50 bg-gray-50/50">
        <button
          onClick={async () => {
            setGoingToMap(true)
            await enrichTripRoutes()
            navigate('/map')
          }}
          disabled={goingToMap}
          className="flex-1 py-1.5 text-xs font-medium bg-sky-blue text-white rounded-lg active:scale-95 transition-all disabled:opacity-60"
        >
          {goingToMap ? '⏳ 生成路线...' : '🗺 查看地图'}
        </button>
        <button
          onClick={() => navigate('/planner')}
          className="flex-1 py-1.5 text-xs font-medium bg-white text-text-secondary border border-gray-200 rounded-lg active:scale-95 transition-all"
        >
          ✏️ 调整行程
        </button>
      </div>
    </div>
  )
}
