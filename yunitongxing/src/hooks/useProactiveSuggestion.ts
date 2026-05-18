import { useEffect, useRef } from 'react'
import { proactiveAdvisor } from '../engine/agent/ProactiveAdvisor'
import { useAgentStore } from '../stores/useAgentStore'

export function useProactiveSuggestion(intervalMs = 30000) {
  const suggestion = useAgentStore((s) => s.proactiveSuggestion)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    // Check immediately on mount
    proactiveAdvisor.check()

    // Then check periodically
    intervalRef.current = setInterval(() => {
      proactiveAdvisor.check()
    }, intervalMs)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [intervalMs])

  const dismiss = () => {
    useAgentStore.getState().setProactiveSuggestion(null)
  }

  return { suggestion, dismiss }
}
