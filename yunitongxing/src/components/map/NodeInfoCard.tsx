import { useState, useEffect } from 'react'
import { useTripStore } from '../../stores/useTripStore'
import { useMapStore } from '../../stores/useMapStore'
import { useUIStore } from '../../stores/useUIStore'
import { getPoiIcon, getPoiLabel, getPoiColor } from '../../constants/poi-types'
import { searchAround, walkingRoute, type AmapPOI, isAmapConfigured } from '../../services/amap'

export default function NodeInfoCard() {
  const currentTrip = useTripStore((s) => s.currentTrip)
  const selectedNodeId = useMapStore((s) => s.selectedNodeId)
  const isOpen = useMapStore((s) => s.isNodeCardOpen)
  const selectNode = useMapStore((s) => s.selectNode)
  const removeNode = useTripStore((s) => s.removeNode)
  const showToast = useUIStore((s) => s.showToast)

  const [nearbyPois, setNearbyPois] = useState<AmapPOI[]>([])
  const [loadingNearby, setLoadingNearby] = useState(false)
  const [showNearby, setShowNearby] = useState(false)
  const [walkDistance, setWalkDistance] = useState<string>('')

  if (!isOpen || !selectedNodeId || !currentTrip) return null

  const allNodes = currentTrip.days.flatMap((d) =>
    [...d.segments.morning, ...d.segments.afternoon, ...d.segments.evening]
  )
  const node = allNodes.find((n) => n.id === selectedNodeId)
  if (!node) return null

  const photos = node.photos || []
  const hasPhoto = photos.length > 0
  const hasDescription = !!(node.description && node.description !== node.address)

  async function loadNearby() {
    if (!isAmapConfigured()) {
      showToast('需要配置高德API Key', 'info')
      return
    }
    setLoadingNearby(true)
    setShowNearby(true)
    try {
      console.log(`[NodeInfoCard] searching around ${node!.lng},${node!.lat}`)
      // Try pipe-separated keywords (already converted in amap.ts)
      let result = await searchAround({
        location: `${node!.lng},${node!.lat}`,
        keywords: '餐厅|母婴室|便利店|咖啡厅|亲子',
        radius: 1500,
        offset: 10,
      })
      console.log(`[NodeInfoCard] nearby search returned ${result.pois.length} POIs`)

      // If nothing found, try broader search without keyword filter
      if (result.pois.length === 0) {
        console.log('[NodeInfoCard] retrying with broader search...')
        result = await searchAround({
          location: `${node!.lng},${node!.lat}`,
          radius: 2000,
          offset: 10,
        })
        console.log(`[NodeInfoCard] broad retry returned ${result.pois.length} POIs`)
      }

      setNearbyPois(result.pois.slice(0, 6))
      if (result.pois.length === 0) {
        showToast('该位置周边暂无收录设施', 'info')
      }
    } catch (err) {
      console.warn('[NodeInfoCard] nearby search error:', err)
      showToast('周边搜索失败，请稍后重试', 'error')
    }
    setLoadingNearby(false)
  }

  function handleNavigate() {
    window.open(
      `https://uri.amap.com/navigation?to=${node!.lng},${node!.lat},${encodeURIComponent(node!.name)}&mode=walk&callnative=1`,
      '_blank',
    )
  }

  function handleOpenAmap() {
    if (node!.amapId) {
      window.open(`https://ditu.amap.com/detail/${node!.amapId}`, '_blank')
    } else {
      window.open(`https://ditu.amap.com/search?query=${encodeURIComponent(node!.name)}&city=${encodeURIComponent(currentTrip!.destination)}`, '_blank')
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/25 z-[1000]" onClick={() => { selectNode(null); setShowNearby(false) }} />
      <div className="fixed bottom-0 left-0 right-0 z-[1001] bg-white rounded-t-[24px] shadow-2xl animate-slide-up max-w-md mx-auto max-h-[80vh] overflow-y-auto no-scrollbar">
        <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-white rounded-t-[24px] z-10">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Photo carousel */}
        {hasPhoto && (
          <div className="px-4 mb-2">
            <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x">
              {photos.slice(0, 5).map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`${node.name} ${i + 1}`}
                  className="w-40 h-24 rounded-xl object-cover flex-shrink-0 snap-center border border-gray-100"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="px-5 py-2 flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: getPoiColor(node.poiType) + '20' }}>
            {getPoiIcon(node.poiType)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-text-primary text-base">{node.name}</h3>
            <p className="text-xs text-text-muted">
              {getPoiLabel(node.poiType)} · {node.startTime}-{node.endTime} · {node.duration}分钟
            </p>
            {node.address && <p className="text-[10px] text-text-muted mt-0.5 truncate">📍 {node.address}</p>}
          </div>
          <div className="flex items-center gap-0.5">
            <span className="text-sm text-warm-yellow font-bold">★</span>
            <span className="text-sm font-bold">{node.rating || node.childFriendlinessRating}</span>
          </div>
        </div>

        {/* Description */}
        {hasDescription && (
          <p className="px-5 text-xs text-text-secondary leading-relaxed mb-2">
            {node.description}
          </p>
        )}

        {/* Walking info */}
        {node.walkingFromPrev && (
          <div className="mx-5 mb-2 px-3 py-1.5 bg-warm-bg rounded-xl text-xs text-text-secondary flex items-center gap-2">
            🚶 步行{node.walkingFromPrev.distance}米 · 约{node.walkingFromPrev.duration}分钟
          </div>
        )}

        {/* Main action buttons */}
        <div className="px-4 mb-3 grid grid-cols-3 gap-2">
          <button onClick={handleNavigate} className="flex flex-col items-center py-2.5 bg-sky-blue text-white rounded-xl active:scale-95">
            <span className="text-lg">🧭</span>
            <span className="text-[10px] font-medium">导航去</span>
          </button>
          <button onClick={loadNearby} className="flex flex-col items-center py-2.5 bg-mint-green text-white rounded-xl active:scale-95">
            <span className="text-lg">📍</span>
            <span className="text-[10px] font-medium">{showNearby ? '已搜索' : '搜周边'}</span>
          </button>
          <button onClick={handleOpenAmap} className="flex flex-col items-center py-2.5 bg-warm-yellow text-white rounded-xl active:scale-95">
            <span className="text-lg">💬</span>
            <span className="text-[10px] font-medium">评价详情</span>
          </button>
        </div>

        {/* Nearby POIs */}
        {showNearby && (
          <div className="px-4 pb-3 border-t border-gray-50 pt-3">
            <h4 className="text-xs font-bold text-text-primary mb-2">🔍 周边设施</h4>
            {loadingNearby ? (
              <div className="text-center py-3 text-xs text-text-muted">搜索中...</div>
            ) : nearbyPois.length > 0 ? (
              <div className="space-y-1.5">
                {nearbyPois.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs py-1.5 px-2 bg-gray-50 rounded-lg">
                    <span className="text-sm">{p.typecode?.startsWith('05') ? '🍽' : '📍'}</span>
                    <span className="flex-1 font-medium truncate">{p.name}</span>
                    {p.distance && <span className="text-text-muted">{parseInt(p.distance)}m</span>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-2 text-xs text-text-muted">未找到周边设施</div>
            )}
            <button onClick={() => setShowNearby(false)} className="w-full text-xs text-text-muted py-1 mt-1">收起</button>
          </div>
        )}

        {/* Ticket info */}
        {node.ticketInfo && (
          <div className="px-5 py-3 border-t border-gray-50">
            <p className="text-xs font-bold mb-2">🎫 票务</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 rounded-lg p-2">
                <span className="text-text-muted">成人</span>
                <p className="font-bold">¥{node.ticketInfo.adultPrice}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <span className="text-text-muted">儿童</span>
                <p className="font-bold">{node.ticketInfo.hasChildTicket ? `¥${node.ticketInfo.childPrice}` : '免费'}</p>
              </div>
            </div>
          </div>
        )}

        <div className="h-6 safe-area-bottom" />
      </div>
    </>
  )
}
