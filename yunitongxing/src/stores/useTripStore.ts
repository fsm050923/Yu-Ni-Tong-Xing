import { create } from 'zustand'
import type { Trip, TripNode, TripDay } from '../types/trip'
import { v4Id } from '../utils/id'

interface TripState {
  currentTrip: Trip | null
  tripHistory: Trip[]
  isGenerating: boolean
  error: string | null

  setTrip: (trip: Trip) => void
  setGenerating: (v: boolean) => void
  updateNode: (nodeId: string, updates: Partial<TripNode>) => void
  removeNode: (nodeId: string) => void
  adjustNodeDuration: (nodeId: string, newDuration: number) => void
  setMode: (mode: 'standard' | 'relaxed' | 'compact') => void
  switchWeatherPlan: (plan: 'sunny' | 'rainy') => void
  saveTripToHistory: () => void
  loadTripFromHistory: (tripId: string) => void
  deleteTrip: (tripId: string) => void
  clearCurrentTrip: () => void
}

export const useTripStore = create<TripState>((set, get) => ({
  currentTrip: null,
  tripHistory: [],
  isGenerating: false,
  error: null,

  setTrip: (trip) => set({ currentTrip: trip, error: null }),
  setGenerating: (v) => set({ isGenerating: v }),

  updateNode: (nodeId, updates) => {
    const trip = get().currentTrip
    if (!trip) return
    const days = trip.days.map((day) => ({
      ...day,
      segments: {
        morning: day.segments.morning.map((n) => n.id === nodeId ? { ...n, ...updates } : n),
        afternoon: day.segments.afternoon.map((n) => n.id === nodeId ? { ...n, ...updates } : n),
        evening: day.segments.evening.map((n) => n.id === nodeId ? { ...n, ...updates } : n),
      },
    }))
    set({ currentTrip: { ...trip, days } })
  },

  removeNode: (nodeId) => {
    const trip = get().currentTrip
    if (!trip) return
    const filterNode = (nodes: TripNode[]) => nodes.filter((n) => n.id !== nodeId)
    const days = trip.days.map((day) => ({
      ...day,
      segments: {
        morning: filterNode(day.segments.morning),
        afternoon: filterNode(day.segments.afternoon),
        evening: filterNode(day.segments.evening),
      },
    }))
    set({ currentTrip: { ...trip, days } })
  },

  adjustNodeDuration: (nodeId, newDuration) => {
    const trip = get().currentTrip
    if (!trip) return
    const updateDuration = (nodes: TripNode[]) =>
      nodes.map((n) => n.id === nodeId ? { ...n, duration: newDuration } : n)
    const days = trip.days.map((day) => ({
      ...day,
      segments: {
        morning: updateDuration(day.segments.morning),
        afternoon: updateDuration(day.segments.afternoon),
        evening: updateDuration(day.segments.evening),
      },
    }))
    set({ currentTrip: { ...trip, days } })
  },

  setMode: (mode) => {
    const trip = get().currentTrip
    if (trip) set({ currentTrip: { ...trip, mode } })
  },

  switchWeatherPlan: (plan) => {
    const trip = get().currentTrip
    if (trip) set({ currentTrip: { ...trip, weatherPlan: plan } })
  },

  saveTripToHistory: () => {
    const trip = get().currentTrip
    if (!trip) return
    set((s) => ({
      tripHistory: [...s.tripHistory.filter((t) => t.id !== trip.id), { ...trip }],
    }))
    // persist to localStorage
    try {
      const trips = [...get().tripHistory]
      localStorage.setItem('ytx_trip_history', JSON.stringify(trips.slice(-20)))
    } catch {}
  },

  loadTripFromHistory: (tripId) => {
    const trip = get().tripHistory.find((t) => t.id === tripId)
    if (trip) set({ currentTrip: trip })
  },

  deleteTrip: (tripId) => {
    set((s) => ({
      tripHistory: s.tripHistory.filter((t) => t.id !== tripId),
      currentTrip: s.currentTrip?.id === tripId ? null : s.currentTrip,
    }))
  },

  clearCurrentTrip: () => set({ currentTrip: null, error: null }),
}))
