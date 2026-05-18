import { create } from 'zustand'

interface MapState {
  center: [number, number]
  zoom: number
  selectedNodeId: string | null
  isNodeCardOpen: boolean
  highlightedSegment: 'morning' | 'afternoon' | 'evening' | null
  showNearbyFacilities: boolean
  routePolylines: RoutePolyline[]

  setCenter: (center: [number, number]) => void
  setZoom: (zoom: number) => void
  selectNode: (nodeId: string | null) => void
  toggleNodeCard: (open: boolean) => void
  highlightSegment: (segment: string | null) => void
  toggleNearbyFacilities: () => void
  setRoutePolylines: (polys: RoutePolyline[]) => void
  fitBounds: (nodes: Array<{ lat: number; lng: number }>) => void
}

export interface RoutePolyline {
  positions: [number, number][]
  color: string
  segment: 'morning' | 'afternoon' | 'evening'
  walkingInfo: { distance: number; duration: number } | null
}

export const useMapStore = create<MapState>((set, get) => ({
  center: [39.9042, 116.4074], // default: Beijing
  zoom: 14,
  selectedNodeId: null,
  isNodeCardOpen: false,
  highlightedSegment: null,
  showNearbyFacilities: false,
  routePolylines: [],

  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  selectNode: (nodeId) => set({ selectedNodeId: nodeId, isNodeCardOpen: !!nodeId }),
  toggleNodeCard: (open) => set({ isNodeCardOpen: open }),
  highlightSegment: (segment) => set({ highlightedSegment: segment }),
  toggleNearbyFacilities: () => set((s) => ({ showNearbyFacilities: !s.showNearbyFacilities })),
  setRoutePolylines: (polys) => set({ routePolylines: polys }),
  fitBounds: (nodes) => {
    if (nodes.length === 0) return
    const lats = nodes.map((n) => n.lat)
    const lngs = nodes.map((n) => n.lng)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)
    const center: [number, number] = [(minLat + maxLat) / 2, (minLng + maxLng) / 2]
    const latDiff = maxLat - minLat || 0.02
    const lngDiff = maxLng - minLng || 0.02
    const zoom = Math.min(15, Math.floor(Math.log2(360 / Math.max(latDiff, lngDiff))) - 1)
    set({ center, zoom: Math.max(10, zoom) })
  },
}))
