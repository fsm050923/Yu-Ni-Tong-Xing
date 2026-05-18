import { create } from 'zustand'
import type { WeatherDay } from '../types/weather'

interface WeatherState {
  location: string
  forecast: WeatherDay[]
  activePlan: 'sunny' | 'rainy'
  isLoaded: boolean
  error: string | null

  setForecast: (location: string, forecast: WeatherDay[]) => void
  setActivePlan: (plan: 'sunny' | 'rainy') => void
  clearWeather: () => void
  setError: (err: string | null) => void
}

export const useWeatherStore = create<WeatherState>((set) => ({
  location: '',
  forecast: [],
  activePlan: 'sunny',
  isLoaded: false,
  error: null,

  setForecast: (location, forecast) => set({ location, forecast, isLoaded: true, error: null }),
  setActivePlan: (plan) => set({ activePlan: plan }),
  clearWeather: () => set({ forecast: [], isLoaded: false, error: null }),
  setError: (err) => set({ error: err }),
}))
