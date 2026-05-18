export type MemoryType = 'short_term' | 'long_term' | 'preference';

export interface ShortTermMemoryEntry {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: number;
  type: 'text' | 'tool_call' | 'tool_result';
}

export interface LongTermMemoryEntry {
  id: string;
  tripId: string;
  title: string;
  destination: string;
  childAge: number;
  createdAt: number;
  rating: 1 | 2 | 3 | 4 | 5;
  highlights: string[];
  avoidList: string[];
}

export interface PreferenceMemoryEntry {
  key: string;
  value: string;
  category: 'child' | 'parent' | 'travel' | 'food' | 'activity';
  confidence: number; // 0-1
  updatedAt: number;
}
