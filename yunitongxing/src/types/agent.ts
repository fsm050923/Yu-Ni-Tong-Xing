export type AgentPhase = 'idle' | 'perceiving' | 'thinking' | 'executing' | 'responding';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required: string[];
  };
}

export interface ToolCall {
  id: string;
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface ToolResult {
  toolCallId: string;
  content: string; // JSON string
}

export interface AgentAction {
  phase: AgentPhase;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  reasoning?: string;
  finalResponse?: string;
}

export interface AgentStateData {
  phase: AgentPhase;
  isProcessing: boolean;
  lastAction: AgentAction | null;
  proactiveSuggestions: string[];
  toolCallHistory: Array<{ toolName: string; args: Record<string, unknown>; result: unknown; timestamp: number }>;
}
