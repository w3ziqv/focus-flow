import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import App from './App'
import { audio } from './lib/audio'
import * as notificationsModule from './lib/notifications'
import * as timerModule from './lib/timer'

describe('App Component - Completion Chime & Notification Dispatch', () => {
  const originalMatchMedia = window.matchMedia

  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    window.matchMedia = (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList
  })

  afterEach(() => {
    vi.restoreAllMocks()
    if (originalMatchMedia) {
      window.matchMedia = originalMatchMedia
    } else {
      Reflect.deleteProperty(window, 'matchMedia')
    }
  })

  it('invokes playChime, triggerHapticFeedback, and dispatchNotification in parallel on session end', async () => {
    vi.useFakeTimers()
    try {
      const chimeSpy = vi.spyOn(audio, 'playChime').mockImplementation(() => {})
      const hapticSpy = vi.spyOn(notificationsModule, 'triggerHapticFeedback').mockReturnValue(true)
      const dispatchSpy = vi.spyOn(notificationsModule, 'dispatchNotification').mockResolvedValue(true)

      let capturedHook: timerModule.TimerEngine | undefined

      const originalUseTimerEngine = timerModule.useTimerEngine
      vi.spyOn(timerModule, 'useTimerEngine').mockImplementation(() => {
        const realEngine = originalUseTimerEngine()
        capturedHook = realEngine
        return realEngine
      })

      render(<App />)

      expect(capturedHook).toBeDefined()

      // Set task and start session with minimal duration
      act(() => {
        capturedHook?.setTask('Deep Research Block')
        capturedHook?.updateSettings({
          focus: 0.01,
          short: 0.01,
          long: 0.01,
          rounds: 4,
          autoStart: false,
        })
      })

      act(() => {
        capturedHook?.start()
      })

      // Advance clock past session deadline so ticker triggers complete()
      act(() => {
        vi.advanceTimersByTime(2000)
      })

      // Genuine end-to-end verification: completion handler executed exactly once
      expect(chimeSpy).toHaveBeenCalledTimes(1)
      expect(hapticSpy).toHaveBeenCalledTimes(1)
      expect(dispatchSpy).toHaveBeenCalledTimes(1)
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ body: 'Deep Research Block' }),
      )
    } finally {
      vi.useRealTimers()
    }
  })

  it('triggers audio.playChime, triggerHapticFeedback, and dispatchNotification when lastEvent transitions', () => {
    const chimeSpy = vi.spyOn(audio, 'playChime').mockImplementation(() => {})
    const hapticSpy = vi.spyOn(notificationsModule, 'triggerHapticFeedback').mockReturnValue(true)
    const dispatchSpy = vi.spyOn(notificationsModule, 'dispatchNotification').mockResolvedValue(true)

    let lastEventState: timerModule.TimerEvent | null = null
    let taskState = 'Finish v2.4.1 milestone'

    // Mock useTimerEngine to simulate an explicit lastEvent trigger
    vi.spyOn(timerModule, 'useTimerEngine').mockImplementation(() => {
      return {
        settings: { focus: 25, short: 5, long: 15, rounds: 4, autoStart: false },
        updateSettings: vi.fn(),
        mode: 'focus',
        round: 1,
        running: false,
        remainingMs: 1500000,
        totalMs: 1500000,
        task: taskState,
        taskDone: false,
        stats: {
          minutes: 0,
          today: 0,
          week: 0,
          streak: 0,
          date: '2026-09-16',
          weekStart: '2026-09-15',
          lastDate: null,
          history: {},
          unlockedMilestones: [],
        },
        lastEvent: lastEventState,
        start: vi.fn(),
        pause: vi.fn(),
        toggle: vi.fn(),
        reset: vi.fn(),
        switchMode: vi.fn(),
        setTask: vi.fn(),
        checklist: [],
        setChecklist: vi.fn(),
        addChecklistItem: vi.fn(),
        toggleChecklistItem: vi.fn(),
        removeChecklistItem: vi.fn(),
        goals: { enabled: false, dailyTargetMinutes: 0 },
        updateGoals: vi.fn(),
        goalCelebration: false,
        refreshStats: vi.fn(),
        setStats: vi.fn(),
        wakeNotice: null,
        dismissWakeNotice: vi.fn(),
      }
    })

    const { rerender } = render(<App />)

    expect(chimeSpy).not.toHaveBeenCalled()
    expect(dispatchSpy).not.toHaveBeenCalled()

    // Trigger focus completion event
    lastEventState = { kind: 'focus', at: Date.now() }
    rerender(<App />)

    expect(chimeSpy).toHaveBeenCalledTimes(1)
    expect(hapticSpy).toHaveBeenCalledTimes(1)
    expect(dispatchSpy).toHaveBeenCalledTimes(1)
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ body: 'Finish v2.4.1 milestone' }),
    )

    // Trigger break completion event
    lastEventState = { kind: 'break', at: Date.now() + 1000 }
    rerender(<App />)

    expect(chimeSpy).toHaveBeenCalledTimes(2)
    expect(hapticSpy).toHaveBeenCalledTimes(2)
    expect(dispatchSpy).toHaveBeenCalledTimes(2)

    // Modifying task title must NOT re-trigger completion chime, haptics or notification
    taskState = 'Updated task title'
    rerender(<App />)
    expect(chimeSpy).toHaveBeenCalledTimes(2)
    expect(hapticSpy).toHaveBeenCalledTimes(2)
    expect(dispatchSpy).toHaveBeenCalledTimes(2)
  })

  it('resiliently handles browser blocking audio autoplay without preventing notification dispatch', () => {
    const throwingChimeSpy = vi.spyOn(audio, 'playChime').mockImplementation(() => {
      throw new Error('NotAllowedError: play() failed because the user didn\'t interact with the document first.')
    })
    const hapticSpy = vi.spyOn(notificationsModule, 'triggerHapticFeedback').mockReturnValue(true)
    const dispatchSpy = vi.spyOn(notificationsModule, 'dispatchNotification').mockResolvedValue(true)

    let lastEventState: timerModule.TimerEvent | null = null

    vi.spyOn(timerModule, 'useTimerEngine').mockImplementation(() => {
      return {
        settings: { focus: 25, short: 5, long: 15, rounds: 4, autoStart: false },
        updateSettings: vi.fn(),
        mode: 'focus',
        round: 1,
        running: false,
        remainingMs: 1500000,
        totalMs: 1500000,
        task: 'Blocked audio test',
        taskDone: false,
        stats: {
          minutes: 0,
          today: 0,
          week: 0,
          streak: 0,
          date: '2026-09-16',
          weekStart: '2026-09-15',
          lastDate: null,
          history: {},
          unlockedMilestones: [],
        },
        lastEvent: lastEventState,
        start: vi.fn(),
        pause: vi.fn(),
        toggle: vi.fn(),
        reset: vi.fn(),
        switchMode: vi.fn(),
        setTask: vi.fn(),
        checklist: [],
        setChecklist: vi.fn(),
        addChecklistItem: vi.fn(),
        toggleChecklistItem: vi.fn(),
        removeChecklistItem: vi.fn(),
        goals: { enabled: false, dailyTargetMinutes: 0 },
        updateGoals: vi.fn(),
        goalCelebration: false,
        refreshStats: vi.fn(),
        setStats: vi.fn(),
        wakeNotice: null,
        dismissWakeNotice: vi.fn(),
      }
    })

    const { rerender } = render(<App />)

    expect(() => {
      lastEventState = { kind: 'focus', at: Date.now() }
      rerender(<App />)
    }).not.toThrow()

    expect(throwingChimeSpy).toHaveBeenCalledTimes(1)
    expect(hapticSpy).toHaveBeenCalledTimes(1)
    expect(dispatchSpy).toHaveBeenCalledTimes(1)
  })

  it('strictly ensures idempotent completion: task editing across multiple keystrokes does not re-fire chime or notification', () => {
    const chimeSpy = vi.spyOn(audio, 'playChime').mockImplementation(() => {})
    const hapticSpy = vi.spyOn(notificationsModule, 'triggerHapticFeedback').mockReturnValue(true)
    const dispatchSpy = vi.spyOn(notificationsModule, 'dispatchNotification').mockResolvedValue(true)

    let lastEventState: timerModule.TimerEvent | null = null
    let taskState = 'Initial Task'

    vi.spyOn(timerModule, 'useTimerEngine').mockImplementation(() => ({
      settings: { focus: 25, short: 5, long: 15, rounds: 4, autoStart: false },
      updateSettings: vi.fn(),
      mode: 'focus',
      round: 1,
      running: false,
      remainingMs: 1500000,
      totalMs: 1500000,
      task: taskState,
      taskDone: false,
      stats: {
        minutes: 0,
        today: 0,
        week: 0,
        streak: 0,
        date: '2026-09-16',
        weekStart: '2026-09-15',
        lastDate: null,
        history: {},
        unlockedMilestones: [],
      },
      lastEvent: lastEventState,
      start: vi.fn(),
      pause: vi.fn(),
      toggle: vi.fn(),
      reset: vi.fn(),
      switchMode: vi.fn(),
      setTask: vi.fn(),
      checklist: [],
      setChecklist: vi.fn(),
      addChecklistItem: vi.fn(),
      toggleChecklistItem: vi.fn(),
      removeChecklistItem: vi.fn(),
      goals: { enabled: false, dailyTargetMinutes: 0 },
      updateGoals: vi.fn(),
      goalCelebration: false,
      refreshStats: vi.fn(),
      setStats: vi.fn(),
      wakeNotice: null,
      dismissWakeNotice: vi.fn(),
    }))

    const { rerender } = render(<App />)

    // Fire completion event
    const eventTimestamp = Date.now()
    lastEventState = { kind: 'focus', at: eventTimestamp }
    rerender(<App />)

    expect(chimeSpy).toHaveBeenCalledTimes(1)
    expect(hapticSpy).toHaveBeenCalledTimes(1)
    expect(dispatchSpy).toHaveBeenCalledTimes(1)

    // Simulate 5 rapid keystrokes in task field
    for (const char of [' ', 'N', 'e', 'w', '!']) {
      taskState += char
      rerender(<App />)
    }

    // Call counts must strictly remain 1
    expect(chimeSpy).toHaveBeenCalledTimes(1)
    expect(hapticSpy).toHaveBeenCalledTimes(1)
    expect(dispatchSpy).toHaveBeenCalledTimes(1)
  })
})
