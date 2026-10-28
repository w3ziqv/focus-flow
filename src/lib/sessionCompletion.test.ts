import { afterEach, describe, expect, it, vi } from 'vitest'
import { FocusStore } from './store'
import { DEFAULT_SETTINGS, loadSession, loadSessions, loadStats, saveSession } from './storage'
import { reconcileExpiredSession } from './wakeReconciliation'

afterEach(() => vi.useRealTimers())

describe('completion identity and calendar boundaries', () => {
  it('credits a Sunday completion to Sunday after waking on Monday', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 26, 8))
    const ended = new Date(2026, 9, 25, 23, 59)
    const result = FocusStore.recordSession({ id: 'sunday', date: ended.toISOString(), minutes: 25 })
    expect(result.stats.history[ended.toDateString()]).toBe(25)
    expect(result.stats.today).toBe(0)
    expect(result.stats.week).toBe(0)
    expect(result.stats.minutes).toBe(25)
  })

  it('does not credit the same completion twice or overwrite its task', () => {
    const entry = { id: 'stable-completion', minutes: 25, task: 'Original task' }
    FocusStore.recordSession(entry)
    FocusStore.recordSession({ ...entry, task: 'Repeated callback' })
    expect(loadSessions()).toHaveLength(1)
    expect(loadSessions()[0].task).toBe('Original task')
    expect(loadStats().minutes).toBe(25)
  })

  it('retains the completion identity across snapshot serialization', () => {
    saveSession({ id: 'resumable', mode: 'focus', round: 0, running: true, endTs: Date.now() + 60_000, remainingMs: 60_000, task: '', taskDone: false })
    expect(loadSession()?.id).toBe('resumable')
  })

  it('does not resurrect a deleted completion when a stale callback replays', () => {
    const entry = { id: 'deleted-completion', minutes: 25 }
    FocusStore.recordSession(entry)
    FocusStore.deleteSession(entry.id)
    FocusStore.recordSession(entry)
    expect(loadSessions()).toHaveLength(0)
    expect(loadStats().minutes).toBe(0)
  })

  it('replaying an expired snapshot keeps one record and one credit', () => {
    const snapshot = { id: 'replayed-wake', mode: 'focus' as const, round: 0, running: true, endTs: Date.now() - 1_000, remainingMs: 0, task: 'TEST replay', taskDone: false }
    reconcileExpiredSession(snapshot, DEFAULT_SETTINGS, loadStats())
    reconcileExpiredSession(snapshot, DEFAULT_SETTINGS, loadStats())
    expect(loadSessions()).toHaveLength(1)
    expect(loadStats().minutes).toBe(25)
  })
})
