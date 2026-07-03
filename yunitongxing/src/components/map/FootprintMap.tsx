import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useTripStore } from '../../stores/useTripStore'

const TRIP_COLORS = ['#FF6B35', '#FF2D78', '#7C3AED', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#6366F1']

const AMAP_TILE_URL = 'https://wprd0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=7'

interface CityGroup {
  city: string
  trips: Array<{ id: string; title: string; date: string; mode: string; poiCount: number }>
  lat: number
  lng: number
  color: string
}

export default function FootprintMap({ onClose }: { onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const tripHistory = useTripStore((s) => s.tripHistory)
  const currentTrip = useTripStore((s) => s.currentTrip)

  const allTrips = [...tripHistory]
  if (currentTrip) {
    const exists = allTrips.some((t) => t.id === currentTrip.id)
    if (!exists) allTrips.unshift(currentTrip)
  }

  // Group by destination city and collect coordinates
  const cityGroups: CityGroup[] = []
  allTrips.forEach((t, tripIdx) => {
    if (!t.days) return
    const allNodes = t.days.flatMap((d) =>
      [...d.segments.morning, ...d.segments.afternoon, ...d.segments.evening]
    )
    const nodesWithCoords = allNodes.filter((n) => n.lat && n.lng)
    if (nodesWithCoords.length === 0) return

    const city = t.destination || t.title || '未知'
    const existing = cityGroups.find((g) => g.city === city)
    if (existing) {
      existing.trips.push({
        id: t.id,
        title: t.title || t.destination,
        date: t.days[0]?.date || '',
        mode: t.mode || 'standard',
        poiCount: nodesWithCoords.length,
      })
    } else {
      const avgLat = nodesWithCoords.reduce((s, n) => s + n.lat, 0) / nodesWithCoords.length
      const avgLng = nodesWithCoords.reduce((s, n) => s + n.lng, 0) / nodesWithCoords.length
      cityGroups.push({
        city,
        trips: [{
          id: t.id,
          title: t.title || t.destination,
          date: t.days[0]?.date || '',
          mode: t.mode || 'standard',
          poiCount: nodesWithCoords.length,
        }],
        lat: avgLat,
        lng: avgLng,
        color: TRIP_COLORS[cityGroups.length % TRIP_COLORS.length],
      })
    }
  })

  const totalPOIs = allTrips.reduce((s, t) => {
    if (!t.days) return s
    return s + t.days.flatMap((d) =>
      [...d.segments.morning, ...d.segments.afternoon, ...d.segments.evening]
    ).filter((n) => n.lat && n.lng).length
  }, 0)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [35, 110],
      zoom: 4,
      zoomControl: true,
      attributionControl: false,
    })

    L.tileLayer(AMAP_TILE_URL, {
      subdomains: ['1', '2', '3', '4'],
      maxZoom: 18,
      minZoom: 3,
    }).addTo(map)

    map.zoomControl.setPosition('bottomright')
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Place city markers
  useEffect(() => {
    const map = mapRef.current
    if (!map || cityGroups.length === 0) return

    const markers: L.Marker[] = []

    cityGroups.forEach((group) => {
      const visitCount = group.trips.length
      const totalPOIs = group.trips.reduce((s, t) => s + t.poiCount, 0)
      const size = Math.min(56 + visitCount * 6, 80)

      const icon = L.divIcon({
        className: 'footprint-city-marker',
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.25));">
            <!-- Pin body -->
            <div style="
              width: ${size}px; height: ${size}px;
              background: linear-gradient(135deg, ${group.color}, ${group.color}BB);
              border: 3px solid white;
              border-radius: 50% 50% 50% 6px;
              display: flex; align-items: center; justify-content: center;
              box-shadow: 0 4px 16px ${group.color}60;
              transform: rotate(-2deg);
            ">
              <span style="font-size: ${size > 60 ? '24px' : '20px'};">📍</span>
            </div>
            <!-- City label bubble -->
            <div style="
              margin-top: 4px; padding: 3px 10px;
              background: white; border-radius: 12px;
              font-size: 11px; font-weight: 800; color: #3A3226;
              white-space: nowrap;
              box-shadow: 0 2px 8px rgba(0,0,0,0.12);
              border: 2px solid ${group.color}40;
            ">
              ${group.city}
              <span style="
                display: inline-block; margin-left: 2px;
                background: ${group.color}; color: white;
                border-radius: 50%; width: 18px; height: 18px;
                text-align: center; line-height: 18px;
                font-size: 10px; font-weight: 700;
              ">${visitCount}</span>
            </div>
          </div>
        `,
        iconSize: [size + 10, size + 30],
        iconAnchor: [(size + 10) / 2, size + 30],
      })

      const tripListHtml = group.trips.map((t) => `
        <div style="margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid #f0f0f0;">
          <div style="font-weight: 700; color: #5B4636; font-size: 13px;">${t.title}</div>
          <div style="font-size: 11px; color: #999;">${t.date} · ${t.poiCount}个地点 · ${t.mode === 'relaxed' ? '悠闲' : t.mode === 'compact' ? '紧凑' : '标准'}</div>
        </div>
      `).join('')

      const marker = L.marker([group.lat, group.lng], { icon })
        .bindPopup(`
          <div style="min-width: 160px; font-family: 'Noto Sans SC', sans-serif;">
            <div style="font-size: 14px; font-weight: 800; color: ${group.color}; margin-bottom: 6px;">
              ${group.city} · ${visitCount}次出行 · ${totalPOIs}个地点
            </div>
            ${tripListHtml}
          </div>
        `, { maxWidth: 260, className: 'footprint-popup' })

      marker.addTo(map)
      markers.push(marker)
    })

    // Fit bounds
    if (cityGroups.length === 1) {
      map.setView([cityGroups[0].lat, cityGroups[0].lng], 10)
    } else if (cityGroups.length > 1) {
      const bounds = L.latLngBounds(
        cityGroups.map((g) => [g.lat, g.lng] as [number, number])
      )
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 10 })
    }

    return () => {
      markers.forEach((m) => m.remove())
    }
  }, [allTrips.length, totalPOIs])

  return (
    <div className="fixed inset-0 z-[3000] flex flex-col bg-white">
      {/* Header */}
      <div className="safe-area-top px-4 py-3 flex items-center justify-between border-b border-gray-100 bg-white/90 backdrop-blur z-10">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2" style={{ color: '#5B4636' }}>
            👣 成长足迹
          </h2>
          <p className="text-[10px] text-text-muted mt-0.5">
            {allTrips.length}次出行 · {totalPOIs}个地点 · {cityGroups.length}座城市
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-text-muted active:scale-95"
        >
          ✕
        </button>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {cityGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full bg-gray-50">
            <div className="text-5xl mb-3">🗺️</div>
            <p className="text-sm text-text-muted">还没有出行记录</p>
            <p className="text-xs text-text-muted mt-1">在首页规划你的第一次亲子游，每一条路线都会留在这里</p>
          </div>
        ) : (
          <div ref={containerRef} className="w-full h-full" style={{ backgroundColor: '#FFF8F0' }} />
        )}
      </div>

      {/* Legend */}
      {cityGroups.length > 0 && (
        <div className="px-4 py-3 bg-white border-t border-gray-100">
          <p className="text-[10px] text-text-muted mb-2">去过的城市</p>
          <div className="flex items-center gap-2 flex-wrap">
            {cityGroups.map((g) => (
              <span
                key={g.city}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium active:scale-95 cursor-pointer"
                style={{
                  backgroundColor: g.color + '14',
                  color: g.color,
                  border: `1px solid ${g.color}30`,
                }}
                onClick={() => {
                  const map = mapRef.current
                  if (map) {
                    map.setView([g.lat, g.lng], 10, { animate: true })
                  }
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                {g.city} · {g.trips.length}次
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bottom quote */}
      {cityGroups.length > 0 && (
        <div className="text-center py-2 bg-white">
          <p className="text-[10px]" style={{ color: '#D4B896' }}>用AI守护每一段亲子时光 —— 与你童行</p>
        </div>
      )}
    </div>
  )
}
