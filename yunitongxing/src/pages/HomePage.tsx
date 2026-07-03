import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChatStore } from '../stores/useChatStore'
import { useAgentStore } from '../stores/useAgentStore'
import { useTripStore } from '../stores/useTripStore'
import { useMapStore } from '../stores/useMapStore'
import { useMemoryStore } from '../stores/useMemoryStore'
import { useWeatherStore } from '../stores/useWeatherStore'
import { useProactiveSuggestion } from '../hooks/useProactiveSuggestion'
import { getWeather, isAmapConfigured } from '../services/amap'
import { longTermMemory } from '../memory/LongTermMemory'
import { agentLoop } from '../engine/agent/AgentLoop'
import ChatBubble from '../components/assistant/ChatBubble'
import ToolCallBubble from '../components/assistant/ToolCallBubble'
import VoiceInputButton from '../components/assistant/VoiceInputButton'
import QuickActions from '../components/assistant/QuickActions'
import AgentStatusBar from '../components/agent/AgentStatusBar'

export default function HomePage() {
  const [input, setInput] = useState('')
  const messages = useChatStore((s) => s.messages)
  const isProcessing = useChatStore((s) => s.isProcessing)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const addMessage = useChatStore((s) => s.addMessage)
  const setProcessing = useChatStore((s) => s.setProcessing)
  const activeToolCalls = useAgentStore((s) => s.activeToolCalls)
  const profile = useMemoryStore((s) => s.profile)
  const bottomRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useProactiveSuggestion(60000)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeToolCalls])

  const doSend = useCallback(async (text: string) => {
    if (!text.trim() || isProcessing) return
    setInput('')
    sendMessage(text)

    const prevTripId = useTripStore.getState().currentTrip?.id

    try {
      const response = await agentLoop.run(text)

      const trip = useTripStore.getState().currentTrip
      const isNewTrip = !!(trip && trip.id !== prevTripId)

      if (trip && isNewTrip) {
        useTripStore.getState().saveTripToHistory()
        longTermMemory.saveTrip(trip).catch(() => {})
        const allNodes = trip.days.flatMap((d) => [
          ...d.segments.morning, ...d.segments.afternoon, ...d.segments.evening,
        ])
        if (allNodes.length > 0) {
          useMapStore.getState().fitBounds(allNodes.map((n) => ({ lat: n.lat, lng: n.lng })))
        }

        // Fetch weather for destination
        if (isAmapConfigured()) {
          getWeather(trip.destination).then((data) => {
            if (data?.casts?.length) {
              const today = data.casts[0]
              useWeatherStore.getState().setForecast(trip.destination, data.casts.map((c) => ({
                date: c.date,
                condition: c.dayweather,
                tempHigh: parseInt(c.daytemp),
                tempLow: parseInt(c.nighttemp),
              })))
            }
          }).catch(() => {})
        }
      }

      const toolCalls = useAgentStore.getState().activeToolCalls
      addMessage({
        role: 'assistant',
        content: response,
        type: isNewTrip ? 'trip_card' : toolCalls.length > 0 ? 'tool_call' : 'text',
        toolCalls: toolCalls.map((tc) => ({ name: tc.name, args: {}, result: tc.result })),
        tripData: isNewTrip ? trip : undefined,
      })
      useAgentStore.getState().clearToolCalls()
    } catch (err) {
      console.error('[HomePage] send error:', err)
      addMessage({ role: 'assistant', content: '抱歉出错了，请重试。', type: 'text' })
      useAgentStore.getState().clearToolCalls()
    } finally {
      setProcessing(false)
    }
  }, [isProcessing, sendMessage, addMessage, setProcessing])

  const handleSend = () => doSend(input)

  const handleQuickAction = (text: string) => {
    setInput(text)
    setTimeout(() => doSend(text), 100)
  }

  const handleVoiceResult = (text: string) => {
    setInput(text)
    setTimeout(() => doSend(text), 300)
  }

  const hasProfile = !!(profile.childName || profile.childAge)
  const canSend = !isProcessing && input.trim()
  const showQuickActions = messages.length > 0 && !isProcessing

  return (
    <div className="flex flex-col h-full">
      <AgentStatusBar />

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 no-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="text-6xl mb-3 animate-float">🧸</div>
            <h2 className="text-lg font-bold text-text-primary mb-1" style={{ fontFamily: 'var(--font-display)' }}>
              与你童行
            </h2>
            <p className="text-xs text-text-muted mb-5">AI 亲子出行 Agent，说句话自动规划行程</p>

            {!hasProfile && (
              <button
                onClick={() => navigate('/profile')}
                className="mb-5 px-4 py-2 bg-soft-pink/10 text-soft-pink rounded-xl text-xs font-medium border border-soft-pink/20 active:scale-95"
              >
                👶 先填写孩子信息，体验更好 →
              </button>
            )}

            {hasProfile && (
              <div className="mb-4">
                <span className="text-[10px] bg-mint-green/10 text-mint-green px-2 py-1 rounded-full">
                  👶 {profile.childName || '宝贝'} · {profile.childAge || '?'}岁
                </span>
              </div>
            )}

            <div className="w-full max-w-xs space-y-2">
              {[
                { text: hasProfile ? `带${profile.childAge}岁${profile.childName || '宝贝'}去${profile.interests[0] === '动物' ? '动物园' : '公园'}玩一天` : '带5岁孩子去大连玩一天', icon: '🏖️' },
                { text: '推荐适合亲子游的室内博物馆', icon: '🏛️' },
                { text: hasProfile && profile.avoidCrowds ? '推荐安静人少的户外景点' : '周末带娃2日游推荐', icon: '🌳' },
              ].map((p) => (
                <button
                  key={p.text}
                  onClick={() => handleQuickAction(p.text)}
                  className="w-full text-left text-xs text-text-secondary bg-white rounded-xl px-3 py-2.5 border border-gray-100 hover:border-warm-yellow/30 active:bg-warm-bg transition-all flex items-center gap-2"
                >
                  <span>{p.icon}</span> {p.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) =>
              msg.type === 'tool_call' && msg.toolCalls ? (
                <ToolCallBubble key={msg.id} message={msg} toolCalls={msg.toolCalls} />
              ) : (
                <ChatBubble key={msg.id} message={msg} />
              )
            )}
          </>
        )}

        {/* Active tool calls indicator */}
        {activeToolCalls.filter((tc) => tc.status !== 'done').length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-warm-yellow/5 rounded-xl border border-warm-yellow/20">
            <span className="animate-pulse-soft text-sm">⚙️</span>
            <span className="text-xs text-text-secondary">
              正在{activeToolCalls.filter((tc) => tc.status !== 'done').map((tc) => tc.name).join(', ')}...
            </span>
          </div>
        )}

        {/* Loading indicator */}
        {isProcessing && (
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-full bg-sky-blue/20 flex items-center justify-center text-sm flex-shrink-0">
              🤖
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-warm-yellow animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-warm-yellow animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-warm-yellow animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick actions — show after first message */}
      {showQuickActions && <QuickActions onSelect={handleQuickAction} />}

      {/* Input area */}
      <div className="px-3 py-2 bg-white border-t border-gray-100 safe-area-bottom">
        <div className="flex items-center gap-2">
          <VoiceInputButton onResult={handleVoiceResult} />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={hasProfile ? `带${profile.childAge}岁${profile.childName || '宝贝'}去哪儿玩？` : '输入出行需求...'}
            className="flex-1 h-10 px-3 text-sm bg-gray-50 rounded-xl border-none outline-none text-text-primary placeholder:text-gray-300"
          />
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="w-10 h-10 flex items-center justify-center bg-warm-yellow text-white rounded-xl disabled:opacity-40 active:scale-95 transition-all"
          >
            <span className="text-lg">➤</span>
          </button>
        </div>
      </div>
    </div>
  )
}
