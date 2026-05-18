import { useState, useEffect, useCallback } from 'react'

interface GeoState {
  lat: number | null
  lng: number | null
  accuracy: number | null
  error: string | null
  loading: boolean
}

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({
    lat: null,
    lng: null,
    accuracy: null,
    error: null,
    loading: true,
  })

  const requestPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: '设备不支持定位', loading: false }))
      return
    }

    setState((s) => ({ ...s, loading: true }))

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          error: null,
          loading: false,
        })
      },
      (err) => {
        setState((s) => ({
          ...s,
          error: err.message,
          loading: false,
        }))
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    )
  }, [])

  useEffect(() => {
    requestPosition()
  }, [requestPosition])

  return { ...state, refresh: requestPosition }
}
