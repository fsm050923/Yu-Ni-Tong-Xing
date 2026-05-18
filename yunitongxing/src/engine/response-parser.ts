import type { Trip, TripNode, TripDay } from '../types/trip'
import { v4Id } from '../utils/id'

/**
 * Attempt to parse LLM-generated JSON into a valid Trip object.
 * Handles common LLM output quirks (extra fields, missing id, etc.)
 */
export function parseTripFromLLM(json: unknown, ageGroup: Trip['ageGroup'] = 'preschool'): Trip | null {
  try {
    const data = typeof json === 'string' ? JSON.parse(fixJsonString(json)) : json
    if (!data || typeof data !== 'object') return null

    const days: TripDay[] = (data.days || []).map((day: Record<string, unknown>, di: number) => ({
      date: String(day.date || new Date().toISOString().slice(0, 10)),
      segments: {
        morning: parseNodes(day.segments?.morning || day.morning, 'morning', di),
        afternoon: parseNodes(day.segments?.afternoon || day.afternoon, 'afternoon', di),
        evening: parseNodes(day.segments?.evening || day.evening, 'evening', di),
      },
    }))

    if (days.length === 0) return null

    return {
      id: (data.id as string) || v4Id(),
      title: String(data.title || '亲子出行'),
      destination: String(data.destination || '未知目的地'),
      destinationCoords: Array.isArray(data.destinationCoords) && data.destinationCoords.length === 2
        ? [Number(data.destinationCoords[0]), Number(data.destinationCoords[1])]
        : [39.9042, 116.4074],
      childAge: Number(data.childAge || 5),
      ageGroup,
      mode: (data.mode as Trip['mode']) || 'standard',
      weatherPlan: (data.weatherPlan as Trip['weatherPlan']) || { sunny: days, rainy: null },
      days,
    }
  } catch {
    return null
  }
}

function parseNodes(nodes: unknown[], _segment: string, _dayIndex: number): TripNode[] {
  if (!Array.isArray(nodes)) return []
  return nodes.map((n: Record<string, unknown>, i): TripNode => ({
    id: (n.id as string) || v4Id(),
    type: (n.type as TripNode['type']) || 'attraction',
    poiType: (n.poiType as TripNode['poiType']) || 'park',
    name: String(n.name || `节点 ${i + 1}`),
    lat: Number(n.lat || 39.9 + Math.random() * 0.05),
    lng: Number(n.lng || 116.4 + Math.random() * 0.05),
    startTime: String(n.startTime || '09:00'),
    endTime: String(n.endTime || '10:30'),
    duration: Number(n.duration || 90),
    walkingFromPrev: n.walkingFromPrev
      ? {
          distance: Number((n.walkingFromPrev as Record<string, unknown>).distance || 0),
          estimatedMinutes: Number((n.walkingFromPrev as Record<string, unknown>).estimatedMinutes || 0),
        }
      : i > 0
        ? { distance: 500, estimatedMinutes: 8 }
        : undefined,
    ticketInfo: n.ticketInfo
      ? {
          adultPrice: Number((n.ticketInfo as Record<string, unknown>).adultPrice || 0),
          childPrice: Number((n.ticketInfo as Record<string, unknown>).childPrice || 0),
          childPolicy: String((n.ticketInfo as Record<string, unknown>).childPolicy || ''),
          bookingUrl: String((n.ticketInfo as Record<string, unknown>).bookingUrl || ''),
          openingHours: String((n.ticketInfo as Record<string, unknown>).openingHours || '09:00-17:00'),
        }
      : undefined,
    childFriendlinessRating: Number(n.childFriendlinessRating || 4),
    crowdLevel: Number(n.crowdLevel || 2),
    tips: Array.isArray(n.tips) ? n.tips.map(String) : [],
    indoor: Boolean(n.indoor),
  }))
}

function fixJsonString(raw: string): string {
  return raw
    .replace(/\/\/.*$/gm, '')       // Remove comments
    .replace(/,\s*}/g, '}')         // Trailing commas
    .replace(/,\s*]/g, ']')         // Trailing commas in arrays
    .replace(/```(?:json)?/g, '')   // Markdown code fences
    .trim()
}

/**
 * Extract a natural language summary from LLM response that also contains JSON
 */
export function extractTextContent(content: string): string {
  // Remove JSON blocks
  let text = content.replace(/\{[\s\S]*\}/g, '')
  text = text.replace(/```[\s\S]*```/g, '')
  return text.trim()
}
