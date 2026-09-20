import { beforeEach, describe, expect, it } from 'vitest'
import { FocusStore } from './store'
import { saveGoals } from './storage'

describe('FocusStore (Unified Domain Repository Seam)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('atomically records a completed session, adjusts stats, and checks goals', () => {
    saveGoals({ dailyTargetMinutes: 25, enabled: true })

    const result = FocusStore.recordSession({
      minutes: 25,
      task: 'Deep Focus Work',
      checklist: [{ id: 'c1', text: 'Step 1', completed: true }],
    })

    expect(result.session.task).toBe('Deep Focus Work')
    expect(result.session.minutes).toBe(25)
    expect(result.stats.minutes).toBe(25)
    expect(result.stats.today).toBe(1)
    expect(result.goalReached).toBe(true)

    // Milestones must include the first step
    expect(result.milestones.some((m) => m.id === 'the_first_step')).toBe(true)

    // Verify stored state matches
    const storedSessions = FocusStore.getSessions()
    expect(storedSessions).toHaveLength(1)
    expect(storedSessions[0].id).toBe(result.session.id)
  })

  it('atomically deletes a session and decrements aggregate statistics', () => {
    const rec = FocusStore.recordSession({
      minutes: 50,
      task: 'To be deleted',
    })

    expect(FocusStore.getStats().minutes).toBe(50)

    const delResult = FocusStore.deleteSession(rec.session.id)
    expect(delResult.deleted?.id).toBe(rec.session.id)
    expect(delResult.sessions).toHaveLength(0)
    expect(delResult.stats.minutes).toBe(0)
    expect(delResult.stats.today).toBe(0)
  })

  it('updates preferences bundle in a unified transaction', () => {
    const prefs = FocusStore.getPreferences()
    expect(prefs.theme).toBe('light')

    const updated = FocusStore.updatePreferences({
      theme: 'dark',
      volume: 0.9,
    })

    expect(updated.theme).toBe('dark')
    expect(updated.volume).toBe(0.9)
    expect(FocusStore.getPreferences().theme).toBe('dark')
  })
})
