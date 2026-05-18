import type { ChatMessage } from '../../stores/useChatStore'

interface ChatBubbleProps {
  message: ChatMessage
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user'

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
