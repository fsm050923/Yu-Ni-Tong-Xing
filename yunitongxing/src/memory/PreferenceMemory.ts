import { useMemoryStore } from '../stores/useMemoryStore'

const PREFERENCE_TEMPLATES = {
  child: {
    interests: [] as string[],
    dislikes: [] as string[],
    energyLevel: 'medium' as 'low' | 'medium' | 'high',
    favoritePoiTypes: [] as string[],
    sleepSchedule: '',
  },
  parent: {
    avoidCrowds: false,
    preferIndoor: false,
    budget: 'medium' as 'low' | 'medium' | 'high',
    dietaryRestrictions: [] as string[],
    maxTravelTime: 60,
  },
}

export class PreferenceMemory {
  private get store() { return useMemoryStore.getState() }

  learnFromInteraction(input: string, satisfaction: 'positive' | 'negative' | 'neutral' = 'neutral'): void {
    const preferences = this.store.preferences

    // Extract keywords
    const keywords = this.extractKeywords(input)
    for (const kw of keywords) {
      const existing = preferences.find((p) => p.value.includes(kw))
      if (existing) {
        if (satisfaction === 'negative') {
          existing.value = existing.value.replace(`喜欢${kw}`, `避免${kw}`)
        }
      } else if (satisfaction !== 'negative') {
        this.store.addPreference(satisfaction === 'positive' ? `喜欢${kw}` : `提到${kw}`)
      }
    }
  }

  getChildProfile(): string {
    const prefs = this.store.preferences.map((p) => p.value)
    const likes = prefs.filter((p) => p.startsWith('喜欢'))
    const avoids = prefs.filter((p) => p.startsWith('避免'))

    const lines: string[] = []
    if (likes.length) lines.push(`孩子喜欢: ${likes.map((l) => l.replace('喜欢', '')).join('、')}`)
    if (avoids.length) lines.push(`需要避免: ${avoids.map((a) => a.replace('避免', '')).join('、')}`)
    return lines.join('; ')
  }

  getPromptContext(): string {
    const profile = this.getChildProfile()
    const prefs = this.store.preferences
    if (prefs.length === 0) return ''

    return `## 用户偏好（从历史中学习）
${profile || '暂无特殊偏好记录'}
- 共${prefs.length}条偏好记录
`
  }

  private extractKeywords(text: string): string[] {
    const words: string[] = []
    const patterns = [
      /喜欢(.{1,8})/g,
      /讨厌(.{1,8})/g,
      /不去(.{1,8})/g,
      /怕(.{1,6})/g,
      /过敏(.{1,6})/g,
      /恐龙/g,
      /海洋/g,
      /动物/g,
      /科技/g,
      /户外/g,
      /室内/g,
      /游乐园/g,
      /博物馆/g,
      /动物园/g,
      /水族馆/g,
    ]
    for (const p of patterns) {
      let m: RegExpExecArray | null
      while ((m = p.exec(text)) !== null) {
        words.push(m[1] || m[0])
      }
    }
    return [...new Set(words)]
  }
}

export const preferenceMemory = new PreferenceMemory()
