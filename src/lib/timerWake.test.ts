import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTimerEngine } from './timer'
import { loadSessions, saveLang, saveSession, saveSettings, saveWebhookSettings } from './storage'
import type { SessionSnapshotV2, Settings } from '../types'

describe('useTimerEngine: Cold-Start Wake & Webhook Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('reconciles expired focus session on cold mount and surfaces wake notice', () => {
    const now = 1_700_000_000_000
    vi.setSystemTime(now)

    saveSettings({ focus: 25, short: 5, long: 15, rounds: 4, autoStart: false })

    const endTs = now - 30_000 // ended 30s ago while laptop lid was closed
    const expiredSnapshot: SessionSnapshotV2 = {
      mode: 'focus',
      round: 0,
      running: true,
      endTs,
      remainingMs: 0,
      task: 'Offline task',
      taskDone: false,
      checklist: [
        { id: 'c1', text: 'Step 1', completed: true },
      ],
    }
    saveSession(expiredSnapshot)

    const { result } = renderHook(() => useTimerEngine())

    // Should have advanced to short break
    expect(result.current.mode).toBe('short')
    expect(result.current.round).toBe(1)
    expect(result.current.running).toBe(false)
    expect(result.current.remainingMs).toBe(5 * 60_000)

    // Should have surfaced peaceful wake notice
    expect(result.current.wakeNotice).toBe('Focus session completed while you were away.')

    // Stats credited
    expect(result.current.stats.minutes).toBe(25)
    expect(result.current.stats.today).toBe(1)

    // Session persisted in history
    const sessions = loadSessions()
    expect(sessions).toHaveLength(1)
    expect(sessions[0].task).toBe('Offline task')
    expect(sessions[0].minutes).toBe(25)
    expect(sessions[0].checklist).toEqual([
      { id: 'c1', text: 'Step 1', completed: true },
    ])

    // Dismissing the notice
    act(() => {
      result.current.dismissWakeNotice()
    })
    expect(result.current.wakeNotice).toBeNull()
  })

  it('surfaces Polish wake notice on cold mount when user language is pl', () => {
    const now = 1_700_000_000_000
    vi.setSystemTime(now)

    saveLang('pl')
    saveSettings({ focus: 25, short: 5, long: 15, rounds: 4, autoStart: false })

    const endTs = now - 10_000
    const expiredSnapshot: SessionSnapshotV2 = {
      mode: 'focus',
      round: 0,
      running: true,
      endTs,
      remainingMs: 0,
      task: 'Praca w skupieniu',
      taskDone: false,
    }
    saveSession(expiredSnapshot)

    const { result } = renderHook(() => useTimerEngine())
    expect(result.current.wakeNotice).toBe('Sesja skupienia została ukończona podczas Twojej nieobecności.')
  })

  it('reconciles expired break session on cold mount without crediting focus stats', () => {
    const now = 1_700_000_000_000
    vi.setSystemTime(now)

    saveSettings({ focus: 25, short: 5, long: 15, rounds: 4, autoStart: false })

    const endTs = now - 5_000
    const expiredSnapshot: SessionSnapshotV2 = {
      mode: 'short',
      round: 1,
      running: true,
      endTs,
      remainingMs: 0,
      task: '',
      taskDone: false,
    }
    saveSession(expiredSnapshot)

    const { result } = renderHook(() => useTimerEngine())

    // Advances to focus mode
    expect(result.current.mode).toBe('focus')
    expect(result.current.round).toBe(1)
    expect(result.current.running).toBe(false)
    expect(result.current.remainingMs).toBe(25 * 60_000)

    // No notice for break
    expect(result.current.wakeNotice).toBeNull()

    // No stats credited
    expect(result.current.stats.minutes).toBe(0)
    expect(loadSessions()).toHaveLength(0)
  })

  it('reconciles running timer on document visibilitychange event when waking from sleep', () => {
    const now = 1_700_000_000_000
    vi.setSystemTime(now)

    const { result } = renderHook(() => useTimerEngine())

    act(() => {
      result.current.updateSettings({ focus: 25, short: 5, long: 15, rounds: 4, autoStart: false })
      result.current.setTask('Background tab test')
    })

    act(() => {
      result.current.start()
    })

    expect(result.current.running).toBe(true)

    // Simulate device sleep / lid close: wall-clock jumps past expiration without interval ticks
    vi.setSystemTime(now + 30 * 60_000)

    // Simulate tab becoming visible upon wakeup
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    })

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(result.current.running).toBe(false)
    expect(result.current.mode).toBe('short')
    expect(result.current.wakeNotice).toBe('Focus session completed while you were away.')
    expect(loadSessions()).toHaveLength(1)
  })

  it('checks expiration on window focus and pageshow events', () => {
    const now = 1_700_000_000_000
    vi.setSystemTime(now)

    const { result } = renderHook(() => useTimerEngine())

    act(() => {
      result.current.updateSettings({ focus: 25, short: 5, long: 15, rounds: 4, autoStart: false })
    })

    act(() => {
      result.current.start()
    })

    expect(result.current.running).toBe(true)

    // Advance system time past expiration
    vi.setSystemTime(now + 30 * 60_000)

    act(() => {
      window.dispatchEvent(new Event('focus'))
    })

    expect(result.current.running).toBe(false)
    expect(result.current.mode).toBe('short')
  })

  it('fires webhook lifecycle triggers on start, pause, and complete', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    )

    saveWebhookSettings({
      url: 'https://automation.example.com/webhook',
      enabled: true,
    })

    const { result } = renderHook(() => useTimerEngine())

    const fastSettings: Settings = { focus: 1, short: 1, long: 1, rounds: 4, autoStart: false }
    act(() => {
      result.current.updateSettings(fastSettings)
      result.current.setTask('Webhook Integration')
      result.current.addChecklistItem('Step 1')
    })

    // Start webhook
    act(() => {
      result.current.start()
    })

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [startUrl, startInit] = fetchSpy.mock.calls[0]
    expect(startUrl).toBe('https://automation.example.com/webhook')
    const startBody = JSON.parse(startInit?.body as string)
    expect(startBody.event).toBe('start')
    expect(startBody.session.mode).toBe('focus')
    expect(startBody.session.durationMinutes).toBe(1)
    expect(startBody.session.task).toBe('Webhook Integration')
    expect(startBody.session.checklist).toHaveLength(1)
    const sessionId = startBody.session.id

    // Pause webhook
    act(() => {
      result.current.pause()
    })

    expect(fetchSpy).toHaveBeenCalledTimes(2)
    const pauseBody = JSON.parse(fetchSpy.mock.calls[1][1]?.body as string)
    expect(pauseBody.event).toBe('pause')
    expect(pauseBody.session.id).toBe(sessionId)

    // Resume
    act(() => {
      result.current.start()
    })
    expect(fetchSpy).toHaveBeenCalledTimes(3)

    // Complete webhook
    act(() => {
      vi.advanceTimersByTime(60_000 + 1_000)
    })

    expect(fetchSpy).toHaveBeenCalledTimes(4)
    const completeBody = JSON.parse(fetchSpy.mock.calls[3][1]?.body as string)
    expect(completeBody.event).toBe('complete')
    expect(completeBody.session.id).toBe(sessionId)
    expect(completeBody.session.mode).toBe('focus')
  })

  it('silently ignores webhook failures without interrupting timer execution', () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error: connection refused'))

    saveWebhookSettings({
      url: 'https://automation.example.com/webhook',
      enabled: true,
    })

    const { result } = renderHook(() => useTimerEngine())
    act(() => {
      result.current.updateSettings({ focus: 1, short: 1, long: 1, rounds: 4, autoStart: false })
    })

    act(() => {
      result.current.start()
    })
    act(() => {
      result.current.pause()
    })
    act(() => {
      result.current.start()
    })
    act(() => {
      vi.advanceTimersByTime(60_000 + 1_000)
    })

    expect(result.current.mode).toBe('short')
  })
})
