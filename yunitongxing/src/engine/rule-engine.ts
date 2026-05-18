import { AGE_RULES } from '../constants/age-rules'
import type { Trip, TripNode, AgeGroup } from '../types/trip'

interface RuleViolation {
  nodeName: string
  rule: string
  severity: 'error' | 'warning'
  suggestion: string
}

export class RuleEngine {
  validateTrip(trip: Trip): RuleViolation[] {
    const violations: RuleViolation[] = []
    const ageGroup = trip.ageGroup || 'preschool'
    const rules = AGE_RULES[ageGroup]

    if (!rules) return violations

    let totalWalk = 0
    let totalTime = 0

    for (const day of trip.days) {
      const allNodes = [
        ...day.segments.morning,
        ...day.segments.afternoon,
        ...day.segments.evening,
      ]

      for (const node of allNodes) {
        // Check walk distance per segment
        if (node.walkingFromPrev) {
          totalWalk += node.walkingFromPrev.distance
          if (node.walkingFromPrev.distance > rules.maxWalkDistance * 0.6) {
            violations.push({
              nodeName: node.name,
              rule: `单段步行${node.walkingFromPrev.distance}m超过${ageGroup}段上限60%`,
              severity: 'warning',
              suggestion: `考虑插入休息点或选择更近的路线`,
            })
          }
        }

        // Check duration
        totalTime += node.duration
        if (node.duration > rules.maxHours * 60 * 0.7) {
          violations.push({
            nodeName: node.name,
            rule: `单节点${node.duration}分钟过长`,
            severity: 'warning',
            suggestion: `建议拆分为两个节点，中间安排休息`,
          })
        }

        // Check age suitability
        this.checkAgeSuitability(node, ageGroup, violations)
      }
    }

    // Total walk check
    if (totalWalk > rules.maxWalkDistance) {
      violations.push({
        nodeName: '全天行程',
        rule: `总步行${totalWalk}m超过${ageGroup}上限${rules.maxWalkDistance}m`,
        severity: 'error',
        suggestion: `切换到"悠闲"模式或减少步行节点`,
      })
    }

    // Total time check
    if (totalTime > rules.maxHours * 60) {
      violations.push({
        nodeName: '全天行程',
        rule: `总游玩${Math.round(totalTime / 60)}h超过${ageGroup}上限${rules.maxHours}h`,
        severity: 'error',
        suggestion: `删除部分节点或缩短时间`,
      })
    }

    return violations
  }

  private checkAgeSuitability(node: TripNode, ageGroup: AgeGroup, violations: RuleViolation[]): void {
    const rules = AGE_RULES[ageGroup]
    const suitableTypes = rules.suitablePoiTypes || []

    if (suitableTypes.length > 0 && !suitableTypes.includes(node.poiType)) {
      violations.push({
        nodeName: node.name,
        rule: `${node.poiType}类型不适合${ageGroup}`,
        severity: 'warning',
        suggestion: `考虑替换为${suitableTypes.slice(0, 3).join('、')}等类型`,
      })
    }
  }

  getAgeGroup(childAge: number): AgeGroup {
    if (childAge <= 3) return 'infant'
    if (childAge <= 6) return 'preschool'
    return 'school'
  }

  estimateBreakInterval(childAge: number): number {
    const group = this.getAgeGroup(childAge)
    return AGE_RULES[group].breakInterval || 60
  }

  suggestRestNodes(lat: number, lng: number, childAge: number): Array<{ name: string; poiType: string; reason: string }> {
    const group = this.getAgeGroup(childAge)
    const suggestions: Array<{ name: string; poiType: string; reason: string }> = []

    if (group === 'infant') {
      suggestions.push(
        { name: '母婴室', poiType: 'nursery', reason: '0-3岁婴幼儿需要' },
        { name: '亲子咖啡馆', poiType: 'restaurant', reason: '休息+喂食' },
      )
    }
    suggestions.push(
      { name: '休息区', poiType: 'rest-area', reason: `${group}组每${AGE_RULES[group].breakInterval}分钟需休息` },
      { name: '儿童饮水处', poiType: 'water-fountain', reason: '保持水分' },
    )

    return suggestions
  }
}

export const ruleEngine = new RuleEngine()
