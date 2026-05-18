import { AGENT_TOOL_DEFINITIONS } from '../tools/definitions'
import type { LLMToolDefinition } from '../../services/llm'

type ToolHandler = (args: Record<string, unknown>) => Promise<unknown>

class ToolRegistry {
  private handlers = new Map<string, ToolHandler>()

  register(name: string, handler: ToolHandler) {
    this.handlers.set(name, handler)
  }

  async execute(name: string, args: Record<string, unknown>): Promise<unknown> {
    const handler = this.handlers.get(name)
    if (!handler) throw new Error(`Tool not found: ${name}`)
    return handler(args)
  }

  getToolDefinitions(): LLMToolDefinition[] {
    return AGENT_TOOL_DEFINITIONS.map((def) => ({
      type: 'function' as const,
      function: {
        name: def.name,
        description: def.description,
        parameters: def.parameters as Record<string, unknown>,
      },
    }))
  }

  has(name: string): boolean {
    return this.handlers.has(name)
  }

  list(): string[] {
    return [...this.handlers.keys()]
  }
}

export const toolRegistry = new ToolRegistry()
