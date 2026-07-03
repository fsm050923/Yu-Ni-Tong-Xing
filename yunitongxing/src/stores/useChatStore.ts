import { create } from 'zustand'
import { v4Id } from '../utils/id'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  type: 'text' | 'itinerary_card' | 'map_update' | 'tool_call' | 'voice' | 'trip_card'
  timestamp: number
  toolCalls?: Array<{ name: string; args: Record<string, unknown>; result?: string }>
  tripData?: import('../types/trip').Trip
}

interface ChatState {
  messages: ChatMessage[]
  isProcessing: boolean
  context: {
    currentTripId: string | null
    lastIntent: string | null
  }

  sendMessage: (text: string) => string
  addMessage: (msg: Partial<ChatMessage> & { role: ChatMessage['role']; content: string }) => string
  updateLastMessage: (updates: Partial<ChatMessage>) => void
  clearChat: () => void
  setContext: (ctx: Partial<ChatState['context']>) => void
  setProcessing: (v: boolean) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isProcessing: false,
  context: { currentTripId: null, lastIntent: null },

  sendMessage: (text) => {
    const id = v4Id()
    set((s) => ({
      messages: [...s.messages, { id, role: 'user', content: text, type: 'text', timestamp: Date.now() }],
      isProcessing: true,
    }))
    return id
  },

  addMessage: (msg) => {
    const id = v4Id()
    set((s) => ({
      messages: [...s.messages, { id, ...msg, timestamp: msg.timestamp ?? Date.now() } as ChatMessage],
    }))
    return id
  },

  updateLastMessage: (updates) => {
    set((s) => {
      const msgs = [...s.messages]
      const last = msgs[msgs.length - 1]
      if (last && last.role === 'assistant') {
        msgs[msgs.length - 1] = { ...last, ...updates }
      }
      return { messages: msgs }
    })
  },

  clearChat: () => set({ messages: [], isProcessing: false }),
  setContext: (ctx) => set((s) => ({ context: { ...s.context, ...ctx } })),
  setProcessing: (v) => set({ isProcessing: v }),
}))
