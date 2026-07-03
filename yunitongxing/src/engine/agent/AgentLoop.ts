import { callLLM, type LLMMessage } from '../../services/llm'
import { toolRegistry } from './ToolRegistry'
import { useAgentStore } from '../../stores/useAgentStore'
import { useChatStore } from '../../stores/useChatStore'
import { useTripStore } from '../../stores/useTripStore'
import { useMemoryStore } from '../../stores/useMemoryStore'
import { AGE_RULES } from '../../constants/age-rules'

const MAX_LOOP = 3

// Strong travel intent keywords — if matched, force generateTripPlan
const TRAVEL_PATTERNS = [
  /[出旅游]行|去.*玩|带.*去|周末|假期|放假/,
  /推荐|攻略|路线|行程|规划|安排/,
  /[一两二三四五\d]天|几日/,
  /带娃|亲子|遛娃|儿童|小孩/,
  /景点|公园|博物馆|动物园|海洋|科技馆|游乐|爬山/,
  /室内|户外|周边|近郊/,
]

function hasTravelIntent(input: string): boolean {
  return TRAVEL_PATTERNS.some((p) => p.test(input))
}

function extractDestination(input: string): string | null {
  // Common Chinese city names + tourist destinations
  const cities = ['大连', '北京', '上海', '广州', '深圳', '成都', '杭州', '南京', '西安', '厦门', '三亚', '青岛', '重庆', '苏州', '武汉', '长沙', '昆明', '桂林', '丽江', '大理', '张家界', '黄山', '九寨沟', '秦皇岛', '北戴河', '长白山', '迪士尼']
  for (const city of cities) {
    if (input.includes(city)) return city
  }
  return null
}

function detectDuration(input: string): number {
  if (/[四五4]天/.test(input)) return 4
  if (/[两三3]天|[两三3]日|周末/.test(input)) return /周末/.test(input) ? 2 : 3
  if (/[一两2]天|[一两2]日/.test(input)) return 2
  if (/[五5]天/.test(input)) return 5
  return 1
}

const LIGHT_SYSTEM_PROMPT = `你是"与你童行"亲子出行Agent。你可以调用工具来帮助用户规划行程、查询天气、搜索POI、调整路线等。

## 年龄规则
- 0-3岁(婴幼): 每次游玩≤2h, 步行≤2km, 每60分钟休息
- 4-6岁(学龄前): 每次游玩≤3h, 步行≤3km, 每90分钟休息
- 7-12岁(学龄): 每次游玩≤4h, 步行≤4km, 每120分钟休息

## 原则
- 以孩子为中心，安全第一
- 回复简洁友好，用emoji增加亲和力
- 自动选择合适的工具，不要问用户选什么工具
- **重要**: 用户提到出行/旅游/景点/游玩 等意图时，必须首先调用generateTripPlan工具生成行程`

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

    // Add recent conversation (exclude the last message if it matches current input,
    // since sendMessage already pushed it to chatStore before we run)
    const history = chatStore.messages.slice(-6)
    const lastHistoryMsg = history[history.length - 1]
    const skipLast = lastHistoryMsg?.role === 'user' && lastHistoryMsg.content === userInput
    for (const m of skipLast ? history.slice(0, -1) : history) {
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
        max_tokens: 2048,
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

    // Fallback: if no tools were called but user clearly wants a trip, force it
    const hasToolsCalled = messages.some((m) => m.role === 'tool')
    const tripPlanCalled = messages.some((m) => m.role === 'tool' && m.name === 'generateTripPlan')
    const travelIntent = hasTravelIntent(userInput)

    if (travelIntent && !tripPlanCalled) {
      console.log('[AgentLoop] travel intent detected, forcing generateTripPlan...')
      try {
        const forcedTrip = await toolRegistry.execute('generateTripPlan', {
          destination: extractDestination(userInput) || '大连',
          childAge: childAge,
          duration: detectDuration(userInput),
          preferences: userInput,
        })
        messages.push({
          role: 'tool',
          content: JSON.stringify(forcedTrip),
          tool_call_id: 'forced_trip',
          name: 'generateTripPlan',
        })
        const forcedIdx = agentStore.addToolCall('generateTripPlan')
        agentStore.updateToolCall(forcedIdx, 'done', JSON.stringify(forcedTrip).slice(0, 200))
      } catch (err) {
        console.warn('[AgentLoop] forced trip generation failed:', err)
      }
    }

    if (!finalContent) {
      // Inject actual trip data so the final response references real POIs
      const currentTrip = useTripStore.getState().currentTrip
      if (currentTrip) {
        const allNodeNames = currentTrip.days.flatMap((d) =>
          [...d.segments.morning, ...d.segments.afternoon, ...d.segments.evening]
        ).map((n) => n.name)
        messages.push({
          role: 'system',
          content: `行程已生成: "${currentTrip.title}", ${currentTrip.days.length}天, 包含: ${allNodeNames.join('、')}。请基于这些真实地点回复用户，用emoji点缀。`,
        })
      }
      const finalResponse = await callLLM({ messages, temperature: 0.7, max_tokens: 1024 })
      finalContent = finalResponse.content || '已为您处理完毕！请查看地图和行程页面。'
    }

    agentStore.setPhase('idle')
    // NOTE: don't clearToolCalls here — HomePage reads them for the message record
    return finalContent
  }
}

export const agentLoop = new AgentLoop()
