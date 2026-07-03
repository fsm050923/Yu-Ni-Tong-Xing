import { useTripStore } from '../../stores/useTripStore'
import { useWeatherStore } from '../../stores/useWeatherStore'
import { useAgentStore } from '../../stores/useAgentStore'
import { AGE_RULES } from '../../constants/age-rules'

interface ProactiveCheck {
  shouldNotify: boolean
  message: string
  type: 'rest' | 'weather' | 'facility' | 'crowd' | 'time'
  priority: 'high' | 'medium' | 'low'
}

export class ProactiveAdvisor {
  private lastCheckTime = 0
  private checkInterval = 60000 // Check every 60 seconds

  /**
   * Check all conditions and return suggestions
   * Called periodically or on location change
   */
  check(): ProactiveCheck | null {
    const now = Date.now()
    const agentStore = useAgentStore.getState()
    const effectiveInterval = agentStore.isCompanionMode ? 30000 : this.checkInterval
    if (now - this.lastCheckTime < effectiveInterval) return null
    this.lastCheckTime = now

    const tripStore = useTripStore.getState()
    const trip = tripStore.currentTrip

    if (!trip) return null

    const checks: ProactiveCheck[] = []

    // 0. Companion mode: time-schedule-based checks
    if (agentStore.isCompanionMode) {
      const scheduleCheck = this.checkTripSchedule(trip)
      if (scheduleCheck) checks.push(scheduleCheck)
    }

    // 1. Rest reminder based on elapsed time
    const restCheck = this.checkRestNeeded(trip.childAge)
    if (restCheck) checks.push(restCheck)

    // 2. Weather change warning
    const weatherCheck = this.checkWeatherChange(trip.destination)
    if (weatherCheck) checks.push(weatherCheck)

    // 3. Walking distance warning
    const walkingCheck = this.checkWalkingDistance(trip.childAge)
    if (walkingCheck) checks.push(walkingCheck)

    // 4. Crowd peak time warning
    const crowdCheck = this.checkCrowdPeak()
    if (crowdCheck) checks.push(crowdCheck)

    if (checks.length > 0) {
      // Pick highest priority
      checks.sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 }
        return order[a.priority] - order[b.priority]
      })

      const top = checks[0]
      agentStore.setProactiveSuggestion(top.message)
      return top
    }

    agentStore.setProactiveSuggestion(null)
    return null
  }

  private checkRestNeeded(childAge: number): ProactiveCheck | null {
    const ageGroup = childAge <= 3 ? 'infant' : childAge <= 6 ? 'preschool' : 'school'
    const rules = AGE_RULES[ageGroup]
    const maxHours = rules.maxHours || 4

    // Estimate elapsed time (in a real app, track actual start time)
    // For demo, check if it's afternoon
    const hour = new Date().getHours()
    const estimatedHours = Math.max(0, hour - 9) // Assuming 9am start

    if (estimatedHours >= maxHours - 1) {
      return {
        shouldNotify: true,
        message: `已经游玩${estimatedHours}小时啦！${childAge <= 3 ? '宝宝' : '孩子'}该休息了～前方查找休息点和亲子餐厅吧 🧃`,
        type: 'rest',
        priority: 'high',
      }
    }

    if (estimatedHours >= maxHours - 2) {
      return {
        shouldNotify: true,
        message: `游玩了${estimatedHours}小时，建议30分钟后安排休息时间 ☕`,
        type: 'rest',
        priority: 'medium',
      }
    }

    return null
  }

  private checkWeatherChange(destination: string): ProactiveCheck | null {
    const weatherStore = useWeatherStore.getState()
    const forecast = weatherStore.forecast

    if (!forecast || forecast.length === 0) return null

    const today = forecast[0]
    if (today.condition.includes('雨') || today.condition.includes('雪')) {
      return {
        shouldNotify: true,
        message: `${destination}今天可能下雨🌧️，要不要切换到室内备选方案？`,
        type: 'weather',
        priority: 'high',
      }
    }

    return null
  }

  private checkWalkingDistance(childAge: number): ProactiveCheck | null {
    const tripStore = useTripStore.getState()
    const trip = tripStore.currentTrip
    if (!trip) return null

    const ageGroup = childAge <= 3 ? 'infant' : childAge <= 6 ? 'preschool' : 'school'
    const rules = AGE_RULES[ageGroup]
    const maxWalk = rules.maxWalkDistance || 3000

    let totalWalk = 0
    trip.days.forEach((day) => {
      ;[...day.segments.morning, ...day.segments.afternoon, ...day.segments.evening].forEach((n) => {
        if (n.walkingFromPrev) totalWalk += n.walkingFromPrev.distance
      })
    })

    if (totalWalk > maxWalk * 0.8) {
      return {
        shouldNotify: true,
        message: `当前步行距离${Math.round(totalWalk)}m，接近${ageGroup === 'infant' ? '婴幼儿' : '儿童'}建议上限${maxWalk}m。考虑切换为"悠闲"模式？🚶`,
        type: 'facility',
        priority: 'medium',
      }
    }

    return null
  }

  private checkCrowdPeak(): ProactiveCheck | null {
    const hour = new Date().getHours()
    const min = new Date().getMinutes()

    // Lunch peak: 11:00-12:30
    if ((hour === 11 && min >= 0) || (hour === 12 && min <= 30)) {
      return {
        shouldNotify: true,
        message: '快到午餐高峰时间了！要不要提前找好亲子餐厅，避开排队？🍽️',
        type: 'crowd',
        priority: 'low',
      }
    }

    return null
  }

  private checkTripSchedule(trip: ReturnType<typeof useTripStore.getState>['currentTrip']): ProactiveCheck | null {
    if (!trip) return null

    const now = new Date()
    const currentHour = now.getHours()
    const currentMin = now.getMinutes()
    const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`

    // Collect all nodes across all days
    const allNodes = trip.days.flatMap((d) =>
      [...d.segments.morning, ...d.segments.afternoon, ...d.segments.evening]
    )

    if (allNodes.length === 0) return null

    const firstNode = allNodes[0]
    const lastNode = allNodes[allNodes.length - 1]

    // 30min before first stop → departure reminder
    const firstTime = firstNode.startTime
    if (this.isTimeNear(currentTimeStr, firstTime, -30)) {
      return {
        shouldNotify: true,
        message: `准备好出发了吗？第一站「${firstNode.name}」在等你～记得带好水壶和小零食哦 🎒`,
        type: 'time',
        priority: 'high',
      }
    }

    // At start time → go!
    if (this.isTimeNear(currentTimeStr, firstTime, 0)) {
      return {
        shouldNotify: true,
        message: `出发时间到！第一站「${firstNode.name}」${firstNode.indoor ? '室内游玩不怕天气' : '户外记得防晒'} 🌟`,
        type: 'time',
        priority: 'high',
      }
    }

    // Lunch time detection (11:30-12:30)
    if (currentHour === 11 && currentMin >= 30 || currentHour === 12 && currentMin <= 30) {
      const lunchNode = allNodes.find((n) => n.type === 'restaurant')
      if (lunchNode) {
        return {
          shouldNotify: true,
          message: `午餐时间到！附近推荐「${lunchNode.name}」，带宝贝补充能量吧 🍽️`,
          type: 'time',
          priority: 'high',
        }
      }
    }

    // Afternoon rest check (2:30-3:30pm)
    if (currentHour >= 14 && currentHour <= 15 && currentMin >= 30) {
      return {
        shouldNotify: true,
        message: `下午茶时间～找个地方坐坐，孩子也需要休息一会儿 🧃`,
        type: 'rest',
        priority: 'medium',
      }
    }

    // Near end of last stop → wrap up
    const lastEndTime = lastNode.endTime || '17:00'
    if (this.isTimeNear(currentTimeStr, lastEndTime, -30)) {
      return {
        shouldNotify: true,
        message: `最后一站「${lastNode.name}」快结束啦～今天玩得开心吗？记得记录今天的回忆哦 📸`,
        type: 'time',
        priority: 'medium',
      }
    }

    // Post-trip: 30min after last stop
    if (this.isTimeNear(currentTimeStr, lastEndTime, 30)) {
      return {
        shouldNotify: true,
        message: `今天的行程结束啦！要不要保存到成长足迹，记录宝贝的每一次出行？🌟`,
        type: 'time',
        priority: 'low',
      }
    }

    return null
  }

  private isTimeNear(current: string, target: string, offsetMinutes: number): boolean {
    const [cH, cM] = current.split(':').map(Number)
    const [tH, tM] = target.split(':').map(Number)
    if (isNaN(cH) || isNaN(tH)) return false

    const currentTotal = cH * 60 + cM
    const targetTotal = tH * 60 + tM + offsetMinutes

    return Math.abs(currentTotal - targetTotal) <= 5
  }
}

export const proactiveAdvisor = new ProactiveAdvisor()
