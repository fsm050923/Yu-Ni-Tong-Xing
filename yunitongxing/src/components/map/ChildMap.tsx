import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useTripStore } from '../../stores/useTripStore'
import { useMapStore } from '../../stores/useMapStore'
import { getPoiColor } from '../../constants/poi-types'

const SEGMENT_COLORS = {
  morning: '#FFB347',
  afternoon: '#FF6B6B',
  evening: '#7B68EE',
}

export default function ChildMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])

  const currentTrip = useTripStore((s) => s.currentTrip)
  const center = useMapStore((s) => s.center)
  const zoom = useMapStore((s) => s.zoom)
  const selectNode = useMapStore((s) => s.selectNode)
  const selectedNodeId = useMapStore((s) => s.selectedNodeId)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: false,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      className: 'cartoon-tiles',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Update markers when trip changes
  useEffect(() => {
    const map = mapRef.current
    if (!map || !currentTrip) return

    // Clear old markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    const allNodes = currentTrip.days.flatMap((d) =>
      [...d.segments.morning, ...d.segments.afternoon, ...d.segments.evening]
    )

    // Create custom icons and markers
    allNodes.forEach((node) => {
      const color = getPoiColor(node.poiType)
      const icon = L.divIcon({
        className: `cartoon-marker ${selectedNodeId === node.id ? 'selected' : ''}`,
        html: `
          <div class="flex flex-col items-center" style="width:44px; filter: drop-shadow(2px 3px 2px rgba(0,0,0,0.12));">
            <div style="
              width:36px; height:42px;
              background: ${color};
              border: 2px solid rgba(0,0,0,0.1);
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              display: flex; align-items: center; justify-content: center;
            ">
              <span style="transform: rotate(45deg); font-size: 16px;">📍</span>
            </div>
            <div style="
              margin-top: -2px; padding: 1px 6px;
              background: white; border-radius: 8px;
              font-size: 9px; font-weight: 600; color: #4A3728;
              white-space: nowrap; text-align: center;
              border: 1px solid ${color}40; max-width: 80px; overflow: hidden; text-overflow: ellipsis;
            ">${node.name.slice(0, 6)}</div>
          </div>
        `,
        iconSize: [44, 64],
        iconAnchor: [22, 64],
      })

      const marker = L.marker([node.lat, node.lng], { icon })
        .addTo(map)
        .on('click', () => selectNode(node.id))

      markersRef.current.push(marker)
    })

    // Draw route polylines
    drawRoutes(map, currentTrip)

    // Fit bounds
    const lats = allNodes.map((n) => n.lat)
    const lngs = allNodes.map((n) => n.lng)
    if (lats.length > 0) {
      map.fitBounds(
        L.latLngBounds(
          [Math.min(...lats) - 0.01, Math.min(...lngs) - 0.01],
          [Math.max(...lats) + 0.01, Math.max(...lngs) + 0.01]
        ),
        { padding: [40, 40] }
      )
    }
  }, [currentTrip, selectedNodeId])

  return (
    <div ref={containerRef} className="w-full h-full" style={{ backgroundColor: '#F5F0E8' }} />
  )
}

function drawRoutes(map: L.Map, trip: ReturnType<typeof useTripStore.getState>['currentTrip']) {
  if (!trip) return

  trip.days.forEach((day) => {
    Object.entries(day.segments).forEach(([seg, nodes]) => {
      if (nodes.length < 2) return
      const color = SEGMENT_COLORS[seg as keyof typeof SEGMENT_COLORS]

      const positions: [number, number][] = nodes.map((n) => [n.lat, n.lng])

      // Draw 3 overlapping lines for crayon/hand-drawn effect
      // Base thick line
      L.polyline(positions, {
        color,
        weight: 5,
        opacity: 0.25,
        lineCap: 'round',
        lineJoin: 'round',
        className: 'hand-drawn-line',
      }).addTo(map)

      // Main line
      L.polyline(positions, {
        color,
        weight: 3,
        opacity: 0.7,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: '12 4',
      }).addTo(map)

      // Dashed overlay
      L.polyline(positions, {
        color: 'white',
        weight: 1,
        opacity: 0.6,
        dashArray: '4 8',
        lineCap: 'round',
      }).addTo(map)
    })
  })
}
