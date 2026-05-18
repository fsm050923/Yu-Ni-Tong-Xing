import { create } from 'zustand'

export type AgentPhase = 'idle' | 'perceiving' | 'thinking' | 'executing' | 'responding'
export type ToolCallStatus = { name: string; status: 'pending' | 'running' | 'done'; result?: string }

interface AgentState {
  phase: AgentPhase
  activeToolCalls: ToolCallStatus[]
  proactiveSuggestion: string | null
  isAutonomousMode: boolean

  setPhase: (phase: AgentPhase) => void
  addToolCall: (name: string) => string
  updateToolCall: (index: number, status: ToolCallStatus['status'], result?: string) => void
  clearToolCalls: () => void
  setProactiveSuggestion: (text: string | null) => void
  toggleAutonomousMode: () => void
}

export const useAgentStore = create<AgentState>((set, get) => ({
  phase: 'idle',
  activeToolCalls: [],
  proactiveSuggestion: null,
  isAutonomousMode: false,

  setPhase: (phase) => set({ phase }),
  addToolCall: (name) => {
    const idx = get().activeToolCalls.length
    set((s) => ({ activeToolCalls: [...s.activeToolCalls, { name, status: 'pending' }] }))
    return `${idx}`
  },
  updateToolCall: (index, status, result) =>
    set((s) => ({
      activeToolCalls: s.activeToolCalls.map((tc, i) =>
        i === index ? { ...tc, status, result } : tc
      ),
    })),
  clearToolCalls: () => set({ activeToolCalls: [] }),
  setProactiveSuggestion: (text) => set({ proactiveSuggestion: text }),
  toggleAutonomousMode: () => set((s) => ({ isAutonomousMode: !s.isAutonomousMode })),
}))
