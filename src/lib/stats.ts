import type { Lang, Stats } from '../types'
import { saveStats, weekStartOf } from './storage'

function dayKey(date = new Date()): string {
  return date.toDateString()
}

/** Adds one completed focus session to the stats and persists them. */
export function recordFocusSession(stats: Stats, minutes: number): Stats {
  const today = dayKey()
  const next: Stats = {
    ...stats,
    history: { ...stats.history },
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

export function last7Days(stats: Stats, lang: Lang): ChartDay[] {
  const out: ChartDay[] = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = dayKey(d)
    out.push({
      label: d.toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-GB', { weekday: 'short' }),
      minutes: Math.round(stats.history[key] ?? 0),
      isToday: i === 0,
    })
  }
  return out
}

export function sumMinutes(days: ChartDay[]): number {
  return days.reduce((acc, d) => acc + d.minutes, 0)
}
