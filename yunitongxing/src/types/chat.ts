export type MessageType = 'text' | 'itinerary_card' | 'map_update' | 'voice' | 'tool_call' | 'proactive';
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  type: MessageType;
  timestamp: number;
  audioUrl?: string;
  toolCalls?: ToolCallRecord[];
  tripId?: string;
}

export interface ToolCallRecord {
  id: string;
  toolName: string;
  args: Record<string, unknown>;
  result?: unknown;
  status: 'pending' | 'running' | 'done' | 'error';
}

export interface ConversationContext {
  currentTripId: string | null;
  lastIntent: string | null;
  activeToolCalls: ToolCallRecord[];
}
