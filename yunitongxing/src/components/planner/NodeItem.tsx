import type { TripNode } from '../../types/trip'
import { getPoiIcon, getPoiLabel, getPoiColor } from '../../constants/poi-types'

interface NodeItemProps {
  node: TripNode
  onTap?: () => void
}

export default function NodeItem({ node, onTap }: NodeItemProps) {
  return (
    <button
      onClick={onTap}
      className="w-full text-left flex items-center gap-2"
    >
      <span
        className="flex items-center justify-center w-7 h-7 rounded-full text-sm"
        style={{ backgroundColor: getPoiColor(node.poiType) + '20' }}
      >
        {getPoiIcon(node.poiType)}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-text-primary truncate">{node.name}</span>
          <span className="text-[10px] text-text-muted">{getPoiLabel(node.poiType)}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-text-muted mt-0.5">
          <span>{node.startTime}-{node.endTime}</span>
          <span>{node.duration}分钟</span>
          {node.walkingFromPrev && (
            <span>🚶 {node.walkingFromPrev.duration}分钟</span>
          )}
        </div>
      </div>
      {/* Star rating */}
      <div className="flex items-center gap-0.5">
        <span className="text-[10px]">★</span>
        <span className="text-[10px] text-text-muted">{node.childFriendlinessRating}</span>
      </div>
    </button>
  )
}
