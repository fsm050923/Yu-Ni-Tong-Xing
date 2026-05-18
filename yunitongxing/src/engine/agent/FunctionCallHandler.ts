import { toolRegistry } from './ToolRegistry'
import { useAgentStore } from '../../stores/useAgentStore'
import type { LLMToolCall } from '../../services/llm'

export interface ToolExecutionResult {
  toolName: string
  args: Record<string, unknown>
  result: unknown
  error?: string
}

export async function executeToolCalls(toolCalls: LLMToolCall[]): Promise<ToolExecutionResult[]> {
  const agentStore = useAgentStore.getState()
  const results: ToolExecutionResult[] = []

  for (const tc of toolCalls) {
    const toolName = tc.function.name
    let args: Record<string, unknown> = {}

    try {
      args = JSON.parse(tc.function.arguments)
    } catch {
      results.push({ toolName, args: {}, result: null, error: 'Invalid JSON arguments' })
      continue
    }

    const idx = agentStore.addToolCall(toolName)
    agentStore.updateToolCall(Number(idx), 'running')

    try {
      const result = await toolRegistry.execute(toolName, args)
      agentStore.updateToolCall(Number(idx), 'done', JSON.stringify(result).slice(0, 200))
      results.push({ toolName, args, result })
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      agentStore.updateToolCall(Number(idx), 'done', errMsg)
      results.push({ toolName, args, result: null, error: errMsg })
    }
  }

  return results
}

export function formatToolResultsForLLM(results: ToolExecutionResult[]): Array<{ role: 'tool'; content: string; tool_call_id: string; name: string }> {
  return results.map((r, i) => ({
    role: 'tool' as const,
    content: JSON.stringify(r.error ? { error: r.error } : r.result),
    tool_call_id: `call_${i}`,
    name: r.toolName,
  }))
}
