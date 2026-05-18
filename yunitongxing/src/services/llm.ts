const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || ''

interface LLMToolCallInMsg {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  tool_call_id?: string
  name?: string
  tool_calls?: LLMToolCallInMsg[]
}

interface LLMToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

interface LLMRequest {
  messages: LLMMessage[]
  tools?: LLMToolDefinition[]
  tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } }
  response_format?: { type: 'text' } | { type: 'json_object' }
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

interface LLMToolCall {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

interface LLMResponse {
  content: string | null
  toolCalls: LLMToolCall[] | null
  finishReason: string
}

export type { LLMMessage, LLMToolDefinition, LLMResponse, LLMToolCall }

export async function callLLM(req: LLMRequest): Promise<LLMResponse> {
  const useMock = !DEEPSEEK_API_KEY
  console.log(`[LLM] mode=${useMock ? 'mock' : 'deepseek'}, tools=${req.tools?.length || 0}, msgs=${req.messages.length}`)

  if (useMock) {
    console.log('[LLM] using mock mode (no API key)')
    return mockLLMResponse(req.messages, req)
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      console.warn('[LLM] 20s timeout, aborting')
      controller.abort()
    }, 20000)

    const body: Record<string, unknown> = {
      model: 'deepseek-chat',
      messages: req.messages.map((m) => ({
        role: m.role,
        content: m.content,
        ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {}),
        ...(m.name ? { name: m.name } : {}),
        ...(m.tool_calls ? { tool_calls: m.tool_calls } : {}),
      })),
      tools: req.tools,
      tool_choice: req.tool_choice ?? (req.tools ? 'auto' : undefined),
      temperature: req.temperature ?? 0.7,
      max_tokens: req.max_tokens ?? 1024,
      stream: false,
    }
    if (req.response_format) {
      body.response_format = req.response_format
    }

    console.log(`[LLM] calling DeepSeek... msgCount=${body.messages.length}`)
    const startTime = Date.now()

    const res = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    console.log(`[LLM] response in ${Date.now() - startTime}ms, status=${res.status}`)

    if (!res.ok) {
      const errText = await res.text()
      console.error(`[LLM] HTTP ${res.status}: ${errText.slice(0, 200)}`)
      throw new Error(`API returned ${res.status}`)
    }

    const data = await res.json()
    if (data.error) {
      console.error('[LLM] API error:', data.error)
      throw new Error(data.error.message)
    }

    const msg = data.choices[0].message
    console.log(`[LLM] finish=${data.choices[0].finish_reason}, content=${!!msg.content}, toolCalls=${msg.tool_calls?.length || 0}`)

    if (msg.tool_calls?.length) {
      msg.tool_calls.forEach((tc: LLMToolCall) => {
        console.log(`[LLM]   tool: ${tc.function.name}(${tc.function.arguments.slice(0, 80)})`)
      })
    }
    if (msg.content) {
      console.log(`[LLM]   content: ${msg.content.slice(0, 100)}`)
    }

    return {
      content: msg.content ?? null,
      toolCalls: msg.tool_calls ?? null,
      finishReason: data.choices[0].finish_reason,
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      console.warn('[LLM] Request timed out after 20s, falling back to mock')
    } else {
      console.error('[LLM] call failed, falling back to mock:', err)
    }
    return mockLLMResponse(req.messages, req)
  }
}

function mockLLMResponse(messages: LLMMessage[], req?: LLMRequest): LLMResponse {
  // If response_format is json_object, generate a JSON trip plan (used by generateTripPlan tool)
  if (req?.response_format && (req.response_format as { type: string }).type === 'json_object') {
    return mockJsonTripPlan(messages)
  }
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  const input = (lastUser?.content ?? '').trim()

  // Check if there are already tool results in the conversation
  const hasToolResults = messages.some((m) => m.role === 'tool')
  const toolResults = messages.filter((m) => m.role === 'tool').map((m) => m.content)

  // After tools have executed, generate a natural language response
  if (hasToolResults && toolResults.length > 0) {
    return generateNaturalResponse(input, toolResults)
  }

  // First call: decide which tools to invoke based on user intent
  return decideToolCalls(input)
}

function mockJsonTripPlan(messages: LLMMessage[]): LLMResponse {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  const prompt = (lastUser?.content ?? '').trim()

  // Extract destination and child age from prompt
  const destMatch = prompt.match(/(北京|大连|上海|广州|深圳|成都|杭州|南京|西安|厦门|三亚)/)
  const destination = destMatch ? destMatch[1] : '大连'
  const ageMatch = prompt.match(/(\d+)\s*岁/)
  const childAge = ageMatch ? parseInt(ageMatch[1]) : 5

  // Build a reasonable mock JSON trip plan using the POI names from the database
  // These are the same POIs defined in mock-trip-generator.ts
  let schedule: Array<{ name: string; startTime: string; duration: number; segment: string }> = []

  if (destination === '大连') {
    schedule = [
      { name: '大连圣亚海洋世界', startTime: '09:00', duration: 90, segment: 'morning' },
      { name: '星海广场', startTime: '11:00', duration: 60, segment: 'morning' },
      { name: '亲子西餐厅咕噜咕噜', startTime: '12:30', duration: 60, segment: 'afternoon' },
      { name: '大连自然博物馆', startTime: '14:30', duration: 60, segment: 'afternoon' },
      { name: '大连儿童公园', startTime: '16:30', duration: 60, segment: 'afternoon' },
    ]
  } else if (destination === '北京') {
    schedule = [
      { name: '北京动物园', startTime: '09:00', duration: 90, segment: 'morning' },
      { name: '中国科技馆', startTime: '11:00', duration: 90, segment: 'morning' },
      { name: '亲子餐厅小绿洲', startTime: '12:30', duration: 60, segment: 'afternoon' },
      { name: '蓝港儿童乐园', startTime: '14:30', duration: 60, segment: 'afternoon' },
      { name: '朝阳公园', startTime: '16:30', duration: 60, segment: 'afternoon' },
    ]
  } else {
    schedule = [
      { name: destination + '儿童公园', startTime: '09:00', duration: 90, segment: 'morning' },
      { name: destination + '博物馆', startTime: '11:00', duration: 60, segment: 'morning' },
      { name: '亲子餐厅', startTime: '12:30', duration: 60, segment: 'afternoon' },
      { name: destination + '科技馆', startTime: '14:30', duration: 60, segment: 'afternoon' },
      { name: destination + '广场', startTime: '16:30', duration: 60, segment: 'afternoon' },
    ]
  }

  // If preferences mention indoor or museum, adjust
  if (prompt.includes('室内') || prompt.includes('博物馆')) {
    schedule = schedule.map((s) => {
      if (prompt.includes('博物馆') && s.name.includes('自然博物馆')) return s
      if (prompt.includes('博物馆') && !s.name.includes('博物馆') && s.segment === 'afternoon') {
        return { ...s, name: destination === '大连' ? '大连贝壳博物馆' : '自然博物馆' }
      }
      return { ...s, name: s.name }
    })
  }

  const result = JSON.stringify({
    title: `${destination}${childAge}岁${prompt.includes('室内') ? '室内' : ''}亲子一日游`,
    destination,
    planningReasoning: `为${childAge}岁孩子精选了${destination}最受欢迎的${schedule.length}个亲子景点，上午侧重探索，下午轻松游玩。`,
    schedule,
  })

  return {
    content: result,
    toolCalls: null,
    finishReason: 'stop',
  }
}

function decideToolCalls(input: string): LLMResponse {
  const toolCalls: LLMToolCall[] = []
  let callId = 1

  const makeCall = (name: string, args: Record<string, unknown>): LLMToolCall => ({
    id: `call_${callId++}`,
    type: 'function',
    function: { name, arguments: JSON.stringify(args) },
  })

  // Detect destination and child age
  const destMatch = input.match(/(北京|大连|上海|广州|深圳|成都|杭州|南京|西安|厦门|三亚)/)
  const destination = destMatch ? destMatch[1] : '大连'

  const ageMatch = input.match(/(\d+)\s*岁/)
  const childAge = ageMatch ? parseInt(ageMatch[1]) : 5

  const today = new Date().toISOString().slice(0, 10)

  // Trip planning intent
  if (
    input.includes('去') ||
    input.includes('玩') ||
    input.includes('出行') ||
    input.includes('规划') ||
    input.includes('行程') ||
    input.includes('旅游') ||
    input.includes('带')
  ) {
    toolCalls.push(
      makeCall('getWeather', { location: destination, date: today })
    )
    toolCalls.push(
      makeCall('searchPoi', {
        location: destination,
        keyword: input.includes('室内') ? '室内' : input.includes('博物馆') ? '博物馆' : '',
        childAge,
      })
    )
    toolCalls.push(
      makeCall('generateTripPlan', {
        destination,
        childAge,
        preferences: input.includes('室内') ? '偏好室内' : input,
      })
    )
  }

  // Indoor / weather concern
  if (input.includes('室内') || input.includes('下雨') || input.includes('天气')) {
    toolCalls.push(
      makeCall('getWeather', { location: destination, date: today })
    )
    toolCalls.push(
      makeCall('generateAlternativePlan', {
        weatherCondition: 'rainy',
        childAge,
      })
    )
  }

  // Facility search
  if (input.includes('母婴室') || input.includes('卫生间') || input.includes('饮水') || input.includes('餐厅')) {
    const facilityType = input.includes('母婴') ? 'nursery'
      : input.includes('卫生') ? 'restroom'
      : input.includes('饮水') ? 'water-fountain'
      : 'restaurant'
    toolCalls.push(
      makeCall('findNearbyFacility', {
        lat: 38.887,
        lng: 121.586,
        facilityType,
        maxDistance: 500,
      })
    )
  }

  // Rest suggestion
  if (input.includes('累') || input.includes('休息')) {
    toolCalls.push(
      makeCall('suggestRestSpot', {
        childAge,
        elapsedMinutes: 120,
        lat: 38.887,
        lng: 121.586,
      })
    )
  }

  // Ticket inquiry
  if (input.includes('票') || input.includes('门票') || input.includes('预约')) {
    const attractionName = destination === '大连' ? '大连圣亚海洋世界' : '北京动物园'
    toolCalls.push(
      makeCall('checkTicketInfo', {
        attractionName,
        childAge,
      })
    )
  }

  // Memory save intent
  if (input.includes('记住') || input.includes('喜欢') || input.includes('不喜欢')) {
    toolCalls.push(
      makeCall('saveToMemory', {
        memoryType: 'preference',
        content: input,
      })
    )
  }

  // Query memory
  if (input.includes('上次') || input.includes('之前') || input.includes('以前') || input.includes('历史')) {
    toolCalls.push(
      makeCall('queryMemory', { query: input })
    )
  }

  // If no tools matched, still generate a trip as default
  if (toolCalls.length === 0) {
    toolCalls.push(
      makeCall('searchPoi', { location: destination, childAge })
    )
  }

  return {
    content: null,
    toolCalls,
    finishReason: 'tool_calls',
  }
}

function generateNaturalResponse(input: string, toolResults: string[]): LLMResponse {
  // Parse tool results and generate a human-like response
  const results = toolResults.map((r) => {
    try { return JSON.parse(r || '{}') } catch { return {} }
  })

  let response = ''

  // Check what tools were called
  for (const result of results) {
    if (result.tripId) {
      // generateTripPlan result
      response += `✨ 已为您规划好「${result.title}」！

📍 目的地：${result.destination}
👶 孩子年龄：${result.childAge}岁
📋 行程节点：共${result.totalNodes}个

`
    }

    if (result.condition) {
      // getWeather result
      const weatherIcon = result.suitableForOutdoor ? '☀️' : '🌧️'
      response += `${weatherIcon} ${result.location}天气：${result.condition}，${result.temperature?.high || '?'}°C / ${result.temperature?.low || '?'}°C。${result.tip || ''}

`
    }

    if (result.results) {
      // searchPoi result
      const pois = result.results.slice(0, 4)
      response += `🔍 找到${result.total}个亲子友好地点：
${pois.map((p: Record<string, unknown>) => `  • ${p.name} (${p.indoor ? '室内' : '户外'}, ⭐${p.rating})`).join('\n')}

`
    }

    if (result.alternativeNodes) {
      // generateAlternativePlan result
      response += `🔄 ${result.message || '已生成室内备选方案'}：
${(result.alternativeNodes as Array<Record<string, unknown>>).map((n) => `  • ${n.name} (${n.duration}分钟)`).join('\n')}

`
    }

    if (result.nearby) {
      // findNearbyFacility result
      const label = result.label || '设施'
      response += `📍 附近的${label}：
${(result.nearby as Array<Record<string, unknown>>).map((f: Record<string, unknown>) => `  • ${f.name} (${f.distance}m, 步行约${f.walkTime}分钟)`).join('\n')}

`
    }

    if (result.needsRest !== undefined) {
      // suggestRestSpot result
      response += `⏰ ${result.recommendation}
建议休息${result.suggestedRestDuration || 20}分钟。

`
      if (result.nearbyRest && (result.nearbyRest as Array<unknown>).length > 0) {
        response += `附近休息点：${(result.nearbyRest as Array<Record<string, unknown>>).map((r: Record<string, unknown>) => r.name).join('、')}

`
      }
    }

    if (result.ticket) {
      // checkTicketInfo result
      const t = result.ticket as Record<string, unknown>
      response += `🎫 ${result.attraction} 票务信息：
  成人：¥${t.adult} | 儿童：¥${t.child} (${t.childPolicy || '-'})
  开放时间：${result.hours}
  ${result.needBooking ? '⚠️ 需要提前预约' : '✅ 无需预约'}
  ${result.tip || ''}

`
    }

    if (result.memoryType === 'preference' || result.memoryType === 'trip_review') {
      response += `🧠 ${result.message || '已保存到记忆'}

`
    }

    if (result.count !== undefined && Array.isArray(result.results)) {
      // queryMemory result
      response += `📝 记忆中有${result.count}条相关信息
`
    }
  }

  // Fallback
  if (!response) {
    response = `好的！已根据您的需求"${input.slice(0, 30)}..."为您处理。请切换到地图和行程页面查看更新 🗺️`
  }

  response += `\n💡 您可以继续告诉我调整需求，比如"换成室内景点"或"附近有母婴室吗"～`

  return {
    content: response,
    toolCalls: null,
    finishReason: 'stop',
  }
}
