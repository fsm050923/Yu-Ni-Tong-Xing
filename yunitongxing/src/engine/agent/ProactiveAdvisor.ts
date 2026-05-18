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
    if (now - this.lastCheckTime < this.checkInterval) return null
    this.lastCheckTime = now

    const tripStore = useTripStore.getState()
    const agentStore = useAgentStore.getState()
    const trip = tripStore.currentTrip

    if (!trip) return null

    const checks: ProactiveCheck[] = []

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

    // Lunch peak: 11:30-12:30
    if (hour === 11) {
      return {
        shouldNotify: true,
        message: '快到午餐高峰时间了！要不要提前找好亲子餐厅，避开排队？🍽️',
        type: 'crowd',
        priority: 'low',
      }
    }

    return null
  }
}

export const proactiveAdvisor = new ProactiveAdvisor()
