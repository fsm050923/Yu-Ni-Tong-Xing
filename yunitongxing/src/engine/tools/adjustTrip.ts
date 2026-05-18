import { useTripStore } from '../../stores/useTripStore'
import { useUIStore } from '../../stores/useUIStore'

export interface AdjustTripArgs {
  adjustmentType: 'replace' | 'insert' | 'delete' | 'reschedule'
  description: string
  nodeId?: string
}

export async function adjustTrip(args: AdjustTripArgs) {
  const tripStore = useTripStore.getState()
  const trip = tripStore.currentTrip

  if (!trip) return { success: false, error: '没有当前行程' }

  switch (args.adjustmentType) {
    case 'reschedule': {
      // Adjust timing based on description
      const nodes = trip.days.flatMap((d) => [
        ...d.segments.morning,
        ...d.segments.afternoon,
        ...d.segments.evening,
      ])

      // Shift all times by 30 min if "晚一点" or similar
      if (args.description.includes('晚') || args.description.includes('推迟')) {
        nodes.forEach((n) => {
          const [h, m] = n.startTime.split(':').map(Number)
          const newStart = h * 60 + m + 30
          const newH = Math.floor(newStart / 60)
          const newM = newStart % 60
          tripStore.updateNode(n.id, {
            startTime: `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`,
          })
        })
      }

      return { success: true, changedNodes: nodes.length, adjustment: 'reschedule' }
    }

    case 'delete': {
      if (args.nodeId) {
        tripStore.removeNode(args.nodeId)
        useUIStore.getState().showToast?.('已删除节点', 'success')
      }
      return { success: true, deleted: args.nodeId }
    }

    case 'replace': {
      // Mark the trip as needing replacement — actual Poi search done by caller
      return { success: true, message: '请使用 searchPoi 查找替换节点', adjustment: 'replace' }
    }

    default:
      return { success: false, error: `不支持的操作: ${args.adjustmentType}` }
  }
}
