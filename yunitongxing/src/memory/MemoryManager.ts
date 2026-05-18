import { shortTermMemory } from './ShortTermMemory'
import { longTermMemory } from './LongTermMemory'
import { preferenceMemory } from './PreferenceMemory'
import { useMemoryStore } from '../stores/useMemoryStore'

export class MemoryManager {
  private shortTerm = shortTermMemory
  private longTerm = longTermMemory
  private preference = preferenceMemory

  /** Save a piece of information to the appropriate memory layer */
  save(
    content: string,
    opts: { type?: 'preference' | 'trip_review' | 'general'; tags?: string[] } = {}
  ): void {
    const store = useMemoryStore.getState()

    switch (opts.type) {
      case 'preference': {
        const tags = opts.tags?.join(', ') || '手动记录'
        store.addPreference(`[${tags}] ${content}`)
        break
      }
      case 'trip_review':
        store.addLongTerm({ id: Date.now().toString(36), content, timestamp: Date.now() })
        break
      default:
        this.shortTerm.addEntry(content, 'system_event')
        store.addShortTerm({
          id: Date.now().toString(36),
          content,
          type: 'system_event',
          timestamp: Date.now(),
        })
    }
  }

  /** Retrieve memories relevant to the current context */
  recall(query: string): string {
    const store = useMemoryStore.getState()
    const results: string[] = []

    // Search short-term
    store.shortTerm.forEach((m) => {
      if (m.content.includes(query) || query.split(/\s+/).some((w) => m.content.includes(w))) {
        results.push(`[短期] ${m.content}`)
      }
    })

    // Search preferences
    store.preferences.forEach((p) => {
      if (p.value.includes(query) || query.split(/\s+/).some((w) => p.value.includes(w))) {
        results.push(`[偏好] ${p.value}`)
      }
    })

    // Search long-term
    store.longTerm.forEach((m) => {
      if (m.content.includes(query)) {
        results.push(`[长期] ${m.content}`)
      }
    })

    return results.length > 0
      ? results.slice(0, 8).join('\n')
      : '暂无相关记忆'
  }

  /** Build a memory context string for the LLM system prompt */
  getLLMContext(): string {
    const parts: string[] = []

    const prefCtx = this.preference.getPromptContext()
    if (prefCtx) parts.push(prefCtx)

    const longCtx = this.longTerm.getPromptContext()
    if (longCtx) parts.push(longCtx)

    return parts.join('\n')
  }

  /** Learn preferences from agent interactions */
  learnFromResponse(userInput: string, agentResponse: string): void {
    // Detect positive/negative sentiment in user input
    const positive = /不错|喜欢|好的|很棒|满意|可以|行|好/g.test(userInput)
    const negative = /不好|不行|换|取消|不要/g.test(userInput)
    const satisfaction = positive ? 'positive' as const : negative ? 'negative' as const : 'neutral' as const

    this.preference.learnFromInteraction(userInput, satisfaction)

    // Save conversation to short-term
    this.shortTerm.addEntry(userInput, 'user_input')
    this.shortTerm.addEntry(agentResponse, 'agent_response')
  }

  /** Record a completed trip for long-term memory */
  async recordTripCompletion(tripTitle: string, satisfaction: string): Promise<void> {
    this.save(`行程「${tripTitle}」- ${satisfaction}`, { type: 'trip_review' })
  }
}

export const memoryManager = new MemoryManager()
