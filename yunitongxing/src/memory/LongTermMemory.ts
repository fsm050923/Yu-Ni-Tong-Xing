import type { Trip } from '../types/trip'
import { useMemoryStore } from '../stores/useMemoryStore'
import { useTripStore } from '../stores/useTripStore'

const DB_NAME = 'ytx_memory_db'
const DB_VERSION = 1
const TRIPS_STORE = 'trips'

export class LongTermMemory {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(TRIPS_STORE)) {
          db.createObjectStore(TRIPS_STORE, { keyPath: 'id' })
        }
      }
      req.onsuccess = () => {
        this.db = req.result
        resolve()
      }
      req.onerror = () => reject(req.error)
    })
  }

  get store() { return useMemoryStore.getState() }

  async saveTrip(trip: Trip): Promise<void> {
    // Also save to Zustand (localStorage fallback)
    useTripStore.getState().saveTripToHistory()

    if (!this.db) await this.init()
    if (!this.db) return

    const tx = this.db.transaction(TRIPS_STORE, 'readwrite')
    const store = tx.objectStore(TRIPS_STORE)
    store.put({
      id: trip.id,
      title: trip.title,
      destination: trip.destination,
      childAge: trip.childAge,
      date: trip.days[0]?.date || new Date().toISOString().slice(0, 10),
      nodes: trip.days.flatMap((d) => [
        ...d.segments.morning,
        ...d.segments.afternoon,
        ...d.segments.evening,
      ]).map((n) => ({
        name: n.name,
        poiType: n.poiType,
        rating: n.childFriendlinessRating,
        indoor: n.indoor,
        tips: n.tips,
      })),
      mode: trip.mode,
      savedAt: Date.now(),
    })
  }

  async getTripHistory(limit = 10): Promise<Array<{ id: string; title: string; destination: string; date: string }>> {
    if (!this.db) await this.init()
    if (!this.db) return this.store.longTerm.slice(0, limit).map((m) => ({
      id: m.id,
      title: m.content || '',
      destination: '',
      date: new Date(m.timestamp).toISOString().slice(0, 10),
    }))

    return new Promise((resolve) => {
      const tx = this.db!.transaction(TRIPS_STORE, 'readonly')
      const store = tx.objectStore(TRIPS_STORE)
      const results: Array<{ id: string; title: string; destination: string; date: string }> = []
      store.openCursor().onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result
        if (cursor && results.length < limit) {
          results.push({
            id: cursor.value.id,
            title: cursor.value.title,
            destination: cursor.value.destination,
            date: cursor.value.date,
          })
          cursor.continue()
        } else {
          resolve(results)
        }
      }
    })
  }

  getPromptContext(): string {
    const history = this.store.longTerm.slice(0, 5)
    if (!history.length) return ''

    return `## 历史行程
${history.map((h) => `- ${h.content}`).join('\n')}
`
  }
}

export const longTermMemory = new LongTermMemory()
