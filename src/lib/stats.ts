import type { Lang, MilestoneRecord, SessionLogEntry, SessionLogEntryV2, Stats, StatsV2 } from '../types'
import { deleteSession, loadStats, saveStats, weekStartOf } from './storage'

export const ZEN_MILESTONES: readonly [
  'the_first_step',
  'pebble_of_rhythm',
  'stone_of_stillness',
  'garden_of_flow',
  'century_of_craft',
] = [
  'the_first_step',
  'pebble_of_rhythm',
  'stone_of_stillness',
  'garden_of_flow',
  'century_of_craft',
] as const

export type ZenMilestoneId = (typeof ZEN_MILESTONES)[number]

function dayKey(date = new Date()): string {
  return date.toDateString()
}

/** Adds one completed focus session to the stats and persists them. */
export function recordFocusSession(stats: StatsV2, minutes: number): StatsV2 {
  const today = dayKey()
  const currentWeekStart = weekStartOf()
  const next: StatsV2 = {
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

/**
 * Atomically decrements statistics for a deleted session.
 * Clamps all aggregate metrics to 0 to prevent metric drift or negative totals.
 */
export function decrementStatsForSession(stats: StatsV2, session: SessionLogEntryV2): StatsV2 {
  const sessionMinutes =
    typeof session.minutes === 'number' && Number.isFinite(session.minutes) && session.minutes > 0
      ? Math.round(session.minutes)
      : 0

  const next: StatsV2 = {
    ...stats,
    history: { ...stats.history },
  }

  next.minutes = Math.max(0, next.minutes - sessionMinutes)

  const sessionDate = new Date(session.date)
  if (!Number.isNaN(sessionDate.getTime())) {
    const sessionDayKey = sessionDate.toDateString()
    const todayKey = new Date().toDateString()

    if (sessionDayKey === todayKey) {
      next.today = Math.max(0, next.today - 1)
    }

    if (weekStartOf(sessionDate) === weekStartOf(new Date())) {
      next.week = Math.max(0, next.week - 1)
    }

    const currentDayMinutes = stats.history[sessionDayKey] ?? sessionMinutes
    next.history[sessionDayKey] = Math.max(0, currentDayMinutes - sessionMinutes)
  }

  return next
}

/**
 * Coordinates atomic session deletion: removes session from storage
 * and decrements aggregate statistics in a single transaction.
 */
export function deleteSessionWithStats(sessionId: string): {
  sessions: SessionLogEntryV2[]
  stats: StatsV2
  deleted: SessionLogEntryV2 | null
} {
  const { sessions, deleted } = deleteSession(sessionId)
  const currentStats = loadStats()

  if (!deleted) {
    return {
      sessions,
      stats: currentStats,
      deleted: null,
    }
  }

  const updatedStats = decrementStatsForSession(currentStats, deleted)
  saveStats(updatedStats)

  return {
    sessions,
    stats: updatedStats,
    deleted,
  }
}

/**
 * Evaluates the 5 Zen seals deterministically and idempotently.
 * Preserves existing unlock timestamps and seen statuses.
 */
export function evaluateMilestones(
  current: MilestoneRecord[] | undefined,
  stats: StatsV2,
  sessions: SessionLogEntryV2[],
): MilestoneRecord[] {
  const existingMap = new Map<string, MilestoneRecord>()
  if (Array.isArray(current)) {
    for (const record of current) {
      if (record && typeof record.id === 'string') {
        existingMap.set(record.id, record)
      }
    }
  }

  const results: MilestoneRecord[] = []
  const nowIso = new Date().toISOString()

  // The First Step: first completed session
  const hasFirstStep = sessions.length > 0 || stats.minutes > 0 || existingMap.has('the_first_step')
  if (hasFirstStep) {
    results.push(
      existingMap.get('the_first_step') ?? {
        id: 'the_first_step',
        unlockedAt: nowIso,
        seen: false,
      },
    )
  }

  // Pebble of Rhythm: 3 active focus days within a single calendar week
  let hasPebbleOfRhythm = existingMap.has('pebble_of_rhythm')
  if (!hasPebbleOfRhythm) {
    const weekDaysMap = new Map<string, Set<string>>()
    for (const s of sessions) {
      const d = new Date(s.date)
      if (!Number.isNaN(d.getTime()) && s.minutes > 0) {
        const weekKey = weekStartOf(d)
        let daySet = weekDaysMap.get(weekKey)
        if (!daySet) {
          daySet = new Set<string>()
          weekDaysMap.set(weekKey, daySet)
        }
        daySet.add(d.toDateString())
      }
    }
    for (const daysSet of weekDaysMap.values()) {
      if (daysSet.size >= 3) {
        hasPebbleOfRhythm = true
        break
      }
    }
  }
  if (hasPebbleOfRhythm) {
    results.push(
      existingMap.get('pebble_of_rhythm') ?? {
        id: 'pebble_of_rhythm',
        unlockedAt: nowIso,
        seen: false,
      },
    )
  }

  const totalMinutes = stats.minutes

  // Stone of Stillness: 10 cumulative hours (600 minutes)
  if (totalMinutes >= 600 || existingMap.has('stone_of_stillness')) {
    results.push(
      existingMap.get('stone_of_stillness') ?? {
        id: 'stone_of_stillness',
        unlockedAt: nowIso,
        seen: false,
      },
    )
  }

  // Garden of Flow: 50 cumulative hours (3000 minutes)
  if (totalMinutes >= 3000 || existingMap.has('garden_of_flow')) {
    results.push(
      existingMap.get('garden_of_flow') ?? {
        id: 'garden_of_flow',
        unlockedAt: nowIso,
        seen: false,
      },
    )
  }

  // Century of Craft: 100 cumulative hours (6000 minutes)
  if (totalMinutes >= 6000 || existingMap.has('century_of_craft')) {
    results.push(
      existingMap.get('century_of_craft') ?? {
        id: 'century_of_craft',
        unlockedAt: nowIso,
        seen: false,
      },
    )
  }

  return results
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
