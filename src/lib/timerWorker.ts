/**
 * Background heartbeat ticker using a dedicated Web Worker to prevent
 * browser timer throttling when the tab is inactive or hidden.
 */

export interface WorkerStartMessage {
  type: 'start'
  intervalMs?: number
}

export interface WorkerStopMessage {
  type: 'stop'
}

export type WorkerInMessage = WorkerStartMessage | WorkerStopMessage

export interface WorkerTickMessage {
  type: 'tick'
}

export type WorkerOutMessage = WorkerTickMessage

export interface TimerTicker {
  start: (intervalMs?: number) => void
  stop: () => void
}

/**
 * Self-execution block when running inside dedicated Web Worker scope.
 */
// SAFETY: Worker global scope check in worker context
const isDedicatedWorker =
  typeof window === 'undefined' &&
  typeof document === 'undefined' &&
  typeof self !== 'undefined' &&
  typeof (self as unknown as Worker).postMessage === 'function'

if (isDedicatedWorker) {
  let intervalId: ReturnType<typeof setInterval> | null = null

  self.onmessage = (event: MessageEvent<WorkerInMessage>): void => {
    const data = event.data
    if (!data || typeof data !== 'object') return

    if (data.type === 'start') {
      if (intervalId !== null) {
        clearInterval(intervalId)
      }
      const interval =
        typeof data.intervalMs === 'number' && Number.isFinite(data.intervalMs) && data.intervalMs > 0
          ? data.intervalMs
          : 250
      intervalId = setInterval(() => {
        // SAFETY: self is a dedicated Worker instance in worker scope
        const workerSelf = self as unknown as Worker
        workerSelf.postMessage({ type: 'tick' } satisfies WorkerOutMessage)
      }, interval)
    } else if (data.type === 'stop') {
      if (intervalId !== null) {
        clearInterval(intervalId)
        intervalId = null
      }
    }
  }
}

/**
 * Creates an unthrottled background timer ticker.
 *
 * In browser environments with Worker support, instantiates a dedicated Web Worker.
 * In headless, test, or non-worker environments, cleanly falls back to window.setInterval.
 */
export function createTimerTicker(onTick: () => void): TimerTicker {
  let worker: Worker | null = null
  let fallbackId: ReturnType<typeof setInterval> | null = null
  let running = false

  const start = (intervalMs: number = 250): void => {
    if (running) return
    running = true

    if (typeof Worker !== 'undefined') {
      try {
        if (!worker) {
          worker = new Worker(new URL('./timerWorker.ts', import.meta.url), { type: 'module' })
          worker.onmessage = (event: MessageEvent<WorkerOutMessage>): void => {
            if (event.data?.type === 'tick') {
              onTick()
            }
          }
        }
        worker.postMessage({ type: 'start', intervalMs } satisfies WorkerInMessage)
        return
      } catch {
        // Fall back to window.setInterval if Worker instantiation throws (e.g. CSP restrictions)
        if (worker) {
          try {
            worker.terminate()
          } catch {
            // Ignore worker termination errors
          }
          worker = null
        }
      }
    }

    // Fallback ticker: window.setInterval (JSDOM, headless, or worker disabled)
    if (fallbackId !== null) {
      clearInterval(fallbackId)
    }
    fallbackId = setInterval(onTick, intervalMs)
  }

  const stop = (): void => {
    running = false
    if (worker) {
      try {
        worker.postMessage({ type: 'stop' } satisfies WorkerInMessage)
        worker.terminate()
      } catch {
        // Ignore worker termination errors
      }
      worker = null
    }
    if (fallbackId !== null) {
      clearInterval(fallbackId)
      fallbackId = null
    }
  }

  return { start, stop }
}
