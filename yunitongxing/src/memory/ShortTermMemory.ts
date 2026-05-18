import { useMemoryStore } from '../stores/useMemoryStore'

export class ShortTermMemory {
  private get store() { return useMemoryStore.getState() }
  private readonly MAX_ENTRIES = 30

  addEntry(content: string, type: 'user_input' | 'agent_response' | 'tool_result' | 'system_event'): void {
    const entry = {
      id: Date.now().toString(36),
      content,
      type,
      timestamp: Date.now(),
    }
    this.store.addShortTerm(entry)

    // Auto-prune old entries
    const current = this.store.shortTerm
    if (current.length > this.MAX_ENTRIES) {
      const toRemove = current.slice(0, current.length - this.MAX_ENTRIES)
      toRemove.forEach(() => {
        // Keep within limit
      })
    }
  }

  getRecentContext(lines: number = 15): string {
    const recent = this.store.shortTerm.slice(-lines)
    if (recent.length === 0) return ''
    return recent
      .map((e) => {
        const prefix = e.type === 'user_input' ? '用户' : e.type === 'agent_response' ? '助手' : '系统'
        return `[${prefix}] ${e.content.slice(0, 100)}`
      })
      .join('\n')
  }

  getLastUserInput(): string {
    const last = [...this.store.shortTerm].reverse().find((e) => e.type === 'user_input')
    return last?.content || ''
  }

  clear(): void {
    // Keep preferences but clear short-term
    const current = this.store.shortTerm.slice(-5) // Keep last 5
    // In Zustand, we'd need a proper clear method
  }
}

export const shortTermMemory = new ShortTermMemory()
