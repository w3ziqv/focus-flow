import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTimerEngine } from './timer'
import { applyRemote } from './sync/outbox'
import { DEFAULT_SETTINGS, loadSessions, loadStats, saveSettings, saveStats, saveSession, loadSession } from './storage'
import { audio } from './audio'
import type { Settings } from '../types'

const MIN = 60_000

function fastSettings(overrides?: Partial<Settings>): Settings {
  return { focus: 1, short: 1, long: 1, rounds: 2, autoStart: false, ...overrides }
}

beforeEach(() => {
  vi.useFakeTimers()
  localStorage.clear()
})

describe('useTimerEngine', () => {
  it('refreshes cloud settings/history while preserving the device timer and task', () => {
    const {result} = renderHook(() => useTimerEngine())
    act(() => result.current.setTask('Local active task'))
    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(5_000))
    const remaining = result.current.remainingMs
    act(() => applyRemote(() => {
      saveSettings({...DEFAULT_SETTINGS, focus: 45})
      saveStats({...loadStats(), minutes: 125})
    }))
    expect(result.current.settings.focus).toBe(DEFAULT_SETTINGS.focus)
    expect(result.current.totalMs).toBe(DEFAULT_SETTINGS.focus * MIN)
    expect(result.current.stats.minutes).toBe(125)
    expect(result.current.running).toBe(true)
    expect(result.current.remainingMs).toBe(remaining)
    expect(result.current.task).toBe('Local active task')
  })
  it.each(['running', 'paused'])('retains %s phase duration across cloud changes and restart, and credits the original minutes', state => {
    const first = renderHook(() => useTimerEngine())
    act(() => first.result.current.start())
    act(() => vi.advanceTimersByTime(5_000))
    act(() => applyRemote(() => saveSettings({...DEFAULT_SETTINGS, focus: 45, short: 11})))
    if (state === 'paused') act(() => first.result.current.pause())
    first.unmount()
    const {result} = renderHook(() => useTimerEngine())
    expect(result.current.totalMs).toBe(DEFAULT_SETTINGS.focus * MIN)
    if (state === 'paused') act(() => result.current.start())
    act(() => vi.advanceTimersByTime(DEFAULT_SETTINGS.focus * MIN - 5_000))
    expect(loadSessions().at(-1)?.minutes).toBe(DEFAULT_SETTINGS.focus)
    expect(result.current.settings.focus).toBe(45)
    expect(result.current.totalMs).toBe(11 * MIN)
  })

  it('credits the frozen duration after expiry while the app is closed', () => {
    const first = renderHook(() => useTimerEngine())
    act(() => first.result.current.start())
    act(() => applyRemote(() => saveSettings({...DEFAULT_SETTINGS, focus: 45, short: 11})))
    first.unmount()
    act(() => vi.advanceTimersByTime(DEFAULT_SETTINGS.focus * MIN + 1_000))
    const {result} = renderHook(() => useTimerEngine())
    expect(loadSessions().at(-1)?.minutes).toBe(DEFAULT_SETTINGS.focus)
    expect(result.current.settings.focus).toBe(45)
    expect(result.current.totalMs).toBe(11 * MIN)
  })

  it('applies cloud settings immediately to an idle full phase and preserves them after restart', () => {
    const first = renderHook(() => useTimerEngine())
    act(() => applyRemote(() => saveSettings({...DEFAULT_SETTINGS, focus: 45})))
    expect(first.result.current.remainingMs).toBe(45 * MIN)
    first.unmount()
    const {result} = renderHook(() => useTimerEngine())
    expect(result.current.totalMs).toBe(45 * MIN)
    expect(result.current.remainingMs).toBe(45 * MIN)
  })

  it('upgrades a legacy active snapshot before remote settings can change its duration on restart', () => {
    saveSession({mode: 'focus', round: 0, running: true, endTs: Date.now() + DEFAULT_SETTINGS.focus * MIN, remainingMs: DEFAULT_SETTINGS.focus * MIN, task: 'Legacy task', taskDone: false})
    const first = renderHook(() => useTimerEngine())
    act(() => applyRemote(() => saveSettings({...DEFAULT_SETTINGS, focus: 45})))
    first.unmount()
    const {result} = renderHook(() => useTimerEngine())
    expect(result.current.totalMs).toBe(DEFAULT_SETTINGS.focus * MIN)
    expect(result.current.task).toBe('Legacy task')
  })

  it('clears account-owned active content without resetting the device countdown', () => {
    const {result} = renderHook(() => useTimerEngine())
    act(() => result.current.setTask('Private task'))
    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(5_000))
    const remaining = result.current.remainingMs
    act(() => applyRemote(() => saveSession({...loadSession()!, task: '', taskDone: false, checklist: []})))
    expect(result.current.task).toBe('')
    expect(result.current.running).toBe(true)
    expect(result.current.remainingMs).toBe(remaining)
  })

  it('starts idle in focus mode with a full duration', () => {
    const { result } = renderHook(() => useTimerEngine())
    expect(result.current.mode).toBe('focus')
    expect(result.current.running).toBe(false)
    expect(result.current.remainingMs).toBe(DEFAULT_SETTINGS.focus * MIN)
    expect(result.current.totalMs).toBe(DEFAULT_SETTINGS.focus * MIN)
  })

  it('counts down from the wall clock while running', () => {
    const { result } = renderHook(() => useTimerEngine())
    act(() => result.current.start())
    expect(result.current.running).toBe(true)
    act(() => vi.advanceTimersByTime(5_000))
    expect(result.current.remainingMs).toBe(DEFAULT_SETTINGS.focus * MIN - 5_000)
  })

  it('pause keeps the remaining time and stop the countdown', () => {
    const { result } = renderHook(() => useTimerEngine())
    act(() => {
      result.current.start()
      vi.advanceTimersByTime(10_000)
      result.current.pause()
    })
    const atPause = result.current.remainingMs
    act(() => vi.advanceTimersByTime(30_000))
    expect(result.current.remainingMs).toBe(atPause)
    expect(result.current.running).toBe(false)
  })

  it('completing a focus session records stats and moves to a short break', () => {
    const { result } = renderHook(() => useTimerEngine())
    act(() => result.current.updateSettings(fastSettings()))
    act(() => {
      result.current.setTask('write report')
      result.current.start()
    })
    act(() => vi.advanceTimersByTime(MIN + 1_000))
    expect(result.current.mode).toBe('short')
    expect(result.current.round).toBe(1)
    expect(result.current.taskDone).toBe(true)
    expect(result.current.stats.today).toBe(1)
    expect(result.current.stats.minutes).toBe(1)
    expect(result.current.running).toBe(false)
  })

  it('goes to a long break and resets the round after the configured rounds', () => {
    const { result } = renderHook(() => useTimerEngine())
    act(() => result.current.updateSettings(fastSettings({ rounds: 2 })))
    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(MIN + 1_000))
    expect(result.current.mode).toBe('short')
    act(() => result.current.switchMode('focus'))
    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(MIN + 1_000))
    expect(result.current.mode).toBe('long')
    expect(result.current.round).toBe(0)
    expect(result.current.stats.today).toBe(2)
  })

  it('returns to focus after a break completes', () => {
    const { result } = renderHook(() => useTimerEngine())
    act(() => result.current.updateSettings(fastSettings()))
    act(() => result.current.switchMode('short'))
    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(MIN + 1_000))
    expect(result.current.mode).toBe('focus')
    expect(result.current.stats.today).toBe(0)
  })

  it('auto-starts the next phase 1.2s after completion', () => {
    const { result } = renderHook(() => useTimerEngine())
    act(() => result.current.updateSettings(fastSettings({ autoStart: true })))
    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(MIN + 1_000))
    expect(result.current.running).toBe(false)
    act(() => vi.advanceTimersByTime(1_200))
    expect(result.current.running).toBe(true)
  })

  it('a manual mode switch during the auto-start window cancels it', () => {
    const { result } = renderHook(() => useTimerEngine())
    act(() => result.current.updateSettings(fastSettings({ autoStart: true })))
    act(() => {
      result.current.start()
      vi.advanceTimersByTime(MIN + 1_000)
    })
    act(() => result.current.switchMode('long'))
    act(() => vi.advanceTimersByTime(2_000))
    expect(result.current.running).toBe(false)
    expect(result.current.mode).toBe('long')
  })

  it('resets the round counter when switching back to focus after the cycle', () => {
    const { result } = renderHook(() => useTimerEngine())
    act(() => result.current.updateSettings(fastSettings({ rounds: 2 })))
    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(MIN + 1_000))
    expect(result.current.mode).toBe('short')
    act(() => result.current.switchMode('focus'))
    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(MIN + 1_000))
    expect(result.current.mode).toBe('long')
    expect(result.current.round).toBe(0)
    act(() => result.current.switchMode('focus'))
    expect(result.current.round).toBe(0)
  })

  it('restores a persisted running session across a remount', () => {
    const first = renderHook(() => useTimerEngine())
    act(() => first.result.current.updateSettings(fastSettings()))
    act(() => first.result.current.start())
    act(() => vi.advanceTimersByTime(20_000))
    first.unmount()

    const second = renderHook(() => useTimerEngine())
    expect(second.result.current.running).toBe(true)
    act(() => vi.advanceTimersByTime(5_000))
    expect(second.result.current.remainingMs).toBe(MIN - 25_000)
  })

  it('reset restores the full duration and clears the done flag', () => {
    const { result } = renderHook(() => useTimerEngine())
    act(() => result.current.updateSettings(fastSettings()))
    act(() => {
      result.current.start()
      vi.advanceTimersByTime(MIN + 1_000)
    })
    act(() => result.current.reset())
    expect(result.current.remainingMs).toBe(MIN)
    expect(result.current.taskDone).toBe(false)
  })

  describe('Milestone 2: Ephemeral Micro-Steps & Daily Goal Sanctuary', () => {
    it('manages active micro-steps checklist with max 3 items and 140 char clamp', () => {
      const { result } = renderHook(() => useTimerEngine())
      expect(result.current.checklist).toEqual([])

      act(() => {
        result.current.addChecklistItem('Step 1')
        result.current.addChecklistItem('Step 2')
        result.current.addChecklistItem('Step 3')
        result.current.addChecklistItem('Step 4 should be ignored')
      })
      expect(result.current.checklist).toHaveLength(3)
      expect(result.current.checklist[0].text).toBe('Step 1')
      expect(result.current.checklist[1].text).toBe('Step 2')
      expect(result.current.checklist[2].text).toBe('Step 3')

      // Toggling step
      const step1Id = result.current.checklist[0].id
      act(() => {
        result.current.toggleChecklistItem(step1Id)
      })
      expect(result.current.checklist[0].completed).toBe(true)

      // Removing step
      const step2Id = result.current.checklist[1].id
      act(() => {
        result.current.removeChecklistItem(step2Id)
      })
      expect(result.current.checklist).toHaveLength(2)
      expect(result.current.checklist.some((i) => i.id === step2Id)).toBe(false)
    })

    it('clamps micro-step text to 140 characters', () => {
      const { result } = renderHook(() => useTimerEngine())
      const longText = 'a'.repeat(200)
      act(() => {
        result.current.addChecklistItem(longText)
      })
      expect(result.current.checklist[0].text).toBe('a'.repeat(140))
    })

    it('captures micro-steps into session record on completion and immediately resets checklist to empty', () => {
      const { result } = renderHook(() => useTimerEngine())
      act(() => result.current.updateSettings(fastSettings({ focus: 1 })))

      act(() => {
        result.current.setTask('Implement Sanctuary integration')
        result.current.addChecklistItem('Micro-step A')
        result.current.addChecklistItem('Micro-step B')
      })

      // Toggle first item completed
      const itemAId = result.current.checklist[0].id
      act(() => {
        result.current.toggleChecklistItem(itemAId)
      })

      // Complete the focus session
      act(() => {
        result.current.start()
      })
      act(() => {
        vi.advanceTimersByTime(MIN + 1_000)
      })

      // Active checklist must be reset immediately (ephemeral lifecycle: no backlog debt)
      expect(result.current.checklist).toEqual([])

      // The completed session must contain the captured micro-steps
      const sessions = loadSessions()
      expect(sessions.length).toBeGreaterThanOrEqual(1)
      const lastSession = sessions[0]
      expect(lastSession.task).toBe('Implement Sanctuary integration')
      expect(lastSession.checklist).toHaveLength(2)
      expect(lastSession.checklist?.[0].completed).toBe(true)
      expect(lastSession.checklist?.[0].text).toBe('Micro-step A')
      expect(lastSession.checklist?.[1].completed).toBe(false)
      expect(lastSession.checklist?.[1].text).toBe('Micro-step B')
    })

    it('triggers calm 3-second goal celebration and chime when crossing dailyTargetMinutes', () => {
      const chimeSpy = vi.spyOn(audio, 'playChime').mockImplementation(() => {})
      const { result } = renderHook(() => useTimerEngine())
      act(() => result.current.updateSettings(fastSettings({ focus: 25 })))
      act(() => {
        result.current.updateGoals({
          enabled: true,
          dailyTargetMinutes: 25,
        })
      })

      expect(result.current.goalCelebration).toBe(false)

      // Start and complete session (25 minutes)
      act(() => {
        result.current.start()
      })
      act(() => {
        vi.advanceTimersByTime(25 * MIN + 1_000)
      })

      // Celebration triggered
      expect(result.current.goalCelebration).toBe(true)
      expect(chimeSpy).toHaveBeenCalled()

      // After 3 seconds, celebration resets to false
      act(() => {
        vi.advanceTimersByTime(3_000)
      })
      expect(result.current.goalCelebration).toBe(false)
      chimeSpy.mockRestore()
    })

    it('does not trigger goal celebration if daily focus goal is disabled', () => {
      const chimeSpy = vi.spyOn(audio, 'playChime').mockImplementation(() => {})
      const { result } = renderHook(() => useTimerEngine())
      act(() => result.current.updateSettings(fastSettings({ focus: 25 })))
      act(() => {
        result.current.updateGoals({
          enabled: false,
          dailyTargetMinutes: 25,
        })
      })

      act(() => {
        result.current.start()
      })
      act(() => {
        vi.advanceTimersByTime(25 * MIN + 1_000)
      })

      expect(result.current.goalCelebration).toBe(false)
      chimeSpy.mockRestore()
    })
  })
})


describe('desktop skip phase', () => {
  it('advances rounds and long breaks without crediting unfinished work', () => {
    const { result } = renderHook(() => useTimerEngine())
    act(() => result.current.updateSettings(fastSettings({rounds: 2})))
    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(5_000))
    act(() => result.current.skip())
    expect(result.current.mode).toBe('short')
    expect(result.current.round).toBe(1)
    expect(result.current.running).toBe(false)
    expect(loadSessions()).toHaveLength(0)
    act(() => result.current.skip())
    expect(result.current.mode).toBe('focus')
    act(() => result.current.skip())
    expect(result.current.mode).toBe('long')
    expect(result.current.round).toBe(0)
    expect(loadSessions()).toHaveLength(0)
    expect(result.current.lastEvent).toBeNull()
  })
})
