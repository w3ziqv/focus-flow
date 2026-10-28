import { describe, expect, it } from 'vitest'
import { creditFocusSession } from './sessionStatistics'
import { weekStartOf } from './calendar'
import type { StatsV2 } from '../types'

const empty = (now: Date): StatsV2 => ({ date: now.toDateString(), weekStart: weekStartOf(now), today: 0, week: 0, minutes: 0, streak: 0, lastDate: null, history: {} })

describe('calendar-based statistics without a persistence adapter', () => {
  it('keeps a previous-day completion in the current week but out of today', () => {
    const now = new Date(2026, 9, 27, 8)
    const ended = new Date(2026, 9, 26, 23, 59)
    const stats = empty(now)
    const next = creditFocusSession(stats, 25, ended, now)
    expect(next).toMatchObject({ today: 0, week: 1, minutes: 25, lastDate: ended.toDateString() })
    expect(next.history).toEqual({ [ended.toDateString()]: 25 })
    expect(stats.history).toEqual({})
  })
  it('uses consecutive civil days across the daylight-saving boundary', () => {
    const before = new Date(2026, 9, 24, 23, 59)
    const after = new Date(2026, 9, 25, 23, 59)
    const stats = { ...empty(after), streak: 4, lastDate: before.toDateString() }
    expect(creditFocusSession(stats, 25, after, after).streak).toBe(5)
  })
  it('does not move the latest active date backwards for a late completion', () => {
    const now = new Date(2026, 9, 27, 8)
    const stats = { ...empty(now), streak: 5, lastDate: now.toDateString() }
    const next = creditFocusSession(stats, 25, new Date(2026, 9, 25, 23, 59), now)
    expect(next.lastDate).toBe(stats.lastDate)
    expect(next.streak).toBe(5)
  })
})
