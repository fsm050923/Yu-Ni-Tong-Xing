import { callLLM, type LLMMessage } from '../../services/llm'
import { toolRegistry } from './ToolRegistry'
import { useAgentStore } from '../../stores/useAgentStore'
import { useChatStore } from '../../stores/useChatStore'
import { useTripStore } from '../../stores/useTripStore'
import { useMemoryStore } from '../../stores/useMemoryStore'
import { AGE_RULES } from '../../constants/age-rules'

const MAX_LOOP = 3

const LIGHT_SYSTEM_PROMPT = `你是"与你童行"亲子出行Agent。你可以调用工具来帮助用户规划行程、查询天气、搜索POI、调整路线等。

## 年龄规则
- 0-3岁(婴幼): 每次游玩≤2h, 步行≤2km, 每60分钟休息
- 4-6岁(学龄前): 每次游玩≤3h, 步行≤3km, 每90分钟休息
- 7-12岁(学龄): 每次游玩≤4h, 步行≤4km, 每120分钟休息

## 原则
- 以孩子为中心，安全第一
- 回复简洁友好，用emoji增加亲和力
- 自动选择合适的工具，不要问用户选什么工具`

export class AgentLoop {
  async run(userInput: string): Promise<string> {
    const agentStore = useAgentStore.getState()
    const chatStore = useChatStore.getState()
    const tripStore = useTripStore.getState()
    const memoryStore = useMemoryStore.getState()

    agentStore.setPhase('perceiving')
    agentStore.clearToolCalls()

    // Gather context
    memoryStore.loadFromStorage()
    const trip = tripStore.currentTrip
    const profile = memoryStore.profile
    const childAge = trip?.childAge || profile.childAge || 5
    const ageGroup = childAge <= 3 ? 'infant' as const : childAge <= 6 ? 'preschool' as const : 'school' as const
    const ageRules = AGE_RULES[ageGroup]

    // Build messages with a lightweight system prompt
    let systemPrompt = LIGHT_SYSTEM_PROMPT

    // Inject child profile if available
    if (profile.childName || profile.childAge) {
      const profileParts: string[] = []
      if (profile.childName) profileParts.push(`名字: ${profile.childName}`)
      if (profile.childAge) profileParts.push(`年龄: ${profile.childAge}岁`)
      if (profile.gender) profileParts.push(`性别: ${profile.gender === 'boy' ? '男孩' : '女孩'}`)
      if (profile.energyLevel) profileParts.push(`体力: ${profile.energyLevel === 'low' ? '易累' : profile.energyLevel === 'high' ? '旺盛' : '正常'}`)
      if (profile.interests.length) profileParts.push(`爱好: ${profile.interests.join('、')}`)
      if (profile.avoidCrowds) profileParts.push('偏好避开人流密集')
      if (profile.notes) profileParts.push(`备注: ${profile.notes}`)

      systemPrompt += `\n\n## 当前宝贝信息\n${profileParts.join(' | ')}\n(不要询问孩子的年龄和基本信息，直接使用以上信息)`
    }

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
    ]

    // Inject current trip if exists
    if (trip) {
      const tripSummary = {
        title: trip.title,
        destination: trip.destination,
        childAge: trip.childAge,
        mode: trip.mode,
        nodes: trip.days.flatMap((d) => [
          ...d.segments.morning,
          ...d.segments.afternoon,
          ...d.segments.evening,
        ]).map((n) => ({ name: n.name, time: n.startTime, indoor: n.indoor, lat: n.lat, lng: n.lng })),
      }
      messages.push({
        role: 'system',
        content: `当前行程: ${JSON.stringify(tripSummary)}`,
      })
    }

    // Inject memory
    const prefs = memoryStore.preferences.map((p) => p.value).join('; ')
    if (prefs) {
      messages.push({ role: 'system', content: `用户偏好: ${prefs}` })
    }

    // Add recent conversation
    const history = chatStore.messages.slice(-6)
    for (const m of history) {
      if (m.role === 'user') messages.push({ role: 'user', content: m.content })
      else if (m.role === 'assistant') messages.push({ role: 'assistant', content: m.content })
    }

    // Add current user input
    messages.push({ role: 'user', content: userInput })

    // Agent loop
    const tools = toolRegistry.getToolDefinitions()
    let finalContent = ''
    let iteration = 0

    agentStore.setPhase('thinking')

    while (iteration < MAX_LOOP) {
      iteration++
      console.log(`[AgentLoop] iteration ${iteration}, messages=${messages.length}`)

      const response = await callLLM({
        messages,
        tools,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 1024,
      })

      // No tool calls → done
      if (!response.toolCalls || response.toolCalls.length === 0) {
        finalContent = response.content || '好的，已为您处理！'
        break
      }

      // Execute tools
      agentStore.setPhase('executing')
      console.log(`[AgentLoop] executing ${response.toolCalls.length} tools`)

      messages.push({
        role: 'assistant',
        content: response.content || '',
        tool_calls: response.toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function' as const,
          function: tc.function,
        })),
      })

      for (const tc of response.toolCalls) {
        const toolName = tc.function.name
        let args: Record<string, unknown> = {}

        try {
          args = JSON.parse(tc.function.arguments)
        } catch {
          messages.push({
            role: 'tool',
            content: JSON.stringify({ error: '参数错误' }),
            tool_call_id: tc.id,
            name: toolName,
          })
          continue
        }

        const idx = agentStore.addToolCall(toolName)
        agentStore.updateToolCall(Number(idx), 'running')

        try {
          const result = await toolRegistry.execute(toolName, args)
          agentStore.updateToolCall(Number(idx), 'done', JSON.stringify(result).slice(0, 200))
          messages.push({
            role: 'tool',
            content: JSON.stringify(result),
            tool_call_id: tc.id,
            name: toolName,
          })
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err)
          agentStore.updateToolCall(Number(idx), 'done', errMsg)
          messages.push({
            role: 'tool',
            content: JSON.stringify({ error: errMsg }),
            tool_call_id: tc.id,
            name: toolName,
          })
        }
      }

      agentStore.setPhase('thinking')
    }

    agentStore.setPhase('responding')

    if (!finalContent) {
      const finalResponse = await callLLM({ messages, temperature: 0.7, max_tokens: 512 })
      finalContent = finalResponse.content || '已为您处理完毕！请查看地图和行程页面。'
    }

    agentStore.setPhase('idle')
    return finalContent
  }
}

export const agentLoop = new AgentLoop()
