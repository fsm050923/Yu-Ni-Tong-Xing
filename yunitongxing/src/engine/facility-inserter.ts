import type { TripNode, Trip } from '../types/trip'
import { v4Id } from '../utils/id'

interface FacilityTemplate {
  name: string
  poiType: TripNode['poiType']
  duration: number
  indoor: boolean
  tips: string[]
}

const FACILITY_TEMPLATES: Record<string, FacilityTemplate[]> = {
  nursery: [
    { name: '母婴室', poiType: 'nursery', duration: 15, indoor: true, tips: ['配备尿布台、哺乳椅', '建议停留15-20分钟'] },
  ],
  restroom: [
    { name: '亲子卫生间', poiType: 'restroom', duration: 10, indoor: true, tips: ['儿童尺寸设施', '有换尿布台'] },
  ],
  'water-fountain': [
    { name: '饮水处', poiType: 'water-fountain', duration: 5, indoor: false, tips: ['补充水分', '短暂休息'] },
  ],
  restaurant: [
    { name: '亲子餐厅', poiType: 'restaurant', duration: 60, indoor: true, tips: ['儿童套餐', '有游乐角'] },
  ],
  'rest-area': [
    { name: '休息区', poiType: 'rest-area', duration: 15, indoor: false, tips: ['有长椅和遮阳', '适合短暂休息'] },
  ],
}

export class FacilityInserter {
  /**
   * Auto-insert parent-child facilities between trip nodes based on age rules
   */
  insertFacilities(trip: Trip, childAge: number): Trip {
    const updatedDays = trip.days.map((day) => {
      const morning = this.processSegment(day.segments.morning, childAge)
      const afternoon = this.processSegment(day.segments.afternoon, childAge)
      const evening = this.processSegment(day.segments.evening, childAge)

      return {
        ...day,
        segments: { morning, afternoon, evening },
      }
    })

    return { ...trip, days: updatedDays }
  }

  private processSegment(nodes: TripNode[], childAge: number): TripNode[] {
    if (nodes.length < 2) return nodes

    const result: TripNode[] = []
    let accumulatedTime = 0
    const breakInterval = childAge <= 3 ? 60 : childAge <= 6 ? 90 : 120

    for (let i = 0; i < nodes.length; i++) {
      result.push(nodes[i])
      accumulatedTime += nodes[i].duration

      // Check if a break is needed
      if (accumulatedTime >= breakInterval && i < nodes.length - 1) {
        const midLat = (nodes[i].lat + nodes[i + 1].lat) / 2
        const midLng = (nodes[i].lng + nodes[i + 1].lng) / 2

        const facility = this.pickFacility(childAge, accumulatedTime)
        result.push({
          id: v4Id(),
          type: 'facility',
          poiType: facility.poiType,
          name: facility.name,
          lat: midLat + (Math.random() - 0.5) * 0.005,
          lng: midLng + (Math.random() - 0.5) * 0.005,
          startTime: this.calculateTime(nodes[i].endTime),
          endTime: this.calculateTime(nodes[i].endTime, facility.duration),
          duration: facility.duration,
          indoor: facility.indoor,
          tips: facility.tips,
          childFriendlinessRating: 5,
          crowdLevel: 1,
        })
        accumulatedTime = 0
      }
    }

    return result
  }

  private pickFacility(childAge: number, elapsed: number): FacilityTemplate {
    if (childAge <= 3 && elapsed >= 60) {
      return FACILITY_TEMPLATES.nursery[0]
    }
    if (elapsed >= 120) {
      return FACILITY_TEMPLATES.restaurant[0]
    }
    if (elapsed >= 90) {
      return FACILITY_TEMPLATES['rest-area'][0]
    }
    return FACILITY_TEMPLATES['water-fountain'][0]
  }

  private calculateTime(baseTime: string, addMinutes = 0): string {
    const [h, m] = baseTime.split(':').map(Number)
    const total = h * 60 + m + addMinutes
    const newH = Math.floor(total / 60) % 24
    const newM = total % 60
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
  }
}

export const facilityInserter = new FacilityInserter()
