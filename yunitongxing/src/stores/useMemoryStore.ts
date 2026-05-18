import { create } from 'zustand'
import type { ShortTermMemoryEntry, LongTermMemoryEntry, PreferenceMemoryEntry } from '../types/memory'

export interface ChildProfile {
  childName: string
  childAge: number
  gender: 'boy' | 'girl' | ''
  interests: string[]
  energyLevel: 'low' | 'medium' | 'high'
  avoidCrowds: boolean
  notes: string
}

const DEFAULT_PROFILE: ChildProfile = {
  childName: '',
  childAge: 5,
  gender: '',
  interests: [],
  energyLevel: 'medium',
  avoidCrowds: false,
  notes: '',
}

interface MemoryState {
  shortTerm: ShortTermMemoryEntry[]
  longTerm: LongTermMemoryEntry[]
  preferences: PreferenceMemoryEntry[]
  profile: ChildProfile

  addShortTerm: (entry: ShortTermMemoryEntry) => void
  clearShortTerm: () => void
  addLongTerm: (entry: LongTermMemoryEntry) => void
  removeLongTerm: (id: string) => void
  setPreference: (entry: PreferenceMemoryEntry) => void
  getPreference: (key: string) => PreferenceMemoryEntry | undefined
  addPreference: (value: string) => void
  setProfile: (profile: Partial<ChildProfile>) => void
  loadFromStorage: () => void
  saveToStorage: () => void
}

export const useMemoryStore = create<MemoryState>((set, get) => ({
  shortTerm: [],
  longTerm: [],
  preferences: [],
  profile: { ...DEFAULT_PROFILE },

  addShortTerm: (entry) =>
    set((s) => ({ shortTerm: [...s.shortTerm.slice(-30), entry] })),

  clearShortTerm: () => set({ shortTerm: [] }),

  addLongTerm: (entry) =>
    set((s) => {
      const next = [...s.longTerm.filter((t) => t.id !== entry.id), entry].slice(-50)
      return { longTerm: next }
    }),

  removeLongTerm: (id) =>
    set((s) => ({ longTerm: s.longTerm.filter((t) => t.id !== id) })),

  setPreference: (entry) =>
    set((s) => {
      const rest = s.preferences.filter((p) => p.key !== entry.key)
      return { preferences: [...rest, entry] }
    }),

  getPreference: (key) => get().preferences.find((p) => p.key === key),

  addPreference: (value) =>
    set((s) => ({
      preferences: [...s.preferences, { key: value, value, timestamp: Date.now() }],
    })),

  setProfile: (partial) =>
    set((s) => ({
      profile: { ...s.profile, ...partial },
    })),

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem('ytx_memory')
      if (raw) {
        const data = JSON.parse(raw)
        set({
          longTerm: data.longTerm || [],
          preferences: data.preferences || [],
          profile: data.profile ? { ...DEFAULT_PROFILE, ...data.profile } : { ...DEFAULT_PROFILE },
        })
      }
    } catch {}
  },

  saveToStorage: () => {
    try {
      const { longTerm, preferences, profile } = get()
      localStorage.setItem('ytx_memory', JSON.stringify({ longTerm, preferences, profile }))
    } catch {}
  },
}))
