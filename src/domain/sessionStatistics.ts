import type { StatsV2 } from '../types'
import { calendarDayNumber, weekStartOf } from './calendar'

/** Credit the completion day while keeping the visible counters relative to now. */
export function creditFocusSession(stats: StatsV2, minutes: number, completedAt: Date, now: Date): StatsV2 {
  const today = now.toDateString()
  const completedDay = completedAt.toDateString()
  const week = weekStartOf(now)
  const next: StatsV2 = {
    ...stats,
    date: today,
    weekStart: week,
    today: (stats.date === today ? stats.today : 0) + (completedDay === today ? 1 : 0),
    week: (stats.weekStart === week ? stats.week : 0) + (weekStartOf(completedAt) === week ? 1 : 0),
    minutes: stats.minutes + minutes,
    history: { ...stats.history, [completedDay]: (stats.history[completedDay] ?? 0) + minutes },
  }

  const previousDay = stats.lastDate ? new Date(stats.lastDate) : null
  const gap = previousDay ? calendarDayNumber(completedAt) - calendarDayNumber(previousDay) : null
  if (gap === null || gap > 1) next.streak = 1
  else if (gap === 1) next.streak = stats.streak + 1
  // A late completion must not move the latest active day backwards.
  if (gap === null || gap >= 0) next.lastDate = completedDay
  return next
}
