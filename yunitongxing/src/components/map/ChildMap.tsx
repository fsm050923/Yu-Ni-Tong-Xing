import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'
import { useTripStore } from '../../stores/useTripStore'
import { useMapStore } from '../../stores/useMapStore'
import { getPoiColor } from '../../constants/poi-types'
import { searchAround, isAmapConfigured, enrichTripRoutes, type AmapPOI } from '../../services/amap'
import type { TripNode } from '../../types/trip'

// Kid-friendly crayon palette
const SEGMENT_COLORS = {
  morning: '#FF6B35',
  afternoon: '#FF2D78',
  evening: '#7C3AED',
}

// Amap tiles — style 7 (clear labels) works on wprd domain
const AMAP_TILE_URL = 'https://wprd0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=7'

const ORDER_NUMS = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⑭', '⑮']

const POI_EMOJIS: Record<string, string> = {
  museum: '🏛️', playground: '🎠', park: '🌳', restaurant: '🍽️',
  'indoor-play': '🎮', 'science-center': '🔬', nursery: '🍼', restroom: '🚻',
  'water-fountain': '💧', parking: '🅿️', rest: '☕', transport: '🚗',
}

const FACILITY_EMOJIS: Record<string, string> = {
  '050000': '🍽️', '050100': '🍽️', '050200': '🍽️',
  '070000': '🛒', '070100': '🛒',
  '080000': '🏥', '080500': '🍼', '080507': '🍼',
  '140000': '🎠', '140200': '🎨',
}

// ─── Cluster icon factory ───
function createClusterIcon(cluster: L.MarkerCluster) {
  const count = cluster.getChildCount()
  let size: number; let color: string
  if (count < 5) { size = 40; color = '#FF8C42' }
  else if (count < 10) { size = 48; color = '#FF6B35' }
  else { size = 56; color = '#FF2D78' }

  return L.divIcon({
    html: `<div style="
      width: ${size}px; height: ${size}px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
      font-size: ${count < 10 ? '14px' : '16px'};
      font-weight: 800; color: white;
    ">${count}</div>`,
    className: 'trip-cluster',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

export default function ChildMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null)
  const polylinesRef = useRef<L.Layer[]>([])
  const facilityMarkersRef = useRef<L.Marker[]>([])

  const currentTrip = useTripStore((s) => s.currentTrip)
  const center = useMapStore((s) => s.center)
  const zoom = useMapStore((s) => s.zoom)
  const selectNode = useMapStore((s) => s.selectNode)
  const selectedNodeId = useMapStore((s) => s.selectedNodeId)
  const setCenter = useMapStore((s) => s.setCenter)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: true,
      attributionControl: false,
    })

    L.tileLayer(AMAP_TILE_URL, {
      subdomains: ['1', '2', '3', '4'],
      maxZoom: 18,
      minZoom: 3,
    }).addTo(map)

    map.zoomControl.setPosition('bottomright')

    map.on('moveend', () => {
      const c = map.getCenter()
      setCenter([c.lat, c.lng])
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Update markers + routes when trip or selection changes
  useEffect(() => {
    const map = mapRef.current
    if (!map || !currentTrip) return

    // Clear old cluster group
    if (clusterRef.current) {
      map.removeLayer(clusterRef.current)
      clusterRef.current = null
    }
    polylinesRef.current.forEach((p) => p.remove())
    polylinesRef.current = []
    facilityMarkersRef.current.forEach((m) => m.remove())
    facilityMarkersRef.current = []

    // Collect nodes with per-day ordering
    const allNodes: Array<{ node: TripNode; orderInDay: number; dayIndex: number }> = []
    currentTrip.days.forEach((day, dayIdx) => {
      const ordered = [...day.segments.morning, ...day.segments.afternoon, ...day.segments.evening]
      ordered.forEach((node, i) => {
        allNodes.push({ node, orderInDay: i, dayIndex: dayIdx })
      })
    })

    if (allNodes.length === 0) return

    const isMultiDay = currentTrip.days.length > 1

    // Create cluster group with kid-friendly cluster icons
    const cluster = L.markerClusterGroup({
      maxClusterRadius: 60,
      spiderfyOnEveryZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 15,
      iconCreateFunction: (c) => createClusterIcon(c as unknown as L.MarkerCluster),
    })

    // Create cartoon markers
    allNodes.forEach(({ node, orderInDay, dayIndex }) => {
      const color = getPoiColor(node.poiType)
      const emoji = POI_EMOJIS[node.poiType] || '📍'
      const isSelected = selectedNodeId === node.id
      const orderNum = ORDER_NUMS[orderInDay] || String(orderInDay + 1)
      const size = isSelected ? 56 : 44
      const badgeSize = isSelected ? 22 : 18

      const icon = L.divIcon({
        className: 'cartoon-marker',
        html: `
          <div class="flex flex-col items-center" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.18));">
            <div style="position: relative; width: ${size}px; height: ${size}px;">
              <div style="
                width: ${size}px; height: ${size}px;
                background: linear-gradient(135deg, ${color}, ${color}CC);
                border: 3px solid white;
                border-radius: 50% 50% 50% 8px;
                display: flex; align-items: center; justify-content: center;
                box-shadow: 0 4px 14px rgba(0,0,0,0.25);
                transform: rotate(-3deg);
              ">
                <span style="font-size: ${isSelected ? '26px' : '20px'};">${emoji}</span>
              </div>
              <!-- Red order badge -->
              <div style="
                position: absolute; top: -5px; right: -8px;
                width: ${badgeSize}px; height: ${badgeSize}px;
                background: #FF4444; color: white;
                border-radius: 50%; border: 2.5px solid white;
                display: flex; align-items: center; justify-content: center;
                font-size: ${isSelected ? '14px' : '11px'};
                font-weight: 800; line-height: 1;
                box-shadow: 0 2px 8px rgba(255,68,68,0.45);
                z-index: 10;
              ">${orderNum}</div>
            </div>
            <!-- Name + duration label -->
            <div style="
              margin-top: 3px; padding: 2px 8px;
              background: white; border-radius: 14px;
              font-size: ${isSelected ? '12px' : '10px'};
              font-weight: 700; color: #3A3226;
              white-space: nowrap;
              box-shadow: 0 2px 8px rgba(0,0,0,0.12);
              border: 2px solid ${color}50;
              max-width: 110px; overflow: hidden; text-overflow: ellipsis;
            ">
              ${isMultiDay ? `D${dayIndex + 1}·` : ''}${node.name.slice(0, 7)}
              <span style="color: ${color}; font-size: ${isSelected ? '10px' : '8px'};"> · ${node.duration}min</span>
            </div>
          </div>
        `,
        iconSize: [isSelected ? 76 : 66, isSelected ? 100 : 86],
        iconAnchor: [isSelected ? 38 : 33, isSelected ? 100 : 86],
      })

      const marker = L.marker([node.lat, node.lng], { icon })
        .on('click', () => selectNode(node.id))

      cluster.addLayer(marker)
    })

    map.addLayer(cluster)
    clusterRef.current = cluster

    // Draw routes + footprint arrows
    polylinesRef.current = drawRoutes(map, currentTrip, clusterRef)

    // Fit bounds — gentler zoom so markers spread apart
    const lats = allNodes.map(({ node: n }) => n.lat)
    const lngs = allNodes.map(({ node: n }) => n.lng)
    const latSpread = Math.max(...lats) - Math.min(...lats)
    const lngSpread = Math.max(...lngs) - Math.min(...lngs)
    const pad = Math.max(latSpread, lngSpread) * 0.3
    const bounds = L.latLngBounds(
      [Math.min(...lats) - pad, Math.min(...lngs) - pad],
      [Math.max(...lats) + pad, Math.max(...lngs) + pad]
    )
    // Lower maxZoom so nearby markers can breathe
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 })

    // Auto-load nearby kid-friendly facilities
    loadNearbyFacilities(map, allNodes)
  }, [currentTrip, selectedNodeId])

  // Auto-enrich walking routes if trip has nodes but no walking data
  useEffect(() => {
    if (!currentTrip) return
    const allNodes = currentTrip.days.flatMap((d) =>
      [...d.segments.morning, ...d.segments.afternoon, ...d.segments.evening]
    )
    if (allNodes.length < 2) return
    const hasWalkingData = allNodes.slice(1).some((n) => n.walkingFromPrev?.polyline)
    if (hasWalkingData) return

    console.log('[ChildMap] auto-enriching walking routes...')
    enrichTripRoutes()
  }, [currentTrip?.id])

  async function loadNearbyFacilities(
    map: L.Map,
    allNodes: Array<{ node: TripNode; orderInDay: number; dayIndex: number }>,
  ) {
    if (!isAmapConfigured() || allNodes.length === 0) return

    const avgLng = allNodes.reduce((s, { node: n }) => s + n.lng, 0) / allNodes.length
    const avgLat = allNodes.reduce((s, { node: n }) => s + n.lat, 0) / allNodes.length

    try {
      const result = await searchAround({
        location: `${avgLng},${avgLat}`,
        keywords: '母婴室|儿童餐厅|游乐场|亲子|便利店',
        radius: 3000,
        offset: 6,
      })

      result.pois.slice(0, 6).forEach((poi) => {
        if (!poi.location) return
        const [lng, lat] = poi.location.split(',').map(Number)
        if (!lat || !lng) return

        const emoji = getFacilityEmoji(poi)
        const isNursery = poi.typecode === '080507'

        const icon = L.divIcon({
          className: 'facility-marker',
          html: `
            <div style="
              display: flex; flex-direction: column; align-items: center;
              filter: drop-shadow(0 2px 3px rgba(0,0,0,0.12));
            ">
              <div style="
                width: 30px; height: 30px;
                background: ${isNursery ? '#FFB3BA' : '#BAE1FF'};
                border: 2px solid white;
                border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                font-size: 15px;
                box-shadow: 0 2px 6px rgba(0,0,0,0.15);
              ">${emoji}</div>
              <div style="
                margin-top: 1px; padding: 0px 5px;
                background: white; border-radius: 6px;
                font-size: 8px; font-weight: 600; color: #666;
                white-space: nowrap; max-width: 60px;
                overflow: hidden; text-overflow: ellipsis;
              ">${poi.name.slice(0, 6)}</div>
            </div>
          `,
          iconSize: [34, 44],
          iconAnchor: [17, 44],
        })

        const marker = L.marker([lat, lng], { icon, interactive: true }).addTo(map)
        if (poi.name) marker.bindTooltip(poi.name, { direction: 'top', offset: [0, -28] })
        facilityMarkersRef.current.push(marker)
      })
    } catch {
      // facilities are optional, fail silently
    }
  }

  return (
    <div id="child-map-container" ref={containerRef} className="w-full h-full" style={{ backgroundColor: '#E8F4E8' }} />
  )
}

function getFacilityEmoji(poi: AmapPOI): string {
  for (const [code, emoji] of Object.entries(FACILITY_EMOJIS)) {
    if (poi.typecode?.startsWith(code)) return emoji
  }
  if (poi.type?.includes('餐饮')) return '🍽️'
  if (poi.type?.includes('购物') || poi.type?.includes('便利店')) return '🛒'
  if (poi.type?.includes('医疗')) return '🏥'
  return '🧸'
}

// ==================== Route drawing ====================

function drawRoutes(
  map: L.Map,
  trip: ReturnType<typeof useTripStore.getState>['currentTrip'],
  _clusterRef: React.MutableRefObject<L.MarkerClusterGroup | null>,
): L.Layer[] {
  if (!trip) return []

  const layers: L.Layer[] = []
  const darkBorder = '#2D2318'

  trip.days.forEach((day) => {
    const orderedNodes = [...day.segments.morning, ...day.segments.afternoon, ...day.segments.evening]

    for (let i = 1; i < orderedNodes.length; i++) {
      const prev = orderedNodes[i - 1]
      const curr = orderedNodes[i]
      const walking = curr.walkingFromPrev
      const seg = curr.segment
      const color = SEGMENT_COLORS[seg as keyof typeof SEGMENT_COLORS] || '#FF6B35'

      let positions: [number, number][]
      if (walking?.polyline) {
        positions = decodeAmapPolyline(walking.polyline)
      } else {
        positions = [[prev.lat, prev.lng], [curr.lat, curr.lng]]
      }

      if (positions.length < 2) continue

      // Layer 1: Dark outer stroke
      layers.push(L.polyline(positions, {
        color: darkBorder, weight: 14, opacity: 0.6,
        lineCap: 'round', lineJoin: 'round', interactive: false,
      }).addTo(map))

      // Layer 2: Bright colored core
      layers.push(L.polyline(positions, {
        color, weight: 8, opacity: 0.92,
        lineCap: 'round', lineJoin: 'round', interactive: false,
      }).addTo(map))

      // Layer 3: White dashed trail
      layers.push(L.polyline(positions, {
        color: '#FFFFFF', weight: 3, opacity: 0.65,
        dashArray: '5 18', lineCap: 'round', interactive: false,
      }).addTo(map))

      // 👣 Footprint at midpoint
      const midIdx = Math.floor(positions.length / 2)
      const [midLat, midLng] = positions[midIdx]
      const footprintIcon = L.divIcon({
        className: 'footprint-icon',
        html: `<div style="
          font-size: 18px; transform: translate(-50%, -50%);
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
        ">👣</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })
      const footprintMarker = L.marker([midLat, midLng], {
        icon: footprintIcon, interactive: false,
      }).addTo(map)
      layers.push(footprintMarker)
    }
  })

  return layers
}

function decodeAmapPolyline(polyline: string): [number, number][] {
  return polyline.split(';').map((pair) => {
    const [lng, lat] = pair.split(',').map(Number)
    return [lat, lng]
  }).filter((p) => !isNaN(p[0]) && !isNaN(p[1]))
}
