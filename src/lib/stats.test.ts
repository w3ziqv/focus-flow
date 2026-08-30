import { describe, expect, it } from 'vitest'
import type { Stats } from '../types'
import { last7Days, recordFocusSession, sumMinutes } from './stats'
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
