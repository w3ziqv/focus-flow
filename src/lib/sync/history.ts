import type { SessionLogEntryV2 } from '../../types'

export function historyDays(history: Record<string, number>): {date: string; minutes: number; schemaVersion: 3}[] {
  return Object.entries(history).flatMap(([key, minutes]) => {
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key)
    const date = iso ? new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])) : new Date(key)
    if (!Number.isFinite(date.getTime()) || !Number.isFinite(minutes) || minutes < 0 || minutes > 10_000_000) return []
    const day = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    if (date.getFullYear() < 1000 || date.getFullYear() > 9999 || (iso && day !== key)) return []
    return [{ date: day, minutes: Math.round(minutes), schemaVersion: 3 as const }]
  })
}

/** Preserve minutes predating the visible session window, without counting visible sessions twice. */
export function mergeDailyHistory(a: Record<string, number>, b: Record<string, number>, local: SessionLogEntryV2[], remote: SessionLogEntryV2[]): Record<string, number> {
  const known = (entries: SessionLogEntryV2[]) => {
    const result: Record<string, number> = {}
    for (const entry of entries) { const day = new Date(entry.date).toDateString(); result[day] = (result[day] ?? 0) + entry.minutes }
    return result
  }
  const union = new Map([...local, ...remote].map(entry => [entry.id, entry]))
  const left = known([...union.values()]), right = left
  const baseline: Record<string, number> = {}
  for (const day of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const value = Math.max(0, (a[day] ?? 0) - (left[day] ?? 0), (b[day] ?? 0) - (right[day] ?? 0))
    if (Number.isFinite(value)) baseline[day] = value
  }
  return baseline
}
