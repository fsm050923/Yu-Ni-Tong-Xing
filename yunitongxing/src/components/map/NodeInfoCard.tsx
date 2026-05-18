import { useTripStore } from '../../stores/useTripStore'
import { useMapStore } from '../../stores/useMapStore'
import { getPoiIcon, getPoiLabel, getPoiColor } from '../../constants/poi-types'
import NodeActions from './NodeActions'

export default function NodeInfoCard() {
  const currentTrip = useTripStore((s) => s.currentTrip)
  const selectedNodeId = useMapStore((s) => s.selectedNodeId)
  const isOpen = useMapStore((s) => s.isNodeCardOpen)
  const selectNode = useMapStore((s) => s.selectNode)

  if (!isOpen || !selectedNodeId || !currentTrip) return null

  const allNodes = currentTrip.days.flatMap((d) =>
    [...d.segments.morning, ...d.segments.afternoon, ...d.segments.evening]
  )
  const node = allNodes.find((n) => n.id === selectedNodeId)
  if (!node) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-[1000]"
        onClick={() => selectNode(null)}
      />

      {/* Card */}
      <div className="fixed bottom-0 left-0 right-0 z-[1001] bg-white rounded-t-[24px] shadow-2xl animate-slide-up max-w-md mx-auto max-h-[70vh] overflow-y-auto">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-2 flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl"
            style={{ backgroundColor: getPoiColor(node.poiType) + '20' }}
          >
            {getPoiIcon(node.poiType)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-text-primary">{node.name}</h3>
            <p className="text-xs text-text-muted">
              {getPoiLabel(node.poiType)} · {node.startTime}-{node.endTime} · {node.duration}分钟
            </p>
          </div>
          <div className="flex items-center gap-1 text-warm-yellow">
            <span>★</span>
            <span className="text-sm font-bold">{node.childFriendlinessRating}</span>
          </div>
        </div>

        {/* Walking info */}
        {node.walkingFromPrev && (
          <div className="mx-5 mb-2 px-3 py-1.5 bg-warm-bg rounded-xl flex items-center gap-2 text-xs text-text-secondary">
            <span>🚶</span>
            <span>步行{node.walkingFromPrev.distance}米 · 约{node.walkingFromPrev.duration}分钟</span>
            {node.walkingFromPrev.childFriendly && <span className="text-green-500">✓ 亲子友好</span>}
          </div>
        )}

        {/* Action buttons */}
        <NodeActions node={node} />

        {/* Tips */}
        {node.tips.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-50">
            <p className="text-xs font-bold text-text-primary mb-2">💡 家长建议</p>
            <div className="space-y-1">
              {node.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-text-secondary">
                  <span>{i + 1}.</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ticket info */}
        {node.ticketInfo && (
          <div className="px-5 py-3 border-t border-gray-50 mb-4">
            <p className="text-xs font-bold text-text-primary mb-2">🎫 票务信息</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
              <div className="bg-gray-50 rounded-lg p-2">
                <span className="text-text-muted">成人票</span>
                <p className="font-bold text-text-primary">¥{node.ticketInfo.adultPrice}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <span className="text-text-muted">儿童票</span>
                <p className="font-bold text-text-primary">
                  {node.ticketInfo.hasChildTicket ? `¥${node.ticketInfo.childPrice}` : '免费'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
