import { describe, expect, it } from 'vitest'
import type { Stats } from '../types'
import {
  aggregateTaskBreakdown,
  calculateInsights,
  generateHeatmap,
  last7Days,
  lastNDays,
  recordFocusSession,
  sumMinutes,
} from './stats'
import { weekStartOf } from './storage'

function baseStats(): Stats {
  return {
    today: 0,
    week: 0,
    streak: 0,
    minutes: 0,
    date: new Date().toDateString(),
    weekStart: weekStartOf(),
    lastDate: null,
    history: {},
  }
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toDateString()
}

describe('recordFocusSession', () => {
  it('starts a streak of 1 on the first session', () => {
    const next = recordFocusSession(baseStats(), 25)
    expect(next.streak).toBe(1)
    expect(next.today).toBe(1)
    expect(next.week).toBe(1)
    expect(next.minutes).toBe(25)
  })

  it('does not extend the streak twice on the same day', () => {
    let stats = recordFocusSession(baseStats(), 25)
    stats = recordFocusSession(stats, 25)
    expect(stats.streak).toBe(1)
    expect(stats.today).toBe(2)
    expect(stats.minutes).toBe(50)
  })

  it('accumulates minutes in the history per day', () => {
    let stats = recordFocusSession(baseStats(), 25)
    stats = recordFocusSession(stats, 30)
    const today = new Date().toDateString()
    expect(stats.history[today]).toBe(55)
  })

  it('extends the streak on consecutive days', () => {
    const stats = baseStats()
    stats.streak = 1
    stats.lastDate = daysAgo(1)
    const next = recordFocusSession(stats, 25)
    expect(next.streak).toBe(2)
  })

  it('resets the streak after a missed day', () => {
    const stats = baseStats()
    stats.streak = 7
    stats.lastDate = daysAgo(3)
    const next = recordFocusSession(stats, 25)
    expect(next.streak).toBe(1)
  })

  it('rolls a stale today counter when the app stayed open past midnight', () => {
    const stats = baseStats()
    stats.today = 5
    stats.date = 'Fri Jan 05 2001'
    const next = recordFocusSession(stats, 25)
    expect(next.today).toBe(1)
    expect(next.date).toBe(new Date().toDateString())
  })

  it('rolls a stale week counter when the week boundary was crossed mid-session', () => {
    const stats = baseStats()
    stats.week = 40
    stats.weekStart = 'Mon Jan 01 2001'
    const next = recordFocusSession(stats, 25)
    expect(next.week).toBe(1)
    expect(next.weekStart).toBe(weekStartOf())
  })
})

describe('last7Days', () => {
  it('returns exactly 7 entries with today last', () => {
    const stats = baseStats()
    const today = new Date().toDateString()
    stats.history[today] = 40
    stats.history[daysAgo(1)] = 20
    const days = last7Days(stats, 'en')
    expect(days).toHaveLength(7)
    expect(days[6].isToday).toBe(true)
    expect(days[6].minutes).toBe(40)
    expect(days[5].minutes).toBe(20)
  })

  it('fills missing days with zero', () => {
    const days = last7Days(baseStats(), 'pl')
    expect(days.every((d) => d.minutes === 0)).toBe(true)
  })
})

describe('sumMinutes', () => {
  it('sums the series', () => {
    const days = last7Days(baseStats(), 'en')
    expect(sumMinutes(days)).toBe(0)
  })
})

describe('lastNDays', () => {
  it('returns requested number of days', () => {
    const stats = baseStats()
    const days30 = lastNDays(stats, 'en', 30)
    expect(days30).toHaveLength(30)
    expect(days30[29].isToday).toBe(true)
  })
})

describe('generateHeatmap', () => {
  it('generates 30 days with appropriate intensity levels', () => {
    const stats = baseStats()
    const today = new Date().toDateString()
    stats.history[today] = 120 // level 4
    stats.history[daysAgo(1)] = 60 // level 3
    stats.history[daysAgo(2)] = 30 // level 2
    stats.history[daysAgo(3)] = 15 // level 1
    stats.history[daysAgo(4)] = 0 // level 0

    const heatmap = generateHeatmap(stats, 'en', 30)
    expect(heatmap).toHaveLength(30)
    expect(heatmap[29].level).toBe(4)
    expect(heatmap[28].level).toBe(3)
    expect(heatmap[27].level).toBe(2)
    expect(heatmap[26].level).toBe(1)
    expect(heatmap[25].level).toBe(0)
  })
})

describe('aggregateTaskBreakdown', () => {
  it('aggregates sessions by task name and calculates percentages', () => {
    const sessions = [
      { id: '1', date: new Date().toISOString(), minutes: 60, task: 'Project A' },
      { id: '2', date: new Date().toISOString(), minutes: 30, task: 'Project A' },
      { id: '3', date: new Date().toISOString(), minutes: 10, task: null },
    ]

    const breakdown = aggregateTaskBreakdown(sessions, 'No task', 5)
    expect(breakdown).toHaveLength(2)
    expect(breakdown[0].name).toBe('Project A')
    expect(breakdown[0].minutes).toBe(90)
    expect(breakdown[0].percentage).toBe(90)
    expect(breakdown[1].name).toBe('No task')
    expect(breakdown[1].minutes).toBe(10)
    expect(breakdown[1].percentage).toBe(10)
  })

  it('returns empty array when no sessions exist', () => {
    expect(aggregateTaskBreakdown([], 'No task')).toEqual([])
  })
})

describe('calculateInsights', () => {
  it('identifies peak time of day and average minutes per active day', () => {
    const d1 = new Date()
    d1.setHours(9, 0, 0, 0) // Morning
    const d2 = new Date()
    d2.setHours(10, 30, 0, 0) // Morning

    const sessions = [
      { id: '1', date: d1.toISOString(), minutes: 25, task: 'Task 1' },
      { id: '2', date: d2.toISOString(), minutes: 25, task: 'Task 2' },
    ]

    const insights = calculateInsights(sessions)
    expect(insights.peakTime).toBe('morning')
    expect(insights.avgMinutesPerActiveDay).toBe(50)
    expect(insights.totalSessions).toBe(2)
  })

  it('handles empty sessions gracefully', () => {
    const insights = calculateInsights([])
    expect(insights.peakTime).toBeNull()
    expect(insights.avgMinutesPerActiveDay).toBe(0)
    expect(insights.totalSessions).toBe(0)
  })
})
