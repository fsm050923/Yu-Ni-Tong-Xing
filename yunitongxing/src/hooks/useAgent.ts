import { useCallback } from 'react'
import { agentLoop } from '../engine/agent/AgentLoop'
import { useChatStore } from '../stores/useChatStore'
import { useAgentStore } from '../stores/useAgentStore'
import { useTripStore } from '../stores/useTripStore'
import { useMapStore } from '../stores/useMapStore'

export function useAgent() {
  const sendMessage = useChatStore((s) => s.sendMessage)
  const addMessage = useChatStore((s) => s.addMessage)
  const setProcessing = useChatStore((s) => s.setProcessing)
  const isProcessing = useChatStore((s) => s.isProcessing)
  const phase = useAgentStore((s) => s.phase)

  const send = useCallback(async (text: string) => {
    if (!text.trim() || isProcessing) return
    sendMessage(text)

    try {
      const response = await agentLoop.run(text)

      // Auto-fit map if trip data changed
      const trip = useTripStore.getState().currentTrip
      if (trip) {
        const allNodes = trip.days.flatMap((d) => [
          ...d.segments.morning,
          ...d.segments.afternoon,
          ...d.segments.evening,
        ])
        if (allNodes.length > 0) {
          useMapStore.getState().fitBounds(allNodes.map((n) => ({ lat: n.lat, lng: n.lng })))
        }
      }

      // Show tool calls if any
      const toolCalls = useAgentStore.getState().activeToolCalls
      if (toolCalls.length > 0) {
        addMessage({
          role: 'assistant',
          content: response,
          type: 'tool_call',
          toolCalls: toolCalls.map((tc) => ({
            name: tc.name,
            args: {},
            result: tc.result,
          })),
        })
      } else {
        addMessage({ role: 'assistant', content: response, type: 'text' })
      }
    } catch {
      addMessage({ role: 'assistant', content: '抱歉，处理您的请求时出错了。请重试。', type: 'text' })
    } finally {
      setProcessing(false)
    }
  }, [isProcessing, sendMessage, addMessage, setProcessing])

  return {
    send,
    isProcessing,
    phase,
  }
}
