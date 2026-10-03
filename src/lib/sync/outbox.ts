import { getPersistence } from '../desktop/runtime'
import type { SessionLogEntryV2 } from '../../types'

export interface Outbox {
  revision: number
  changed: Record<string, string>
  sessions: Record<string, SessionLogEntryV2>
}
const KEY = 'ff3_cloud_outbox'
let remoteWrite = false
export function readOutbox(): Outbox {
  try {
    const value = JSON.parse(getPersistence().getItem(KEY) ?? 'null') as Outbox | null
    if (value && Number.isSafeInteger(value.revision) && value.changed && value.sessions) return value
  } catch { /* Older or unavailable storage: retain ordinary local records. */ }
  return {revision: 0, changed: {}, sessions: {}}
}
export function isRemoteWrite(): boolean {return remoteWrite}
export function applyRemote<T>(work: () => T): T {
  remoteWrite = true
  try {return work()} finally {remoteWrite = false}
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
