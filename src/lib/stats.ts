import type { Lang, SessionLogEntry, Stats } from '../types'
import { saveStats, weekStartOf } from './storage'

function dayKey(date = new Date()): string {
  return date.toDateString()
}

/** Adds one completed focus session to the stats and persists them. */
export function recordFocusSession(stats: Stats, minutes: number): Stats {
  const today = dayKey()
  const currentWeekStart = weekStartOf()
  const next: Stats = {
    ...stats,
    history: { ...stats.history },
  }

  if (next.date !== today) {
    next.today = 0
    next.date = today
  }
  if (next.weekStart !== currentWeekStart) {
    next.week = 0
    next.weekStart = currentWeekStart
  }

  next.today += 1
  next.week += 1
  next.minutes += minutes
  next.history[today] = (next.history[today] ?? 0) + minutes

  if (next.lastDate) {
    const diff = Math.round((new Date(today).getTime() - new Date(next.lastDate).getTime()) / 86_400_000)
    if (diff === 1) next.streak += 1
    else if (diff > 1) next.streak = 1
    // diff === 0: second session today, streak unchanged
  } else {
    next.streak = 1
  }
  next.lastDate = today
  next.date = today
  next.weekStart = weekStartOf()

  saveStats(next)
  return next
}

export interface ChartDay {
  label: string
  minutes: number
  isToday: boolean
}

export function lastNDays(stats: Stats, lang: Lang, daysCount: number): ChartDay[] {
  const out: ChartDay[] = []
  const now = new Date()
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = dayKey(d)
    const label =
      daysCount <= 7
        ? d.toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-GB', { weekday: 'short' })
        : d.toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-GB', { day: 'numeric', month: 'numeric' })
    out.push({
      label,
      minutes: Math.round(stats.history[key] ?? 0),
      isToday: i === 0,
    })
  }
  return out
}

export function last7Days(stats: Stats, lang: Lang): ChartDay[] {
  return lastNDays(stats, lang, 7)
}

export function sumMinutes(days: ChartDay[]): number {
  return days.reduce((acc, d) => acc + d.minutes, 0)
}

export interface HeatmapDay {
  dateKey: string
  dateLabel: string
  minutes: number
  level: 0 | 1 | 2 | 3 | 4
  isToday: boolean
}

export function generateHeatmap(stats: Stats, lang: Lang, count = 30): HeatmapDay[] {
  const out: HeatmapDay[] = []
  const now = new Date()
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = dayKey(d)
    const minutes = Math.round(stats.history[key] ?? 0)

    let level: 0 | 1 | 2 | 3 | 4 = 0
    if (minutes > 100) level = 4
    else if (minutes > 50) level = 3
    else if (minutes > 25) level = 2
    else if (minutes > 0) level = 1

    out.push({
      dateKey: key,
      dateLabel: d.toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }),
      minutes,
      level,
      isToday: i === 0,
    })
  }
  return out
}

export interface TaskBreakdownItem {
  name: string
  minutes: number
  percentage: number
}

export function aggregateTaskBreakdown(
  sessions: SessionLogEntry[],
  fallbackName: string,
  limit = 5,
): TaskBreakdownItem[] {
  if (sessions.length === 0) return []
  const totals = new Map<string, number>()
  let grandTotal = 0

  for (const s of sessions) {
    const taskName = s.task && s.task.trim() !== '' ? s.task.trim() : fallbackName
    totals.set(taskName, (totals.get(taskName) ?? 0) + s.minutes)
    grandTotal += s.minutes
  }

  if (grandTotal === 0) return []

  const sorted = Array.from(totals.entries()).sort((a, b) => b[1] - a[1])
  const top = sorted.slice(0, limit)

  return top.map(([name, minutes]) => ({
    name,
    minutes,
    percentage: Math.round((minutes / grandTotal) * 100),
  }))
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'

export interface ProductivityInsights {
  peakTime: TimeOfDay | null
  avgMinutesPerActiveDay: number
  totalSessions: number
}

export function calculateInsights(sessions: SessionLogEntry[]): ProductivityInsights {
  if (sessions.length === 0) {
    return { peakTime: null, avgMinutesPerActiveDay: 0, totalSessions: 0 }
  }

  const timeBuckets: Record<TimeOfDay, number> = {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0,
  }

  const daysWithMinutes = new Map<string, number>()

  for (const s of sessions) {
    const d = new Date(s.date)
    const hour = d.getHours()
    if (hour >= 6 && hour < 12) timeBuckets.morning += 1
    else if (hour >= 12 && hour < 18) timeBuckets.afternoon += 1
    else if (hour >= 18 && hour < 24) timeBuckets.evening += 1
    else timeBuckets.night += 1

    const key = d.toDateString()
    daysWithMinutes.set(key, (daysWithMinutes.get(key) ?? 0) + s.minutes)
  }

  let peakTime: TimeOfDay = 'morning'
  let maxCount = -1
  for (const [bucket, count] of Object.entries(timeBuckets) as [TimeOfDay, number][]) {
    if (count > maxCount) {
      maxCount = count
      peakTime = bucket
    }
  }

  const totalActiveDays = daysWithMinutes.size || 1
  const totalMinutes = Array.from(daysWithMinutes.values()).reduce((acc, m) => acc + m, 0)
  const avgMinutesPerActiveDay = Math.round(totalMinutes / totalActiveDays)

  return {
    peakTime: maxCount > 0 ? peakTime : null,
    avgMinutesPerActiveDay,
    totalSessions: sessions.length,
  }
}
