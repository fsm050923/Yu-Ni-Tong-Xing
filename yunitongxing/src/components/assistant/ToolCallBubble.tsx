import type { ChatMessage } from '../../stores/useChatStore'

interface ToolCallBubbleProps {
  message: ChatMessage
  toolCalls: Array<{ name: string; args: Record<string, unknown>; result?: string }>
}

const toolEmoji: Record<string, string> = {
  searchPoi: '🔍',
  getWeather: '🌤️',
  generateTripPlan: '📋',
  adjustTrip: '🔧',
  findNearbyFacility: '📍',
  checkTicketInfo: '🎫',
  generateAlternativePlan: '🔄',
  suggestRestSpot: '☕',
  saveToMemory: '💾',
  queryMemory: '🧠',
}

export default function ToolCallBubble({ message, toolCalls }: ToolCallBubbleProps) {
  return (
    <div className="flex justify-start px-2 space-y-1.5">
      <div className="max-w-[85%] space-y-1.5">
        {/* Tool call indicators */}
        <div className="bg-warm-bg rounded-2xl p-2 space-y-1 border border-warm-yellow/20">
          {toolCalls.map((tc, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-text-secondary">
              <span>{toolEmoji[tc.name] || '⚙️'}</span>
              <span className="font-medium">{tc.name}</span>
              {tc.result && (
                <span className="text-[10px] text-text-muted truncate max-w-[120px]">
                  → {tc.result}
                </span>
              )}
            </div>
          ))}
        </div>
        {/* AI text response */}
        {message.content && (
          <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
            <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">{message.content}</p>
          </div>
        )}
      </div>
    </div>
  )
}
