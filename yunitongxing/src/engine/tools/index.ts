// Tool registry auto-registration
import { toolRegistry } from '../agent/ToolRegistry'
import { searchPoi } from './searchPoi'
import { getWeather } from './getWeather'
import { generateTripPlan } from './generateTripPlan'
import { adjustTrip } from './adjustTrip'
import { findNearbyFacility } from './findNearbyFacility'
import { checkTicketInfo } from './checkTicketInfo'
import { generateAlternativePlan } from './generateAlternativePlan'
import { suggestRestSpot } from './suggestRestSpot'
import { saveToMemory, queryMemory } from './memoryTools'

export function registerAllTools() {
  toolRegistry.register('searchPoi', searchPoi as (args: Record<string, unknown>) => Promise<unknown>)
  toolRegistry.register('getWeather', getWeather as (args: Record<string, unknown>) => Promise<unknown>)
  toolRegistry.register('generateTripPlan', generateTripPlan as (args: Record<string, unknown>) => Promise<unknown>)
  toolRegistry.register('adjustTrip', adjustTrip as (args: Record<string, unknown>) => Promise<unknown>)
  toolRegistry.register('findNearbyFacility', findNearbyFacility as (args: Record<string, unknown>) => Promise<unknown>)
  toolRegistry.register('checkTicketInfo', checkTicketInfo as (args: Record<string, unknown>) => Promise<unknown>)
  toolRegistry.register('generateAlternativePlan', generateAlternativePlan as (args: Record<string, unknown>) => Promise<unknown>)
  toolRegistry.register('suggestRestSpot', suggestRestSpot as (args: Record<string, unknown>) => Promise<unknown>)
  toolRegistry.register('saveToMemory', saveToMemory as (args: Record<string, unknown>) => Promise<unknown>)
  toolRegistry.register('queryMemory', queryMemory as (args: Record<string, unknown>) => Promise<unknown>)
}
