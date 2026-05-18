import type { Trip } from '../types/trip'

const BASE_SYSTEM_PROMPT = `你是「与你童行」的AI亲子出行规划Agent。你专门为0-12岁孩子的家庭规划出行路线。

## 你的能力
1. 根据用户自然语言需求生成完整行程方案
2. 根据年龄规则自动调整行程节奏
3. 实时响应出行中的调整请求
4. 主动提醒亲子刚需设施和休息节点

## 核心原则
- 以孩子为中心，安全第一
- 分年龄定制：0-3岁婴幼/4-6岁学龄前/7-12岁学龄
- 自然语言交互，不用表格
- 输出必须是JSON格式`

export function buildPlanningPrompt(opts: {
  userInput: string
  ageGroup: 'infant' | 'preschool' | 'school'
  ageRules: Record<string, unknown>
  memory?: string
  conversationHistory?: Array<{ role: string; content: string }>
}): { systemPrompt: string; userMessage: string; messageHistory: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> } {
  const ageRuleText = JSON.stringify(opts.ageRules, null, 2)
  const memorySection = opts.memory ? `\n## 用户记忆\n${opts.memory}` : ''

  const systemPrompt = `${BASE_SYSTEM_PROMPT}${memorySection}

## 当前年龄规则
${ageRuleText}

## 输出格式
请生成完整的JSON行程方案，格式如下：
{
  "title": "行程标题",
  "destination": "目的地",
  "destinationCoords": [lat, lng],
  "days": [{
    "date": "YYYY-MM-DD",
    "segments": {
      "morning": [{ "name": "...", "poiType": "playground|museum|restaurant|nursery|...", "lat": 0, "lng": 0, "startTime": "09:00", "endTime": "10:30", "duration": 90, "childFriendlinessRating": 5, "crowdLevel": 2, "tips": ["..."], "indoor": false }],
      "afternoon": [...],
      "evening": [...]
    }
  }]
}`

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [{ role: 'system', content: systemPrompt }]
  if (opts.conversationHistory) {
    messages.push(...opts.conversationHistory.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })))
  }

  return {
    systemPrompt,
    userMessage: opts.userInput,
    messageHistory: messages,
  }
}

export function buildAdjustmentPrompt(opts: {
  currentTrip: Trip
  userRequest: string
  conversationHistory?: Array<{ role: string; content: string }>
}): { systemPrompt: string; userMessage: string } {
  const systemPrompt = `${BASE_SYSTEM_PROMPT}

你正在调整一个现有的行程。用户发来了修改请求。

## 当前行程
${JSON.stringify(opts.currentTrip, null, 2)}

## 要求
- 根据用户请求修改行程
- 保持已确认的部分不变
- 如果删除景点，自动插入合适的替代节点
- 重新计算时间安排
- 返回完整更新后的行程JSON`

  return {
    systemPrompt,
    userMessage: opts.userRequest,
  }
}
