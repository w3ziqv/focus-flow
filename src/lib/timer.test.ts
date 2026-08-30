import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTimerEngine } from './timer'
import { DEFAULT_SETTINGS } from './storage'
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
})
