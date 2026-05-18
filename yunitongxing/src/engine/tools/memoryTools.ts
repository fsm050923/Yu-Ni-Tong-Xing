import { useMemoryStore } from '../../stores/useMemoryStore'
import { v4Id } from '../../utils/id'

export interface SaveToMemoryArgs {
  memoryType: 'preference' | 'trip_review' | 'child_info'
  content: string
}

export interface QueryMemoryArgs {
  query: string
  memoryType?: 'preference' | 'trip' | 'child'
}

export async function saveToMemory(args: SaveToMemoryArgs) {
  const memoryStore = useMemoryStore.getState()

  switch (args.memoryType) {
    case 'preference': {
      memoryStore.setPreference({
        key: `pref_${Date.now()}`,
        value: args.content,
        updatedAt: Date.now(),
      })
      break
    }
    case 'trip_review': {
      memoryStore.addLongTerm({
        id: v4Id(),
        type: 'trip',
        content: args.content,
        tags: ['review'],
        createdAt: Date.now(),
      })
      break
    }
    case 'child_info': {
      memoryStore.setPreference({
        key: 'child_info',
        value: args.content,
        updatedAt: Date.now(),
      })
      break
    }
  }

  memoryStore.saveToStorage()

  return {
    success: true,
    memoryType: args.memoryType,
    message: `已保存到${args.memoryType === 'preference' ? '偏好' : args.memoryType === 'trip_review' ? '行程回顾' : '孩子信息'}记忆`,
  }
}

export async function queryMemory(args: QueryMemoryArgs) {
  const memoryStore = useMemoryStore.getState()
  memoryStore.loadFromStorage()

  const results: string[] = []

  if (!args.memoryType || args.memoryType === 'preference') {
    memoryStore.preferences.forEach((p) => {
      if (!args.query || p.key.includes(args.query) || p.value.includes(args.query)) {
        results.push(`[偏好] ${p.value}`)
      }
    })
  }

  if (!args.memoryType || args.memoryType === 'trip') {
    memoryStore.longTerm.forEach((entry) => {
      if (!args.query || entry.content.includes(args.query) || entry.tags?.some((t) => t.includes(args.query))) {
        results.push(`[历史行程] ${entry.content}`)
      }
    })
  }

  return {
    query: args.query,
    memoryType: args.memoryType || 'all',
    results,
    count: results.length,
  }
}
