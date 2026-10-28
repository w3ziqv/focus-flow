import { localeFor } from '../domain/language'
import type { Lang, SessionLogEntry } from '../types'
import {
  addSession,
  loadSessions,
  MAX_SESSIONS,
  saveSessions,
} from './storage'

export type { SessionLogEntry }
export { addSession, loadSessions, MAX_SESSIONS, saveSessions }

export interface LogDay {
  /** date string used as key (toDateString) */
  key: string
  label: string
  entries: SessionLogEntry[]
}

/** Groups sessions by calendar day, newest first (sessions arrive newest first). */
export function groupByDay(sessions: SessionLogEntry[], lang: Lang): LogDay[] {
  const days: LogDay[] = []
  const byKey = new Map<string, LogDay>()
  for (const s of sessions) {
    const d = new Date(s.date)
    const key = d.toDateString()
    let day = byKey.get(key)
    if (!day) {
      day = {
        key,
        label: d.toLocaleDateString(localeFor(lang), {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        }),
        entries: [],
      }
      byKey.set(key, day)
      days.push(day)
    }
    day.entries.push(s)
  }
  return days
}

export function timeLabel(iso: string, lang: Lang): string {
  return new Date(iso).toLocaleTimeString(localeFor(lang), {
    hour: '2-digit',
    minute: '2-digit',
  })
}
