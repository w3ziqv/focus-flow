import { canonical, mergeDocuments, setReplicaValue, validateClock, type ReplicaDocument, type ReplicaRecord } from './crdt'
import { getPersistence } from './runtime'
import { isSessionEntry, isSettings, loadSessions, loadTombstones, saveSessions, saveStats, saveSettings, loadStats, weekStartOf } from '../storage'
import type { SessionLogEntryV2 } from '../../types'

const DOCUMENT_KEY = 'ff3_replica'
const DEVICE_KEY = 'ff3_device'
export class LocalReplica {
  private document: ReplicaDocument
  private readonly device: string
  constructor() {
    const storage = getPersistence()
    this.device = storage.getItem(DEVICE_KEY) ?? crypto.randomUUID()
    storage.setItem(DEVICE_KEY, this.device)
    const raw = storage.getItem(DOCUMENT_KEY)
    this.document = raw ? validateReplica(JSON.parse(raw)) : { version: 3, records: {} }
    this.capture()
  }
  capture(): ReplicaDocument {
    const stored = getPersistence().getItem(DOCUMENT_KEY)
    if (stored) this.document = mergeDocuments(this.document, validateReplica(JSON.parse(stored)))
    for (const session of loadSessions()) this.document = setReplicaValue(this.document, `session:${session.id}`, session, this.device)
    for (const tombstone of loadTombstones()) this.document = setReplicaValue(this.document, `session:${tombstone.id}`, null, this.device, true)
    const settings = getPersistence().getItem('ff2_settings')
    if (settings) this.document = setReplicaValue(this.document, 'settings', isSettings(JSON.parse(settings)), this.device)
    this.persist()
    return this.document
  }
  merge(value: unknown): void {
    const remote = validateReplica(value)
    const merged = mergeDocuments(this.capture(), remote)
    const sessions = Object.entries(merged.records).filter(([key, record]) => key.startsWith('session:') && !record.deleted).map(([,record]) => isSessionEntry(record.value)).filter((entry): entry is SessionLogEntryV2 => entry !== null).sort((a,b) => Date.parse(b.date)-Date.parse(a.date) || b.id.localeCompare(a.id)).slice(0,1000)
    // Keep causal metadata for all known deletions, even once visible history is capped.
    this.document = merged
    this.persist()
    saveSessions(sessions)
    const settings = merged.records.settings
    if (settings && !settings.deleted) { const validated = isSettings(settings.value); if (validated) saveSettings(validated) }
    const current = loadStats()
    const history: Record<string, number> = {}
    for (const session of sessions) { const day = new Date(session.date).toDateString(); history[day] = (history[day] ?? 0) + session.minutes }
    const today = new Date().toDateString()
    const weekStart = weekStartOf()
    const start = new Date(weekStart).getTime()
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)
    const end = weekEnd.getTime()
    const days = Object.keys(history).map(key => {
      const date = new Date(key)
      return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    }).sort((a,b) => b-a)
    const now = new Date()
    const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
    let streak = 0
    if (days[0] === todayUtc || days[0] === todayUtc - 86_400_000) {
      for (const day of days) { if (day !== days[0] - streak * 86_400_000) break; streak++ }
    }
    const lastDate = sessions[0] ? new Date(sessions[0].date).toDateString() : null
    saveStats({...current, history, streak, lastDate, minutes: sessions.reduce((sum,s) => sum+s.minutes,0), today: sessions.filter(s => new Date(s.date).toDateString()===today).length, week: sessions.filter(s => Date.parse(s.date)>=start && Date.parse(s.date)<end).length, date: today, weekStart})
    window.dispatchEvent(new Event('focus-flow:peer-sync'))
  }
  private persist(): void { getPersistence().setItem(DOCUMENT_KEY, canonical(this.document)) }
}
export function validateReplica(value: unknown): ReplicaDocument {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Invalid peer data')
  const raw = value as Record<string, unknown>
  if (raw.version !== 3 || !raw.records || typeof raw.records !== 'object' || Array.isArray(raw.records)) throw Error('Invalid peer schema')
  if (Object.keys(raw.records).length > 10_000) throw Error('Too many peer records')
  const records: Record<string, ReplicaRecord> = Object.create(null) as Record<string, ReplicaRecord>
  for (const [key, item] of Object.entries(raw.records)) {
    if (key !== 'settings' && !(key.startsWith('session:') && key.length > 8 && key.length <= 72)) throw Error('Unsupported peer record')
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw Error('Invalid peer record')
    const record = item as Record<string, unknown>
    if (typeof record.deleted !== 'boolean' || (key === 'settings' && record.deleted)) throw Error('Invalid deletion record')
    const sanitized = record.deleted ? null : key === 'settings' ? isSettings(record.value) : isSessionEntry(record.value)
    if (!record.deleted && !sanitized) throw Error('Invalid peer value')
    if (key.startsWith('session:') && sanitized && ((sanitized as SessionLogEntryV2).minutes > 120 || (sanitized as SessionLogEntryV2).minutes < 0)) throw Error('Invalid peer session duration')
    if (key.startsWith('session:') && sanitized && (sanitized as SessionLogEntryV2).id !== key.slice(8)) throw Error('Peer session identity mismatch')
    const clock = validateClock(record.clock)
    const dot = record.dot as {device?: unknown; counter?: unknown} | undefined
    if (!dot || typeof dot.device !== 'string' || typeof dot.counter !== 'number' || !Number.isSafeInteger(dot.counter) || dot.counter < 1 || dot.counter > (clock[dot.device] ?? 0)) throw Error('Invalid peer revision')
    records[key] = {clock, dot: {device: dot.device, counter: dot.counter}, value: sanitized, deleted: record.deleted}
  }
  return {version: 3, records}
}
