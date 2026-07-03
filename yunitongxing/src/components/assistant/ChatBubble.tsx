import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ChatMessage } from '../../stores/useChatStore'
import { enrichTripRoutes } from '../../services/amap'
import TripResultCard from './TripResultCard'

interface ChatBubbleProps {
  message: ChatMessage
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user'
  const navigate = useNavigate()
  const [generatingRoute, setGeneratingRoute] = useState(false)

  const handleGenerateRoute = async () => {
    setGeneratingRoute(true)
    await enrichTripRoutes()
    setGeneratingRoute(false)
    navigate('/map')
  }

  // Render trip card when trip data is available
  if (message.type === 'trip_card' && message.tripData) {
    return (
      <div className="px-2 space-y-2">
        {/* AI text response */}
        {message.content && (
          <div className="flex justify-start">
            <div className="max-w-[85%] bg-white rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm border border-gray-100">
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        )}
        {/* Rich trip card */}
        <TripResultCard trip={message.tripData} />
        {/* Navigation buttons */}
        <div className="flex gap-2 px-1">
          <button
            onClick={handleGenerateRoute}
            disabled={generatingRoute}
            className="flex-1 py-2.5 text-sm font-bold rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, #FF6B35, #FF8C42)',
              color: 'white',
              boxShadow: '0 4px 14px rgba(255,107,53,0.3)',
            }}
          >
            <span className="text-base">{generatingRoute ? '⏳' : '🗺️'}</span>
            {generatingRoute ? '生成路线中...' : '生成路线规划'}
          </button>
          <button
            onClick={() => navigate('/planner')}
            className="flex-1 py-2.5 text-sm font-bold rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-1.5"
            style={{
              background: 'linear-gradient(135deg, #FF6B8A, #FF2D78)',
              color: 'white',
              boxShadow: '0 4px 14px rgba(255,45,120,0.3)',
            }}
          >
            <span className="text-base">📋</span> 查看详细行程
          </button>
        </div>
        <span className="block text-[9px] text-text-muted px-1">
          {new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    )
  }

  // Legacy itinerary card
  if (message.type === 'itinerary_card') {
    return (
      <div className="flex justify-start px-2">
        <div className="max-w-[85%] bg-white rounded-2xl rounded-tl-sm p-3 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">📋</span>
            <span className="text-xs font-bold text-text-primary">行程方案</span>
          </div>
          <p className="text-sm text-text-secondary whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} px-2`}>
      <div
        className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
          isUser
            ? 'bg-warm-yellow text-white rounded-tr-sm'
            : 'bg-white text-text-primary rounded-tl-sm shadow-sm border border-gray-100'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <span className={`block text-[9px] mt-0.5 ${isUser ? 'text-white/60' : 'text-text-muted'}`}>
          {new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}
