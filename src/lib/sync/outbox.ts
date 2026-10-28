import { getPersistence } from '../desktop/runtime'
import type { SessionLogEntryV2 } from '../../types'

export interface Outbox {
  revision: number
  changed: Record<string, string>
  sessions: Record<string, SessionLogEntryV2>
}
const KEY = 'ff3_cloud_outbox'
let remoteWrite = false
function dictionary<T>(values?: Record<string, T>): Record<string, T> {
  // Imported IDs are data, including names such as __proto__; never invoke a setter.
  return Object.assign(Object.create(null) as Record<string, T>, values)
}
export function readOutbox(): Outbox {
  try {
    const value = JSON.parse(getPersistence().getItem(KEY) ?? 'null') as Outbox | null
    if (value && Number.isSafeInteger(value.revision) && value.revision >= 0 &&
      value.changed && typeof value.changed === 'object' && !Array.isArray(value.changed) &&
      value.sessions && typeof value.sessions === 'object' && !Array.isArray(value.sessions)) {
      return { revision: value.revision, changed: dictionary(value.changed), sessions: dictionary(value.sessions) }
    }
  } catch { /* Older or unavailable storage: retain ordinary local records. */ }
  return {revision: 0, changed: dictionary(), sessions: dictionary()}
}
export function isRemoteWrite(): boolean {return remoteWrite}
export function applyRemote<T>(work: () => T): T {
  const previous = remoteWrite
  remoteWrite = true
  try {return work()} finally {remoteWrite = previous}
}
export function trackCloudWrite(key: string, value: unknown): void {
  if (remoteWrite || !['ff2_sessions', 'ff2_session_tombstones', 'ff2_settings', 'ff2_sound_prefs', 'ff2_interface', 'ff2_stats', 'ff2_goals', 'ff2_milestones'].includes(key)) return
  const outbox = readOutbox()
  outbox.revision++
  outbox.changed[key] = new Date().toISOString()
  if (key === 'ff2_sessions' && Array.isArray(value)) {
    for (const session of value as SessionLogEntryV2[]) outbox.sessions[session.id] = session
  }
  getPersistence().setItem(KEY, JSON.stringify(outbox))
}
export function acknowledgeOutbox(revision: number): void {
  if (readOutbox().revision === revision) getPersistence().removeItem(KEY)
}
export function clearOutbox(): void {getPersistence().removeItem(KEY)}
