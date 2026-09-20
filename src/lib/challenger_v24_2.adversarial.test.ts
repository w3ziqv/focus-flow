import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionSnapshotV2, Settings, StatsV2, WebhookSettings } from '../types'
import {
  loadSessions,
  loadStats,
  saveSession,
  saveSettings,
  saveStats,
  saveWebhookSettings,
} from './storage'
import { useTimerEngine } from './timer'
import {
  createTimerTicker,
  type WorkerInMessage,
  type WorkerOutMessage,
} from './timerWorker'
import { reconcileExpiredSession } from './wakeReconciliation'
import {
  createWebhookPayload,
  dispatchWebhook,
  testWebhook,
} from './webhook'

// Helpers & Fixtures

function makeTestSettings(overrides?: Partial<Settings>): Settings {
  return {
    focus: 25,
    short: 5,
    long: 15,
    rounds: 4,
    autoStart: false,
    ...overrides,
  }
}

function makeTestStats(overrides?: Partial<StatsV2>): StatsV2 {
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

// Mock Worker Implementation for Adversarial Ticker Tests

class MockWorkerHarness {
  static instances: MockWorkerHarness[] = []
  onmessage: ((event: MessageEvent<WorkerOutMessage>) => void) | null = null
  messagesPosted: WorkerInMessage[] = []
  terminated = false
  postMessageShouldThrow = false
  terminateShouldThrow = false

  constructor(public url: URL | string, public options?: WorkerOptions) {
    MockWorkerHarness.instances.push(this)
  }

  postMessage(msg: WorkerInMessage): void {
    if (this.postMessageShouldThrow) {
      throw new DOMException('DataCloneError: The object could not be cloned.', 'DataCloneError')
    }
    this.messagesPosted.push(msg)
  }

  terminate(): void {
    if (this.terminateShouldThrow) {
      throw new Error('Worker termination internal error')
    }
    this.terminated = true
  }

  emitTick(): void {
    if (this.onmessage && !this.terminated) {
      this.onmessage({ data: { type: 'tick' } } as MessageEvent<WorkerOutMessage>)
    }
  }
}



describe('Area 1: Web Worker Ticker Adversarial Stress & Graceful Fallback', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    MockWorkerHarness.instances = []
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  describe('1.1 Interval Behavior & Pathological Arguments', () => {
    it('handles start() with default 250ms interval in fallback mode', () => {
      const onTick = vi.fn()
      const ticker = createTimerTicker(onTick)

      ticker.start()
      expect(onTick).not.toHaveBeenCalled()

      vi.advanceTimersByTime(249)
      expect(onTick).not.toHaveBeenCalled()

      vi.advanceTimersByTime(1)
      expect(onTick).toHaveBeenCalledTimes(1)

      ticker.stop()
    })

    it('honors custom intervals (100ms and 1000ms) in fallback mode', () => {
      const onTick = vi.fn()
      const ticker = createTimerTicker(onTick)

      ticker.start(100)
      vi.advanceTimersByTime(350)
      expect(onTick).toHaveBeenCalledTimes(3)
      ticker.stop()

      const onTick2 = vi.fn()
      const ticker2 = createTimerTicker(onTick2)
      ticker2.start(1000)
      vi.advanceTimersByTime(2500)
      expect(onTick2).toHaveBeenCalledTimes(2)
      ticker2.stop()
    })

    it('survives pathological numeric intervals (0, negative, NaN, Infinity) without crashing', () => {
      const onTick = vi.fn()
      const ticker = createTimerTicker(onTick)

      // Test with negative interval
      expect(() => ticker.start(-50)).not.toThrow()
      ticker.stop()

      // Test with 0
      const ticker0 = createTimerTicker(onTick)
      expect(() => ticker0.start(0)).not.toThrow()
      ticker0.stop()

      // Test with NaN
      const tickerNaN = createTimerTicker(onTick)
      expect(() => tickerNaN.start(NaN)).not.toThrow()
      tickerNaN.stop()

      // Test with Infinity
      const tickerInf = createTimerTicker(onTick)
      expect(() => tickerInf.start(Infinity)).not.toThrow()
      tickerInf.stop()
    })
  })

  describe('1.2 Start/Stop Spam and Concurrency Stress', () => {
    it('survives 50 rapid synchronous start() calls without multiplying interval registrations', () => {
      const onTick = vi.fn()
      const ticker = createTimerTicker(onTick)

      // Spam start 50 times in the same tick
      for (let i = 0; i < 50; i++) {
        ticker.start(250)
      }

      // Advance by 1 interval: onTick must only be called ONCE, not 50 times
      vi.advanceTimersByTime(250)
      expect(onTick).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(500)
      expect(onTick).toHaveBeenCalledTimes(3)

      ticker.stop()
    })

    it('survives 100 rapid start-stop alternations and cleans up completely', () => {
      const onTick = vi.fn()
      const ticker = createTimerTicker(onTick)

      for (let i = 0; i < 100; i++) {
        ticker.start(100)
        ticker.stop()
      }

      // Timer should be completely stopped; no lingering ticks
      vi.advanceTimersByTime(1000)
      expect(onTick).not.toHaveBeenCalled()

      // Should still be restartable cleanly after spam
      ticker.start(200)
      vi.advanceTimersByTime(400)
      expect(onTick).toHaveBeenCalledTimes(2)
      ticker.stop()
    })

    it('survives repeated stop() calls on unstarted or stopped ticker', () => {
      const onTick = vi.fn()
      const ticker = createTimerTicker(onTick)

      for (let i = 0; i < 20; i++) {
        expect(() => ticker.stop()).not.toThrow()
      }

      ticker.start(250)
      ticker.stop()

      for (let i = 0; i < 20; i++) {
        expect(() => ticker.stop()).not.toThrow()
      }
    })
  })

  describe('1.3 Web Worker Instantiation Failure & Graceful Fallback', () => {
    it('falls back to window.setInterval when Worker is undefined in global scope', () => {
      // In default test environment without Worker stub, global Worker is undefined
      expect(typeof Worker).toBe('undefined')

      const onTick = vi.fn()
      const ticker = createTimerTicker(onTick)

      ticker.start(250)
      vi.advanceTimersByTime(500)
      expect(onTick).toHaveBeenCalledTimes(2)

      ticker.stop()
      vi.advanceTimersByTime(500)
      expect(onTick).toHaveBeenCalledTimes(2)
    })

    it('gracefully falls back to setInterval when new Worker() constructor throws SecurityError/CSP', () => {
      vi.stubGlobal(
        'Worker',
        class SecurityRestrictedWorker {
          constructor() {
            throw new DOMException('Failed to construct Worker: access denied by CSP', 'SecurityError')
          }
        },
      )

      const onTick = vi.fn()
      const ticker = createTimerTicker(onTick)

      expect(() => ticker.start(250)).not.toThrow()
      vi.advanceTimersByTime(500)
      expect(onTick).toHaveBeenCalledTimes(2)

      ticker.stop()
      vi.advanceTimersByTime(500)
      expect(onTick).toHaveBeenCalledTimes(2)
    })

    it('gracefully falls back to setInterval when worker.postMessage throws DataCloneError', () => {
      const mockClass = class FailingPostMessageWorker extends MockWorkerHarness {
        constructor(url: URL | string, options?: WorkerOptions) {
          super(url, options)
          this.postMessageShouldThrow = true
        }
      }
      vi.stubGlobal('Worker', mockClass)

      const onTick = vi.fn()
      const ticker = createTimerTicker(onTick)

      expect(() => ticker.start(250)).not.toThrow()
      // Should terminate failed worker and fall back to setInterval
      expect(MockWorkerHarness.instances).toHaveLength(1)
      expect(MockWorkerHarness.instances[0].terminated).toBe(true)

      // Fallback setInterval should now be driving the ticks
      vi.advanceTimersByTime(500)
      expect(onTick).toHaveBeenCalledTimes(2)

      ticker.stop()
    })

    it('does not propagate errors if worker.terminate() throws on stop', () => {
      const mockClass = class ThrowingTerminateWorker extends MockWorkerHarness {
        constructor(url: URL | string, options?: WorkerOptions) {
          super(url, options)
          this.terminateShouldThrow = true
        }
      }
      vi.stubGlobal('Worker', mockClass)

      const onTick = vi.fn()
      const ticker = createTimerTicker(onTick)

      ticker.start(250)
      expect(() => ticker.stop()).not.toThrow()
    })
  })
})



describe('Area 2: Cold-Start Wake Reconciliation Adversarial Stress & Idempotency', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('2.1 Boundary Condition: endTs relative to now', () => {
    it('exact boundary: endTs === now reconciles cleanly as expired', () => {
      const now = 1_700_000_000_000
      const snapshot: SessionSnapshotV2 = {
        mode: 'focus',
        round: 0,
        running: true,
        endTs: now, // EXACT boundary: 0ms remaining
        remainingMs: 0,
        task: 'Boundary Session',
        taskDone: false,
      }
      const settings = makeTestSettings({ focus: 25 })
      const initialStats = makeTestStats()

      const result = reconcileExpiredSession(snapshot, settings, initialStats, now, 'en')

      expect(result.reconciled).toBe(true)
      expect(result.elapsedMinutes).toBe(25)
      expect(result.newMode).toBe('short')
      expect(result.newRound).toBe(1)
      expect(result.notice).toBe('Focus session completed while you were away.')
      expect(result.newSnapshot?.remainingMs).toBe(5 * 60_000)

      // Verify persistence
      expect(loadSessions()).toHaveLength(1)
      expect(loadSessions()[0].task).toBe('Boundary Session')
      expect(loadStats().minutes).toBe(25)
    })

    it('1ms in the past (endTs = now - 1): reconciles cleanly', () => {
      const now = 1_700_000_000_000
      const endTs = now - 1
      const snapshot: SessionSnapshotV2 = {
        mode: 'focus',
        round: 1,
        running: true,
        endTs,
        remainingMs: 0,
        task: 'Past 1ms',
        taskDone: false,
      }
      const settings = makeTestSettings({ focus: 25 })
      const initialStats = makeTestStats()

      const result = reconcileExpiredSession(snapshot, settings, initialStats, now, 'en')

      expect(result.reconciled).toBe(true)
      expect(result.elapsedMinutes).toBe(25)
      expect(result.newMode).toBe('short')
      expect(result.newRound).toBe(2)
      expect(loadSessions()).toHaveLength(1)
      expect(loadSessions()[0].date).toBe(new Date(endTs).toISOString())
    })

    it('1ms in the future (endTs = now + 1): does NOT reconcile', () => {
      const now = 1_700_000_000_000
      const snapshot: SessionSnapshotV2 = {
        mode: 'focus',
        round: 1,
        running: true,
        endTs: now + 1, // 1ms left!
        remainingMs: 1,
        task: 'Not yet expired',
        taskDone: false,
      }
      const settings = makeTestSettings({ focus: 25 })
      const initialStats = makeTestStats()

      const result = reconcileExpiredSession(snapshot, settings, initialStats, now, 'en')

      expect(result.reconciled).toBe(false)
      expect(result.elapsedMinutes).toBeUndefined()
      expect(result.notice).toBeNull()
      expect(result.newSnapshot).toBe(snapshot)
      expect(loadSessions()).toHaveLength(0)
      expect(loadStats().minutes).toBe(0)
    })
  })

  describe('2.2 Deep Sleep Durations: 1 Hour, 24 Hours, 7 Days', () => {
    it('system slept for 1 hour: credits scheduled focus minutes (25 min), not 60 min', () => {
      const oneHourMs = 60 * 60_000
      const sessionStart = 1_700_000_000_000
      const endTs = sessionStart + 25 * 60_000
      const wakeTime = endTs + oneHourMs // woke 1 hour after session ended

      const snapshot: SessionSnapshotV2 = {
        mode: 'focus',
        round: 0,
        running: true,
        endTs,
        remainingMs: 0,
        task: 'One Hour Sleep',
        taskDone: false,
      }
      const settings = makeTestSettings({ focus: 25 })
      const initialStats = makeTestStats()

      const result = reconcileExpiredSession(snapshot, settings, initialStats, wakeTime, 'en')

      expect(result.reconciled).toBe(true)
      // Must credit strictly the 25 focus minutes, never the 1-hour sleep duration
      expect(result.elapsedMinutes).toBe(25)
      expect(result.newStats.minutes).toBe(25)
      expect(result.newStats.today).toBe(1)

      const sessions = loadSessions()
      expect(sessions).toHaveLength(1)
      expect(sessions[0].minutes).toBe(25)
      expect(sessions[0].date).toBe(new Date(endTs).toISOString())
    })

    it('system slept for 24 hours across midnight: credits 25 min and stamps completion date', () => {
      const twentyFourHoursMs = 24 * 60 * 60_000
      const endTs = 1_700_000_000_000
      const wakeTime = endTs + twentyFourHoursMs

      const snapshot: SessionSnapshotV2 = {
        mode: 'focus',
        round: 0,
        running: true,
        endTs,
        remainingMs: 0,
        task: 'Yesterday Focus',
        taskDone: false,
      }
      const settings = makeTestSettings({ focus: 25 })
      const initialStats = makeTestStats()

      const result = reconcileExpiredSession(snapshot, settings, initialStats, wakeTime, 'en')

      expect(result.reconciled).toBe(true)
      expect(result.elapsedMinutes).toBe(25)
      expect(result.newStats.minutes).toBe(25)

      const sessions = loadSessions()
      expect(sessions).toHaveLength(1)
      expect(sessions[0].minutes).toBe(25)
      expect(sessions[0].date).toBe(new Date(endTs).toISOString())
    })

    it('system slept for 7 days: credits 25 min and logs accurate session without arithmetic overflow', () => {
      const sevenDaysMs = 7 * 24 * 60 * 60_000
      const endTs = 1_700_000_000_000
      const wakeTime = endTs + sevenDaysMs

      const snapshot: SessionSnapshotV2 = {
        mode: 'focus',
        round: 0,
        running: true,
        endTs,
        remainingMs: 0,
        task: 'Vacation Sleep',
        taskDone: false,
      }
      const settings = makeTestSettings({ focus: 25 })
      const initialStats = makeTestStats()

      const result = reconcileExpiredSession(snapshot, settings, initialStats, wakeTime, 'en')

      expect(result.reconciled).toBe(true)
      expect(result.elapsedMinutes).toBe(25)
      expect(result.newStats.minutes).toBe(25)

      const sessions = loadSessions()
      expect(sessions).toHaveLength(1)
      expect(sessions[0].task).toBe('Vacation Sleep')
      expect(sessions[0].date).toBe(new Date(endTs).toISOString())
    })
  })

  describe('2.3 Break Mode vs Focus Mode Sleep Behavior', () => {
    it('device slept during short break: advances to focus, credits 0 stats, logs 0 sessions, no notice', () => {
      const now = 1_700_000_000_000
      const endTs = now - 15 * 60_000
      const snapshot: SessionSnapshotV2 = {
        mode: 'short',
        round: 2,
        running: true,
        endTs,
        remainingMs: 0,
        task: 'Ongoing Project',
        taskDone: false,
      }
      const settings = makeTestSettings({ focus: 30, short: 5 })
      const initialStats = makeTestStats({ minutes: 60, today: 2 })

      const result = reconcileExpiredSession(snapshot, settings, initialStats, now, 'en')

      expect(result.reconciled).toBe(true)
      expect(result.elapsedMinutes).toBeUndefined()
      expect(result.newMode).toBe('focus')
      expect(result.newRound).toBe(2)
      expect(result.notice).toBeNull()
      expect(result.newSnapshot?.remainingMs).toBe(30 * 60_000)

      // No stats credited
      expect(result.newStats.minutes).toBe(60)
      expect(result.newStats.today).toBe(2)
      expect(loadSessions()).toHaveLength(0)
    })

    it('device slept during long break: advances to focus, credits 0 stats, logs 0 sessions, no notice', () => {
      const now = 1_700_000_000_000
      const endTs = now - 30 * 60_000
      const snapshot: SessionSnapshotV2 = {
        mode: 'long',
        round: 0,
        running: true,
        endTs,
        remainingMs: 0,
        task: '',
        taskDone: false,
      }
      const settings = makeTestSettings({ focus: 25, long: 15 })
      const initialStats = makeTestStats({ minutes: 100, today: 4 })

      const result = reconcileExpiredSession(snapshot, settings, initialStats, now, 'en')

      expect(result.reconciled).toBe(true)
      expect(result.elapsedMinutes).toBeUndefined()
      expect(result.newMode).toBe('focus')
      expect(result.newRound).toBe(0)
      expect(result.notice).toBeNull()
      expect(loadSessions()).toHaveLength(0)
      expect(result.newStats.minutes).toBe(100)
    })

    it('device slept during final focus round: advances cleanly to long break and resets round to 0', () => {
      const now = 1_700_000_000_000
      const endTs = now - 10_000
      const snapshot: SessionSnapshotV2 = {
        mode: 'focus',
        round: 3, // 4th round (rounds = 4)
        running: true,
        endTs,
        remainingMs: 0,
        task: 'Final Milestone',
        taskDone: false,
      }
      const settings = makeTestSettings({ focus: 25, long: 20, rounds: 4 })
      const initialStats = makeTestStats()

      const result = reconcileExpiredSession(snapshot, settings, initialStats, now, 'en')

      expect(result.reconciled).toBe(true)
      expect(result.newMode).toBe('long')
      expect(result.newRound).toBe(0)
      expect(result.newSnapshot?.remainingMs).toBe(20 * 60_000)
      expect(result.newSnapshot?.taskDone).toBe(true)
      expect(result.notice).toBe('Focus session completed while you were away.')
    })
  })

  describe('2.4 Strict Idempotency Under Repeated Execution', () => {
    it('repeatedly reconciling the resulting state 10 consecutive times produces ZERO additional mutations', () => {
      const now = 1_700_000_000_000
      const endTs = now - 5000
      const snapshot: SessionSnapshotV2 = {
        mode: 'focus',
        round: 0,
        running: true,
        endTs,
        remainingMs: 0,
        task: 'Idempotency Test',
        taskDone: false,
      }
      const settings = makeTestSettings({ focus: 25 })
      const initialStats = makeTestStats()

      // Initial reconciliation
      const firstResult = reconcileExpiredSession(snapshot, settings, initialStats, now, 'en')
      expect(firstResult.reconciled).toBe(true)
      expect(firstResult.elapsedMinutes).toBe(25)
      expect(loadSessions()).toHaveLength(1)
      expect(loadStats().minutes).toBe(25)

      // Subsequent runs with updated snapshot and stats
      let currentSnapshot = firstResult.newSnapshot
      let currentStats = firstResult.newStats

      for (let i = 0; i < 10; i++) {
        const subsequent = reconcileExpiredSession(currentSnapshot, settings, currentStats, now, 'en')
        expect(subsequent.reconciled).toBe(false)
        expect(subsequent.elapsedMinutes).toBeUndefined()
        expect(subsequent.notice).toBeNull()
        currentSnapshot = subsequent.newSnapshot
        currentStats = subsequent.newStats
      }

      // Final storage state must be strictly unchanged
      expect(loadSessions()).toHaveLength(1)
      expect(loadStats().minutes).toBe(25)
      expect(loadStats().today).toBe(1)
    })
  })

  describe('2.5 Concurrent Triggers in React Runtime (timer.ts)', () => {
    it('handles concurrent visibilitychange, focus, and pageshow events in the same tick without duplicate crediting', () => {
      const now = 1_700_000_000_000
      vi.setSystemTime(now)

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      )

      saveSettings({ focus: 25, short: 5, long: 15, rounds: 4, autoStart: false })
      saveWebhookSettings({ url: 'https://example.com/webhook', enabled: true })

      const { result } = renderHook(() => useTimerEngine())

      act(() => {
        result.current.setTask('Concurrent Wake Task')
        result.current.start()
      })

      expect(result.current.running).toBe(true)
      expect(fetchSpy).toHaveBeenCalledTimes(1) // 'start' webhook

      // Simulate device sleep: time jumps 30 minutes forward
      vi.setSystemTime(now + 30 * 60_000)

      // Fire visibilitychange, window.focus, and window.pageshow concurrently
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
        configurable: true,
      })

      act(() => {
        document.dispatchEvent(new Event('visibilitychange'))
        window.dispatchEvent(new Event('focus'))
        window.dispatchEvent(new Event('pageshow'))
      })

      // Must be stopped, advanced to short break, credited exactly once
      expect(result.current.running).toBe(false)
      expect(result.current.mode).toBe('short')
      expect(result.current.stats.minutes).toBe(25)
      expect(result.current.stats.today).toBe(1)

      // Storage must have exactly 1 session
      const sessions = loadSessions()
      expect(sessions).toHaveLength(1)
      expect(sessions[0].task).toBe('Concurrent Wake Task')
      expect(sessions[0].minutes).toBe(25)

      // Webhook complete must have been dispatched exactly once
      const completeCalls = fetchSpy.mock.calls.filter((call) => {
        const body = JSON.parse(call[1]?.body as string)
        return body.event === 'complete'
      })
      expect(completeCalls).toHaveLength(1)
    })

    it('cold mount with expired session reconciles once and ignores immediate wake events', () => {
      const now = 1_700_000_000_000
      vi.setSystemTime(now)

      saveSettings({ focus: 25, short: 5, long: 15, rounds: 4, autoStart: false })
      saveStats(makeTestStats())

      const endTs = now - 60_000
      saveSession({
        mode: 'focus',
        round: 0,
        running: true,
        endTs,
        remainingMs: 0,
        task: 'Cold Mount Wake',
        taskDone: false,
      })

      const { result } = renderHook(() => useTimerEngine())

      // Should mount already reconciled
      expect(result.current.mode).toBe('short')
      expect(result.current.stats.minutes).toBe(25)
      expect(result.current.wakeNotice).toBe('Focus session completed while you were away.')
      expect(loadSessions()).toHaveLength(1)

      // Fire wake events after mount
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'))
        window.dispatchEvent(new Event('focus'))
      })

      // Must remain strictly 1 session and 25 minutes
      expect(result.current.stats.minutes).toBe(25)
      expect(loadSessions()).toHaveLength(1)
    })
  })
})



describe('Area 3: Client-Side Webhook Trigger Adversarial Stress', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
    localStorage.clear()
  })

  describe('3.1 Network Failure Simulations & Silent Error Handling', () => {
    it('offline / network failure: fetch throws TypeError ("Failed to fetch")', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))

      const settings: WebhookSettings = {
        url: 'https://api.example.com/webhook',
        enabled: true,
      }
      const payload = createWebhookPayload('start', {
        id: 's1',
        mode: 'focus',
        durationMinutes: 25,
        task: 'Offline test',
      })

      // dispatchWebhook must return false silently without throwing or unhandled rejection
      const result = await dispatchWebhook(settings, payload)
      expect(result).toBe(false)

      // testWebhook returns structured failure
      const testRes = await testWebhook('https://api.example.com/webhook')
      expect(testRes.success).toBe(false)
      expect(testRes.error).toBe('Failed to fetch')
    })

    it('timeout: fetch hangs for 10s, AbortController aborts at 5000ms', async () => {
      // Simulate hanging fetch that listens to signal.abort
      vi.spyOn(globalThis, 'fetch').mockImplementation((_url, init) => {
        return new Promise((_resolve, reject) => {
          const signal = init?.signal
          if (signal) {
            signal.addEventListener('abort', () => {
              reject(new DOMException('The operation was aborted.', 'AbortError'))
            })
          }
        })
      })

      const settings: WebhookSettings = {
        url: 'https://slow-api.example.com/webhook',
        enabled: true,
      }
      const payload = createWebhookPayload('pause', {
        id: 's2',
        mode: 'focus',
        durationMinutes: 25,
        task: 'Timeout test',
      })

      const dispatchPromise = dispatchWebhook(settings, payload)

      // Advance timers by 5000ms to trigger abort
      vi.advanceTimersByTime(5000)

      const result = await dispatchPromise
      expect(result).toBe(false)

      // Verify testWebhook also aborts and reports the error
      const testPromise = testWebhook('https://slow-api.example.com/webhook')
      vi.advanceTimersByTime(5000)
      const testRes = await testPromise
      expect(testRes.success).toBe(false)
      expect(testRes.error).toMatch(/abort/i)
    })

    it('HTTP error status codes: 400, 404, 500, 503 are handled cleanly', async () => {
      const errorStatuses = [
        { code: 400, text: 'Bad Request' },
        { code: 404, text: 'Not Found' },
        { code: 500, text: 'Internal Server Error' },
        { code: 503, text: 'Service Unavailable' },
      ]

      for (const { code, text } of errorStatuses) {
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
          new Response(JSON.stringify({ error: text }), {
            status: code,
            statusText: text,
          }),
        )

        const settings: WebhookSettings = {
          url: 'https://httpbin.org/status/' + code,
          enabled: true,
        }
        const payload = createWebhookPayload('complete', {
          id: 's-err',
          mode: 'focus',
          durationMinutes: 25,
          task: 'HTTP error test',
        })

        const dispatchOk = await dispatchWebhook(settings, payload)
        expect(dispatchOk).toBe(false)

        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
          new Response(JSON.stringify({ error: text }), {
            status: code,
            statusText: text,
          }),
        )

        const testRes = await testWebhook('https://httpbin.org/status/' + code)
        expect(testRes.success).toBe(false)
        expect(testRes.status).toBe(code)
        expect(testRes.error).toBe(`HTTP ${code}: ${text}`)
      }
    })

    it('malformed / non-JSON responses (HTML error page) do not break dispatchWebhook', async () => {
      // Server returned a 502 Bad Gateway HTML page
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('<html><body>502 Bad Gateway Cloudflare</body></html>', {
          status: 502,
          statusText: 'Bad Gateway',
          headers: { 'Content-Type': 'text/html' },
        }),
      )

      const settings: WebhookSettings = {
        url: 'https://cloudflare-gateway.example.com/webhook',
        enabled: true,
      }
      const payload = createWebhookPayload('start', {
        id: 's-html',
        mode: 'focus',
        durationMinutes: 25,
        task: 'HTML 502 test',
      })

      const ok = await dispatchWebhook(settings, payload)
      expect(ok).toBe(false)
    })

    it('dispatches successfully when server returns 200 OK or 204 No Content', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ received: true }), { status: 200 }),
      )

      const settings: WebhookSettings = {
        url: 'https://api.example.com/webhook',
        enabled: true,
      }
      const payload = createWebhookPayload('start', {
        id: 's-ok',
        mode: 'focus',
        durationMinutes: 25,
        task: 'Success test',
      })

      expect(await dispatchWebhook(settings, payload)).toBe(true)

      // 204 No Content
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(null, { status: 204 }),
      )
      expect(await dispatchWebhook(settings, payload)).toBe(true)
    })
  })

  describe('3.2 Non-Blocking Webhook Guarantee in useTimerEngine', () => {
    it('timer operations (start, pause, complete) execute synchronously and are NEVER blocked by hanging webhooks', () => {
      // Mock fetch that NEVER resolves (simulating infinite network lag)
      vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise(() => {}))

      saveWebhookSettings({
        url: 'https://infinite-lag.example.com/webhook',
        enabled: true,
      })

      const { result } = renderHook(() => useTimerEngine())

      act(() => {
        result.current.updateSettings({ focus: 1, short: 1, long: 1, rounds: 4, autoStart: false })
      })

      // Start must be instantaneous and set running=true
      const startBefore = Date.now()
      act(() => {
        result.current.start()
      })
      const startAfter = Date.now()
      expect(startAfter - startBefore).toBeLessThan(100) // Synchronous, no await
      expect(result.current.running).toBe(true)

      // Pause must be instantaneous and set running=false
      const pauseBefore = Date.now()
      act(() => {
        result.current.pause()
      })
      const pauseAfter = Date.now()
      expect(pauseAfter - pauseBefore).toBeLessThan(100)
      expect(result.current.running).toBe(false)

      // Resume and complete must advance mode to short break without hanging
      act(() => {
        result.current.start()
      })
      expect(result.current.running).toBe(true)

      act(() => {
        vi.advanceTimersByTime(60_000 + 1_000)
      })

      expect(result.current.running).toBe(false)
      expect(result.current.mode).toBe('short')
      expect(result.current.stats.minutes).toBe(1)
    })

    it('timer is completely unaffected if fetch throws synchronously', () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
        throw new Error('Synchronous network stack crash')
      })

      saveWebhookSettings({
        url: 'https://exploding.example.com/webhook',
        enabled: true,
      })

      const { result } = renderHook(() => useTimerEngine())

      act(() => {
        result.current.updateSettings({ focus: 1, short: 1, long: 1, rounds: 4, autoStart: false })
      })

      expect(() => {
        act(() => {
          result.current.start()
        })
      }).not.toThrow()
      expect(result.current.running).toBe(true)

      expect(() => {
        act(() => {
          result.current.pause()
        })
      }).not.toThrow()
      expect(result.current.running).toBe(false)
    })

    it('does not dispatch webhooks when webhook setting is disabled or URL is empty', () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch')

      saveWebhookSettings({ url: 'https://example.com/webhook', enabled: false })

      const { result } = renderHook(() => useTimerEngine())

      act(() => {
        result.current.start()
        result.current.pause()
      })

      expect(fetchSpy).not.toHaveBeenCalled()

      saveWebhookSettings({ url: '', enabled: true })

      act(() => {
        result.current.start()
      })

      expect(fetchSpy).not.toHaveBeenCalled()
    })
  })
})
