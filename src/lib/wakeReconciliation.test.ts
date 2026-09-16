import { beforeEach, describe, expect, it } from 'vitest'
import type { SessionSnapshotV2, Settings, StatsV2 } from '../types'
import { reconcileExpiredSession } from './wakeReconciliation'
import { loadSessions, loadStats } from './storage'

function makeSettings(overrides?: Partial<Settings>): Settings {
  return {
    focus: 25,
    short: 5,
    long: 15,
    rounds: 4,
    autoStart: false,
    ...overrides,
  }
}

function makeStats(overrides?: Partial<StatsV2>): StatsV2 {
  const today = new Date().toDateString()
  return {
    today: 0,
    week: 0,
    streak: 0,
    minutes: 0,
    date: today,
    weekStart: today,
    lastDate: null,
    history: {},
    ...overrides,
  }
}

describe('reconcileExpiredSession', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('reconciles active focus session expired past endTs', () => {
    const now = 1_700_000_000_000
    const endTs = now - 60_000 // ended 1 minute ago
    const snapshot: SessionSnapshotV2 = {
      mode: 'focus',
      round: 0,
      running: true,
      endTs,
      remainingMs: 0,
      task: 'Write specifications',
      taskDone: false,
      checklist: [
        { id: 'c1', text: 'Step 1', completed: true },
        { id: 'c2', text: 'Step 2', completed: false },
      ],
    }
    const settings = makeSettings({ focus: 25, rounds: 4 })
    const initialStats = makeStats()

    const result = reconcileExpiredSession(snapshot, settings, initialStats, now, 'en')

    expect(result.reconciled).toBe(true)
    expect(result.elapsedMinutes).toBe(25)
    expect(result.newMode).toBe('short')
    expect(result.newRound).toBe(1)
    expect(result.notice).toBe('Focus session completed while you were away.')
    expect(result.newSnapshot).toEqual({
      mode: 'short',
      round: 1,
      running: false,
      endTs: null,
      remainingMs: 5 * 60_000,
      task: 'Write specifications',
      taskDone: true,
      checklist: [],
    })

    // Check stats credited
    expect(result.newStats.minutes).toBe(25)
    expect(result.newStats.today).toBe(1)

    // Check persisted session log
    const sessions = loadSessions()
    expect(sessions).toHaveLength(1)
    expect(sessions[0].minutes).toBe(25)
    expect(sessions[0].task).toBe('Write specifications')
    expect(sessions[0].date).toBe(new Date(endTs).toISOString())
    expect(sessions[0].checklist).toEqual([
      { id: 'c1', text: 'Step 1', completed: true },
      { id: 'c2', text: 'Step 2', completed: false },
    ])

    // Check persisted stats in storage
    const storedStats = loadStats()
    expect(storedStats.minutes).toBe(25)
    expect(storedStats.today).toBe(1)

    // Idempotency check: running again with newSnapshot should NOT reconcile or double-credit
    const secondRun = reconcileExpiredSession(result.newSnapshot, settings, result.newStats, now, 'en')
    expect(secondRun.reconciled).toBe(false)
    expect(secondRun.elapsedMinutes).toBeUndefined()
    expect(secondRun.notice).toBeNull()
    expect(loadSessions()).toHaveLength(1)
    expect(loadStats().minutes).toBe(25)
  })

  it('advances to long break when the final focus round completes', () => {
    const now = 1_700_000_000_000
    const endTs = now - 5_000
    const snapshot: SessionSnapshotV2 = {
      mode: 'focus',
      round: 3, // 4th round (0, 1, 2, 3)
      running: true,
      endTs,
      remainingMs: 0,
      task: 'Final stretch',
      taskDone: false,
    }
    const settings = makeSettings({ focus: 30, long: 20, rounds: 4 })
    const initialStats = makeStats()

    const result = reconcileExpiredSession(snapshot, settings, initialStats, now, 'en')

    expect(result.reconciled).toBe(true)
    expect(result.newMode).toBe('long')
    expect(result.newRound).toBe(0)
    expect(result.newSnapshot?.remainingMs).toBe(20 * 60_000)
  })

  it('reconciles active break session expired past endTs without crediting stats or emitting notice', () => {
    const now = 1_700_000_000_000
    const endTs = now - 10_000
    const snapshot: SessionSnapshotV2 = {
      mode: 'short',
      round: 1,
      running: true,
      endTs,
      remainingMs: 0,
      task: '',
      taskDone: false,
    }
    const settings = makeSettings({ focus: 25, short: 5 })
    const initialStats = makeStats({ minutes: 50, today: 2 })

    const result = reconcileExpiredSession(snapshot, settings, initialStats, now, 'en')

    expect(result.reconciled).toBe(true)
    expect(result.elapsedMinutes).toBeUndefined()
    expect(result.newMode).toBe('focus')
    expect(result.newRound).toBe(1)
    expect(result.notice).toBeNull()
    expect(result.newSnapshot?.remainingMs).toBe(25 * 60_000)

    // No stats credited
    expect(result.newStats.minutes).toBe(50)
    expect(result.newStats.today).toBe(2)

    // No session added to storage
    expect(loadSessions()).toHaveLength(0)
  })

  it('reconciles long break session expired past endTs', () => {
    const now = 1_700_000_000_000
    const endTs = now - 10_000
    const snapshot: SessionSnapshotV2 = {
      mode: 'long',
      round: 0,
      running: true,
      endTs,
      remainingMs: 0,
      task: '',
      taskDone: false,
    }
    const settings = makeSettings({ focus: 25, long: 15 })
    const initialStats = makeStats()

    const result = reconcileExpiredSession(snapshot, settings, initialStats, now, 'en')

    expect(result.reconciled).toBe(true)
    expect(result.newMode).toBe('focus')
    expect(result.notice).toBeNull()
    expect(result.newSnapshot?.remainingMs).toBe(25 * 60_000)
    expect(loadSessions()).toHaveLength(0)
  })

  it('does not reconcile if active session has not yet expired (endTs > now)', () => {
    const now = 1_700_000_000_000
    const endTs = now + 120_000 // expires in 2 minutes
    const snapshot: SessionSnapshotV2 = {
      mode: 'focus',
      round: 0,
      running: true,
      endTs,
      remainingMs: 120_000,
      task: 'Still running',
      taskDone: false,
    }
    const settings = makeSettings()
    const initialStats = makeStats()

    const result = reconcileExpiredSession(snapshot, settings, initialStats, now, 'en')

    expect(result.reconciled).toBe(false)
    expect(result.newSnapshot).toBe(snapshot)
    expect(result.notice).toBeNull()
    expect(loadSessions()).toHaveLength(0)
  })

  it('does not reconcile if snapshot was not running', () => {
    const now = 1_700_000_000_000
    const snapshot: SessionSnapshotV2 = {
      mode: 'focus',
      round: 0,
      running: false,
      endTs: null,
      remainingMs: 25 * 60_000,
      task: '',
      taskDone: false,
    }
    const settings = makeSettings()
    const initialStats = makeStats()

    const result = reconcileExpiredSession(snapshot, settings, initialStats, now, 'en')

    expect(result.reconciled).toBe(false)
    expect(result.newSnapshot).toBe(snapshot)
    expect(result.notice).toBeNull()
  })

  it('does not reconcile if snapshot is null', () => {
    const settings = makeSettings()
    const initialStats = makeStats()

    const result = reconcileExpiredSession(null, settings, initialStats)

    expect(result.reconciled).toBe(false)
    expect(result.newSnapshot).toBeNull()
    expect(result.newMode).toBe('focus')
    expect(result.newRound).toBe(0)
    expect(result.notice).toBeNull()
  })

  it('generates Polish notice when lang is pl', () => {
    const now = 1_700_000_000_000
    const endTs = now - 1_000
    const snapshot: SessionSnapshotV2 = {
      mode: 'focus',
      round: 0,
      running: true,
      endTs,
      remainingMs: 0,
      task: 'Zadanie testowe',
      taskDone: false,
    }
    const settings = makeSettings()
    const initialStats = makeStats()

    const result = reconcileExpiredSession(snapshot, settings, initialStats, now, 'pl')

    expect(result.reconciled).toBe(true)
    expect(result.notice).toBe('Sesja skupienia została ukończona podczas Twojej nieobecności.')
  })

  it('generates English notice when lang is en', () => {
    const now = 1_700_000_000_000
    const endTs = now - 1_000
    const snapshot: SessionSnapshotV2 = {
      mode: 'focus',
      round: 0,
      running: true,
      endTs,
      remainingMs: 0,
      task: 'Test task',
      taskDone: false,
    }
    const settings = makeSettings()
    const initialStats = makeStats()

    const result = reconcileExpiredSession(snapshot, settings, initialStats, now, 'en')

    expect(result.reconciled).toBe(true)
    expect(result.notice).toBe('Focus session completed while you were away.')
  })
})
