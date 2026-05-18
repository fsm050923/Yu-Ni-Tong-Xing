import type { TripNode } from '../../types/trip'
import { useTripStore } from '../../stores/useTripStore'
import { useMapStore } from '../../stores/useMapStore'
import { useUIStore } from '../../stores/useUIStore'

interface NodeActionsProps {
  node: TripNode
}

const actionButtons = [
  { key: 'navigate', label: '导航', emoji: '🧭' },
  { key: 'nearby', label: '周边', emoji: '📍' },
  { key: 'ticket', label: '票务', emoji: '🎫' },
  { key: 'reviews', label: '评价', emoji: '💬' },
  { key: 'delete', label: '删除', emoji: '🗑️', danger: true },
  { key: 'duration', label: '时长', emoji: '⏱️' },
]

export default function NodeActions({ node }: NodeActionsProps) {
  const removeNode = useTripStore((s) => s.removeNode)
  const adjustNodeDuration = useTripStore((s) => s.adjustNodeDuration)
  const selectNode = useMapStore((s) => s.selectNode)
  const showToast = useUIStore((s) => s.showToast)

  const handleAction = (key: string) => {
    switch (key) {
      case 'navigate':
        window.open(
          `https://uri.amap.com/navigation?to=${node.lng},${node.lat},${encodeURIComponent(node.name)}&mode=walk`,
          '_blank'
        )
        break
      case 'nearby':
        showToast('正在查找周边设施...', 'info')
        break
      case 'ticket':
        if (node.ticketInfo?.bookingUrl) {
          window.open(node.ticketInfo.bookingUrl, '_blank')
        } else {
          showToast('该景点无需预约或暂未提供票务链接', 'info')
        }
        break
      case 'reviews':
        showToast('正在获取家长真实评价...', 'info')
        break
      case 'delete':
        removeNode(node.id)
        selectNode(null)
        showToast('节点已删除，AI正在重新规划路线...', 'success')
        break
      case 'duration':
        const newDur = node.duration >= 120 ? 60 : node.duration + 30
        adjustNodeDuration(node.id, newDur)
        showToast(`停留时长已调整为${newDur}分钟`, 'success')
        break
    }
  }

  return (
    <div className="px-5 py-2">
      <div className="grid grid-cols-3 gap-2">
        {actionButtons.map((action) => (
          <button
            key={action.key}
            onClick={() => handleAction(action.key)}
            className={`flex flex-col items-center gap-1 py-2.5 rounded-xl transition-colors active:scale-95 ${
              action.danger
                ? 'bg-red-50 text-red-500 hover:bg-red-100'
                : 'bg-gray-50 text-text-secondary hover:bg-warm-yellow/10 hover:text-warm-orange'
            }`}
          >
            <span className="text-lg">{action.emoji}</span>
            <span className="text-[10px] font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
