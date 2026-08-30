import type { SessionLogEntry } from '../types'

const KEY = 'ff2_sessions'
const MAX_ENTRIES = 200

function isEntry(value: unknown): SessionLogEntry | null {
  if (typeof value !== 'object' || value === null) return null
  const v = value as Record<string, unknown>
  if (typeof v.id !== 'string' || typeof v.date !== 'string') return null
  if (typeof v.minutes !== 'number' || !Number.isFinite(v.minutes)) return null
  return {
    id: v.id,
    date: v.date,
    minutes: Math.max(0, Math.round(v.minutes)),
    task: typeof v.task === 'string' && v.task.trim() !== '' ? v.task.slice(0, 200) : null,
  }
}

export function loadSessions(): SessionLogEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw === null) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(isEntry).filter((e): e is SessionLogEntry => e !== null)
  } catch {
    return []
  }
}

export function addSession(entry: SessionLogEntry): SessionLogEntry[] {
  const sessions = [entry, ...loadSessions()].slice(0, MAX_ENTRIES)
  try {
    localStorage.setItem(KEY, JSON.stringify(sessions))
  } catch {
    // Storage full — the log is best-effort; stats remain authoritative.
  }
  return sessions
}

export interface LogDay {
  /** date string used as key (toDateString) */
  key: string
  label: string
  entries: SessionLogEntry[]
}

/** Groups sessions by calendar day, newest first (sessions arrive newest first). */
export function groupByDay(sessions: SessionLogEntry[], lang: 'pl' | 'en'): LogDay[] {
  const days: LogDay[] = []
  const byKey = new Map<string, LogDay>()
  for (const s of sessions) {
    const d = new Date(s.date)
    const key = d.toDateString()
    let day = byKey.get(key)
    if (!day) {
      day = {
        key,
        label: d.toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-GB', {
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

export function timeLabel(iso: string, lang: 'pl' | 'en'): string {
  return new Date(iso).toLocaleTimeString(lang === 'pl' ? 'pl-PL' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
