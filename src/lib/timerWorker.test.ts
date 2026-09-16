import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTimerTicker, type WorkerInMessage, type WorkerOutMessage } from './timerWorker'

describe('createTimerTicker', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('Fallback mode (window.setInterval when Worker is undefined)', () => {
    it('creates a ticker that calls onTick periodically using setInterval fallback', () => {
      const onTick = vi.fn()
      const ticker = createTimerTicker(onTick)

      ticker.start(250)
      expect(onTick).not.toHaveBeenCalled()

      vi.advanceTimersByTime(250)
      expect(onTick).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(500)
      expect(onTick).toHaveBeenCalledTimes(3)

      ticker.stop()
      vi.advanceTimersByTime(500)
      expect(onTick).toHaveBeenCalledTimes(3)
    })

    it('handles start() default interval of 250ms', () => {
      const onTick = vi.fn()
      const ticker = createTimerTicker(onTick)

      ticker.start()
      vi.advanceTimersByTime(250)
      expect(onTick).toHaveBeenCalledTimes(1)

      ticker.stop()
    })

    it('is idempotent when start() is called repeatedly', () => {
      const onTick = vi.fn()
      const ticker = createTimerTicker(onTick)

      ticker.start(250)
      ticker.start(250)
      ticker.start(250)

      vi.advanceTimersByTime(250)
      expect(onTick).toHaveBeenCalledTimes(1)

      ticker.stop()
    })

    it('can restart after stop() is called', () => {
      const onTick = vi.fn()
      const ticker = createTimerTicker(onTick)

      ticker.start(250)
      vi.advanceTimersByTime(250)
      expect(onTick).toHaveBeenCalledTimes(1)

      ticker.stop()
      vi.advanceTimersByTime(500)
      expect(onTick).toHaveBeenCalledTimes(1)

      ticker.start(250)
      vi.advanceTimersByTime(250)
      expect(onTick).toHaveBeenCalledTimes(2)

      ticker.stop()
    })

    it('stop() is safe to call when not started', () => {
      const onTick = vi.fn()
      const ticker = createTimerTicker(onTick)
      expect(() => ticker.stop()).not.toThrow()
    })
  })

  describe('Worker mode (when Worker is available in environment)', () => {
    class MockWorker {
      static instances: MockWorker[] = []
      onmessage: ((event: MessageEvent<WorkerOutMessage>) => void) | null = null
      messagesPosted: WorkerInMessage[] = []
      terminated = false

      constructor(public url: URL, public options?: WorkerOptions) {
        MockWorker.instances.push(this)
      }

      postMessage(msg: WorkerInMessage): void {
        this.messagesPosted.push(msg)
      }

      terminate(): void {
        this.terminated = true
      }

      // Test helper to simulate worker tick
      emitTick(): void {
        if (this.onmessage) {
          this.onmessage({ data: { type: 'tick' } } as MessageEvent<WorkerOutMessage>)
        }
      }
    }

    beforeEach(() => {
      MockWorker.instances = []
      vi.stubGlobal('Worker', MockWorker)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('instantiates Web Worker and posts start message', () => {
      const onTick = vi.fn()
      const ticker = createTimerTicker(onTick)

      ticker.start(250)
      expect(MockWorker.instances).toHaveLength(1)
      const instance = MockWorker.instances[0]
      expect(instance.messagesPosted).toContainEqual({ type: 'start', intervalMs: 250 })

      // Simulate tick from worker
      instance.emitTick()
      expect(onTick).toHaveBeenCalledTimes(1)
      instance.emitTick()
      expect(onTick).toHaveBeenCalledTimes(2)

      ticker.stop()
      expect(instance.messagesPosted).toContainEqual({ type: 'stop' })
      expect(instance.terminated).toBe(true)
    })

    it('falls back to setInterval if new Worker throws an error', () => {
      vi.stubGlobal('Worker', class FailingWorker {
        constructor() {
          throw new Error('SecurityError: Worker creation blocked by CSP')
        }
      })

      const onTick = vi.fn()
      const ticker = createTimerTicker(onTick)

      // Should not throw, should fall back to setInterval
      expect(() => ticker.start(250)).not.toThrow()

      vi.advanceTimersByTime(250)
      expect(onTick).toHaveBeenCalledTimes(1)

      ticker.stop()
      vi.advanceTimersByTime(250)
      expect(onTick).toHaveBeenCalledTimes(1)
    })

    it('re-creates worker cleanly if start() is called after stop()', () => {
      const onTick = vi.fn()
      const ticker = createTimerTicker(onTick)

      ticker.start(250)
      expect(MockWorker.instances).toHaveLength(1)
      expect(MockWorker.instances[0].terminated).toBe(false)

      ticker.stop()
      expect(MockWorker.instances[0].terminated).toBe(true)

      ticker.start(250)
      expect(MockWorker.instances).toHaveLength(2)
      expect(MockWorker.instances[1].terminated).toBe(false)

      ticker.stop()
      expect(MockWorker.instances[1].terminated).toBe(true)
    })
  })
})
