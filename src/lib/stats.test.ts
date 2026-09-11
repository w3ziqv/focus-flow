import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MilestoneRecord, SessionLogEntryV2, Stats, StatsV2 } from '../types'
import {
  aggregateTaskBreakdown,
  calculateInsights,
  decrementStatsForSession,
  deleteSessionWithStats,
  evaluateMilestones,
  generateHeatmap,
  last7Days,
  lastNDays,
  recordFocusSession,
  sumMinutes,
  ZEN_MILESTONES,
} from './stats'
import { loadSessions, loadStats, saveSessions, saveStats, weekStartOf } from './storage'

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

// ============================================================================
// Milestone 1 Additions: Atomic Decrements & Milestone Engine
// ============================================================================

describe('decrementStatsForSession', () => {
  beforeEach(() => {
    // Lock clock to Thursday 2026-09-10 (Week start: Monday 2026-09-07)
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-10T14:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('decrements minutes, today, week, and history when deleting a session completed today', () => {
    const todayStr = new Date().toDateString()
    const stats: StatsV2 = {
      today: 3,
      week: 7,
      streak: 4,
      minutes: 150,
      date: todayStr,
      weekStart: weekStartOf(),
      lastDate: todayStr,
      history: { [todayStr]: 75 },
    }

    const sessionToday: SessionLogEntryV2 = {
      id: 'sess_today',
      date: '2026-09-10T10:00:00.000Z',
      minutes: 25,
      task: 'Today session',
    }

    const next = decrementStatsForSession(stats, sessionToday)
    expect(next.today).toBe(2)
    expect(next.week).toBe(6)
    expect(next.minutes).toBe(125)
    expect(next.history[todayStr]).toBe(50)
  })

  it('decrements minutes, week, and history but leaves today unchanged when deleting a session from earlier this week', () => {
    const todayStr = new Date().toDateString()
    const tuesdayStr = new Date('2026-09-08T10:00:00.000Z').toDateString()
    const stats: StatsV2 = {
      today: 2,
      week: 5,
      streak: 3,
      minutes: 125,
      date: todayStr,
      weekStart: weekStartOf(),
      lastDate: todayStr,
      history: {
        [todayStr]: 50,
        [tuesdayStr]: 50,
      },
    }

    const tuesdaySession: SessionLogEntryV2 = {
      id: 'sess_tue',
      date: '2026-09-08T10:00:00.000Z',
      minutes: 25,
      task: 'Tuesday session',
    }

    const next = decrementStatsForSession(stats, tuesdaySession)
    expect(next.today).toBe(2) // UNCHANGED!
    expect(next.week).toBe(4) // Decremented
    expect(next.minutes).toBe(100)
    expect(next.history[tuesdayStr]).toBe(25)
    expect(next.history[todayStr]).toBe(50) // UNCHANGED
  })

  it('decrements minutes and history but leaves today and week unchanged when deleting a session from a previous week', () => {
    const todayStr = new Date().toDateString()
    const lastWeekStr = new Date('2026-08-31T10:00:00.000Z').toDateString()
    const stats: StatsV2 = {
      today: 2,
      week: 5,
      streak: 3,
      minutes: 300,
      date: todayStr,
      weekStart: weekStartOf(),
      lastDate: todayStr,
      history: {
        [todayStr]: 50,
        [lastWeekStr]: 50,
      },
    }

    const lastWeekSession: SessionLogEntryV2 = {
      id: 'sess_last_week',
      date: '2026-08-31T10:00:00.000Z',
      minutes: 25,
      task: 'Old session',
    }

    const next = decrementStatsForSession(stats, lastWeekSession)
    expect(next.today).toBe(2) // UNCHANGED
    expect(next.week).toBe(5) // UNCHANGED
    expect(next.minutes).toBe(275)
    expect(next.history[lastWeekStr]).toBe(25)
  })

  it('decrements minutes and history but leaves today and week unchanged when deleting a session from a previous year', () => {
    const todayStr = new Date().toDateString()
    const lastYearStr = new Date('2025-05-15T10:00:00.000Z').toDateString()
    const stats: StatsV2 = {
      today: 1,
      week: 2,
      streak: 1,
      minutes: 500,
      date: todayStr,
      weekStart: weekStartOf(),
      lastDate: todayStr,
      history: {
        [todayStr]: 25,
        [lastYearStr]: 50,
      },
    }

    const lastYearSession: SessionLogEntryV2 = {
      id: 'sess_last_year',
      date: '2025-05-15T10:00:00.000Z',
      minutes: 50,
      task: 'Historical session',
    }

    const next = decrementStatsForSession(stats, lastYearSession)
    expect(next.today).toBe(1) // UNCHANGED
    expect(next.week).toBe(2) // UNCHANGED
    expect(next.minutes).toBe(450)
    expect(next.history[lastYearStr]).toBe(0)
  })

  it('clamps all metrics to 0 and never allows negative totals (underflow defense)', () => {
    const todayStr = new Date().toDateString()
    const stats: StatsV2 = {
      today: 0,
      week: 0,
      streak: 0,
      minutes: 10,
      date: todayStr,
      weekStart: weekStartOf(),
      lastDate: todayStr,
      history: { [todayStr]: 5 },
    }

    const sessionOver: SessionLogEntryV2 = {
      id: 'sess_over',
      date: '2026-09-10T10:00:00.000Z',
      minutes: 25,
      task: 'Large session',
    }

    const next = decrementStatsForSession(stats, sessionOver)
    expect(next.today).toBe(0) // Never -1
    expect(next.week).toBe(0) // Never -1
    expect(next.minutes).toBe(0) // 10 - 25 clamped to 0
    expect(next.history[todayStr]).toBe(0) // 5 - 25 clamped to 0
  })

  it('does not mutate the input stats object (immutability check)', () => {
    const todayStr = new Date().toDateString()
    const stats: StatsV2 = {
      today: 2,
      week: 4,
      streak: 2,
      minutes: 50,
      date: todayStr,
      weekStart: weekStartOf(),
      lastDate: todayStr,
      history: { [todayStr]: 50 },
    }

    const session: SessionLogEntryV2 = {
      id: 'sess_1',
      date: '2026-09-10T10:00:00.000Z',
      minutes: 25,
      task: 'Task',
    }

    const next = decrementStatsForSession(stats, session)
    expect(stats.minutes).toBe(50)
    expect(stats.today).toBe(2)
    expect(stats.history[todayStr]).toBe(50)
    expect(next).not.toBe(stats)
  })
})

describe('deleteSessionWithStats', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-10T14:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('atomically coordinates session deletion and stats persistence', () => {
    const todayStr = new Date().toDateString()
    const s1: SessionLogEntryV2 = {
      id: 's_target',
      date: '2026-09-10T10:00:00.000Z',
      minutes: 25,
      task: 'To delete',
    }
    const s2: SessionLogEntryV2 = {
      id: 's_keep',
      date: '2026-09-09T10:00:00.000Z',
      minutes: 50,
      task: 'To keep',
    }
    saveSessions([s1, s2])

    const initialStats: StatsV2 = {
      today: 1,
      week: 2,
      streak: 2,
      minutes: 75,
      date: todayStr,
      weekStart: weekStartOf(),
      lastDate: todayStr,
      history: {
        [todayStr]: 25,
        [new Date('2026-09-09T10:00:00.000Z').toDateString()]: 50,
      },
    }
    saveStats(initialStats)

    const result = deleteSessionWithStats('s_target')
    expect(result.deleted).toEqual(s1)
    expect(result.sessions).toHaveLength(1)
    expect(result.sessions[0].id).toBe('s_keep')
    expect(result.stats.minutes).toBe(50)
    expect(result.stats.today).toBe(0)
    expect(result.stats.week).toBe(1)

    // Verify localStorage coordination
    expect(loadSessions()).toHaveLength(1)
    expect(loadStats().minutes).toBe(50)
    expect(loadStats().today).toBe(0)
  })

  it('returns deleted: null and untouched state when session id is not found', () => {
    const s1: SessionLogEntryV2 = { id: 's1', date: '2026-09-10T10:00:00.000Z', minutes: 25, task: 'Keep' }
    saveSessions([s1])

    const initialStats: StatsV2 = {
      today: 1,
      week: 1,
      streak: 1,
      minutes: 25,
      date: new Date().toDateString(),
      weekStart: weekStartOf(),
      lastDate: new Date().toDateString(),
      history: {},
    }
    saveStats(initialStats)

    const result = deleteSessionWithStats('non_existent')
    expect(result.deleted).toBeNull()
    expect(result.sessions).toEqual([s1])
    expect(result.stats.minutes).toBe(25)
    expect(loadSessions()).toHaveLength(1)
  })
})

describe('evaluateMilestones', () => {
  it('returns empty array when user has 0 sessions and 0 minutes', () => {
    const stats: StatsV2 = {
      today: 0,
      week: 0,
      streak: 0,
      minutes: 0,
      date: new Date().toDateString(),
      weekStart: weekStartOf(),
      lastDate: null,
      history: {},
    }
    expect(evaluateMilestones([], stats, [])).toEqual([])
    expect(evaluateMilestones(undefined, stats, [])).toEqual([])
  })

  it('unlocks The First Step seal on first completed session', () => {
    const stats: StatsV2 = {
      today: 1,
      week: 1,
      streak: 1,
      minutes: 25,
      date: new Date().toDateString(),
      weekStart: weekStartOf(),
      lastDate: new Date().toDateString(),
      history: {},
    }
    const sessions: SessionLogEntryV2[] = [
      { id: 's1', date: '2026-09-10T10:00:00.000Z', minutes: 25, task: 'First sprint' },
    ]

    const milestones = evaluateMilestones([], stats, sessions)
    expect(milestones).toHaveLength(1)
    expect(milestones[0].id).toBe('the_first_step')
    expect(milestones[0].seen).toBe(false)
    expect(typeof milestones[0].unlockedAt).toBe('string')
  })

  it('unlocks Pebble of Rhythm when 3 active focus days occur in the same calendar week', () => {
    const sessions: SessionLogEntryV2[] = [
      { id: 's1', date: '2026-09-07T10:00:00.000Z', minutes: 25, task: 'Mon' },
      { id: 's2', date: '2026-09-09T10:00:00.000Z', minutes: 25, task: 'Wed' },
      { id: 's3', date: '2026-09-11T10:00:00.000Z', minutes: 25, task: 'Fri' },
    ]
    const stats: StatsV2 = {
      today: 1,
      week: 3,
      streak: 1,
      minutes: 75,
      date: new Date('2026-09-11T10:00:00.000Z').toDateString(),
      weekStart: weekStartOf(new Date('2026-09-07T10:00:00.000Z')),
      lastDate: new Date('2026-09-11T10:00:00.000Z').toDateString(),
      history: {},
    }

    const milestones = evaluateMilestones([], stats, sessions)
    const ids = milestones.map((m) => m.id)
    expect(ids).toContain('the_first_step')
    expect(ids).toContain('pebble_of_rhythm')
  })

  it('does NOT unlock Pebble of Rhythm if 3 sessions are logged on the SAME day', () => {
    const sessions: SessionLogEntryV2[] = [
      { id: 's1', date: '2026-09-07T09:00:00.000Z', minutes: 25, task: 'Mon 1' },
      { id: 's2', date: '2026-09-07T11:00:00.000Z', minutes: 25, task: 'Mon 2' },
      { id: 's3', date: '2026-09-07T14:00:00.000Z', minutes: 25, task: 'Mon 3' },
    ]
    const stats: StatsV2 = {
      today: 3,
      week: 3,
      streak: 1,
      minutes: 75,
      date: new Date('2026-09-07T14:00:00.000Z').toDateString(),
      weekStart: weekStartOf(new Date('2026-09-07T09:00:00.000Z')),
      lastDate: new Date('2026-09-07T14:00:00.000Z').toDateString(),
      history: {},
    }

    const milestones = evaluateMilestones([], stats, sessions)
    const ids = milestones.map((m) => m.id)
    expect(ids).toContain('the_first_step')
    expect(ids).not.toContain('pebble_of_rhythm')
  })

  it('does NOT unlock Pebble of Rhythm if 3 active days span different calendar weeks', () => {
    const sessions: SessionLogEntryV2[] = [
      { id: 's1', date: '2026-08-24T10:00:00.000Z', minutes: 25, task: 'Week 1' },
      { id: 's2', date: '2026-08-31T10:00:00.000Z', minutes: 25, task: 'Week 2' },
      { id: 's3', date: '2026-09-07T10:00:00.000Z', minutes: 25, task: 'Week 3' },
    ]
    const stats: StatsV2 = {
      today: 1,
      week: 1,
      streak: 3,
      minutes: 75,
      date: new Date('2026-09-07T10:00:00.000Z').toDateString(),
      weekStart: weekStartOf(new Date('2026-09-07T10:00:00.000Z')),
      lastDate: new Date('2026-09-07T10:00:00.000Z').toDateString(),
      history: {},
    }

    const milestones = evaluateMilestones([], stats, sessions)
    const ids = milestones.map((m) => m.id)
    expect(ids).toContain('the_first_step')
    expect(ids).not.toContain('pebble_of_rhythm')
  })

  it('unlocks Stone of Stillness at 600 minutes (10 hours)', () => {
    const makeStats = (mins: number): StatsV2 => ({
      today: 1,
      week: 1,
      streak: 1,
      minutes: mins,
      date: new Date().toDateString(),
      weekStart: weekStartOf(),
      lastDate: new Date().toDateString(),
      history: {},
    })

    const at599 = evaluateMilestones([], makeStats(599), [{ id: 's1', date: '2026-09-10T10:00:00.000Z', minutes: 599, task: null }])
    expect(at599.map((m) => m.id)).not.toContain('stone_of_stillness')

    const at600 = evaluateMilestones([], makeStats(600), [{ id: 's1', date: '2026-09-10T10:00:00.000Z', minutes: 600, task: null }])
    expect(at600.map((m) => m.id)).toContain('stone_of_stillness')
  })

  it('unlocks Garden of Flow at 3000 minutes (50 hours)', () => {
    const makeStats = (mins: number): StatsV2 => ({
      today: 1,
      week: 1,
      streak: 1,
      minutes: mins,
      date: new Date().toDateString(),
      weekStart: weekStartOf(),
      lastDate: new Date().toDateString(),
      history: {},
    })

    const at2999 = evaluateMilestones([], makeStats(2999), [{ id: 's1', date: '2026-09-10T10:00:00.000Z', minutes: 2999, task: null }])
    expect(at2999.map((m) => m.id)).not.toContain('garden_of_flow')

    const at3000 = evaluateMilestones([], makeStats(3000), [{ id: 's1', date: '2026-09-10T10:00:00.000Z', minutes: 3000, task: null }])
    expect(at3000.map((m) => m.id)).toContain('garden_of_flow')
  })

  it('unlocks Century of Craft at 6000 minutes (100 hours)', () => {
    const makeStats = (mins: number): StatsV2 => ({
      today: 1,
      week: 1,
      streak: 1,
      minutes: mins,
      date: new Date().toDateString(),
      weekStart: weekStartOf(),
      lastDate: new Date().toDateString(),
      history: {},
    })

    const at5999 = evaluateMilestones([], makeStats(5999), [{ id: 's1', date: '2026-09-10T10:00:00.000Z', minutes: 5999, task: null }])
    expect(at5999.map((m) => m.id)).not.toContain('century_of_craft')

    const at6000 = evaluateMilestones([], makeStats(6000), [{ id: 's1', date: '2026-09-10T10:00:00.000Z', minutes: 6000, task: null }])
    expect(at6000.map((m) => m.id)).toContain('century_of_craft')
  })

  it('unlocks multiple milestone seals at once when criteria are simultaneously satisfied', () => {
    const sessions: SessionLogEntryV2[] = [
      { id: 's1', date: '2026-09-07T10:00:00.000Z', minutes: 2000, task: 'Mon' },
      { id: 's2', date: '2026-09-09T10:00:00.000Z', minutes: 2000, task: 'Wed' },
      { id: 's3', date: '2026-09-11T10:00:00.000Z', minutes: 2000, task: 'Fri' },
    ]
    const stats: StatsV2 = {
      today: 1,
      week: 3,
      streak: 3,
      minutes: 6000,
      date: new Date('2026-09-11T10:00:00.000Z').toDateString(),
      weekStart: weekStartOf(new Date('2026-09-07T10:00:00.000Z')),
      lastDate: new Date('2026-09-11T10:00:00.000Z').toDateString(),
      history: {},
    }

    const milestones = evaluateMilestones([], stats, sessions)
    expect(milestones).toHaveLength(5)
    const ids = milestones.map((m) => m.id)
    expect(ids).toContain('the_first_step')
    expect(ids).toContain('pebble_of_rhythm')
    expect(ids).toContain('stone_of_stillness')
    expect(ids).toContain('garden_of_flow')
    expect(ids).toContain('century_of_craft')
  })

  it('preserves existing unlock timestamps and seen status (idempotency check)', () => {
    const originalTimestamp = '2026-01-01T10:00:00.000Z'
    const existing: MilestoneRecord[] = [
      { id: 'the_first_step', unlockedAt: originalTimestamp, seen: true },
    ]

    const stats: StatsV2 = {
      today: 1,
      week: 1,
      streak: 1,
      minutes: 600,
      date: new Date().toDateString(),
      weekStart: weekStartOf(),
      lastDate: new Date().toDateString(),
      history: {},
    }
    const sessions: SessionLogEntryV2[] = [
      { id: 's1', date: '2026-09-10T10:00:00.000Z', minutes: 600, task: 'Deep Work' },
    ]

    const reevaluated = evaluateMilestones(existing, stats, sessions)
    expect(reevaluated).toHaveLength(2)

    const firstStep = reevaluated.find((m) => m.id === 'the_first_step')
    expect(firstStep?.unlockedAt).toBe(originalTimestamp) // EXACT timestamp preserved!
    expect(firstStep?.seen).toBe(true) // Seen status preserved!

    const stone = reevaluated.find((m) => m.id === 'stone_of_stillness')
    expect(stone?.seen).toBe(false)
    expect(typeof stone?.unlockedAt).toBe('string')
  })
})

describe('ZEN_MILESTONES', () => {
  it('contains the 5 expected milestone identifiers in defined order', () => {
    expect(ZEN_MILESTONES).toEqual([
      'the_first_step',
      'pebble_of_rhythm',
      'stone_of_stillness',
      'garden_of_flow',
      'century_of_craft',
    ])
  })
})


