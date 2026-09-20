import type { Mode, Settings } from '../types'

export interface TimerCoreSnapshot {
  mode: Mode
  round: number
  running: boolean
  remainingMs: number
  endTs: number | null
}

export function durationOfMode(settings: Settings, mode: Mode): number {
  if (mode === 'focus') return settings.focus * 60_000
  if (mode === 'short') return settings.short * 60_000
  return settings.long * 60_000
}

export function calculateNextPhase(
  currentMode: Mode,
  currentRound: number,
  roundsSetting: number,
): { nextMode: Mode; nextRound: number } {
  if (currentMode === 'focus') {
    const nextRound = currentRound + 1
    if (nextRound >= roundsSetting) {
      return { nextMode: 'long', nextRound: 0 }
    }
    return { nextMode: 'short', nextRound }
  }
  return { nextMode: 'focus', nextRound: currentRound }
}

/**
 * Headless Timer Core State Machine (Pure In-Process Engine).
 *
 * Encapsulates wall-clock anchoring, deadline math, interval durations,
 * and phase progression rules completely independent of React DOM or view layers.
 */
export class TimerCore {
  private mode: Mode
  private round: number
  private running: boolean = false
  private remainingMs: number
  private endTs: number | null = null
  private settings: Settings

  constructor(settings: Settings, snapshot?: Partial<TimerCoreSnapshot>) {
    this.settings = { ...settings }
    this.mode = snapshot?.mode ?? 'focus'
    this.round = snapshot?.round ?? 0
    this.running = snapshot?.running ?? false
    this.endTs = snapshot?.endTs ?? null
    this.remainingMs =
      typeof snapshot?.remainingMs === 'number'
        ? snapshot.remainingMs
        : durationOfMode(this.settings, this.mode)
  }

  public getSnapshot(): TimerCoreSnapshot {
    return {
      mode: this.mode,
      round: this.round,
      running: this.running,
      remainingMs: this.remainingMs,
      endTs: this.endTs,
    }
  }

  public getTotalMs(): number {
    return durationOfMode(this.settings, this.mode)
  }

  public start(now: number = Date.now()): TimerCoreSnapshot {
    if (this.running && this.endTs !== null) {
      return this.getSnapshot()
    }
    const endTs = now + Math.max(1000, this.remainingMs)
    this.endTs = endTs
    this.running = true
    this.remainingMs = Math.max(0, endTs - now)
    return this.getSnapshot()
  }

  public pause(now: number = Date.now()): TimerCoreSnapshot {
    if (!this.running) {
      return this.getSnapshot()
    }
    const remaining = this.endTs !== null ? Math.max(0, this.endTs - now) : this.remainingMs
    this.endTs = null
    this.running = false
    this.remainingMs = remaining
    return this.getSnapshot()
  }

  public toggle(now: number = Date.now()): TimerCoreSnapshot {
    return this.running ? this.pause(now) : this.start(now)
  }

  public tick(now: number = Date.now()): { completed: boolean; snapshot: TimerCoreSnapshot } {
    if (!this.running || this.endTs === null) {
      return { completed: false, snapshot: this.getSnapshot() }
    }

    const remaining = Math.max(0, this.endTs - now)
    this.remainingMs = remaining

    if (remaining <= 0) {
      this.running = false
      this.endTs = null
      return { completed: true, snapshot: this.getSnapshot() }
    }

    return { completed: false, snapshot: this.getSnapshot() }
  }

  public complete(): {
    completedMode: Mode
    completedRound: number
    nextMode: Mode
    nextRound: number
    snapshot: TimerCoreSnapshot
  } {
    const completedMode = this.mode
    const completedRound = this.round

    const { nextMode, nextRound } = calculateNextPhase(completedMode, completedRound, this.settings.rounds)

    this.mode = nextMode
    this.round = nextRound
    this.running = false
    this.endTs = null
    this.remainingMs = durationOfMode(this.settings, nextMode)

    return {
      completedMode,
      completedRound,
      nextMode,
      nextRound,
      snapshot: this.getSnapshot(),
    }
  }

  public reset(newMode: Mode = 'focus'): TimerCoreSnapshot {
    this.mode = newMode
    this.running = false
    this.endTs = null
    this.remainingMs = durationOfMode(this.settings, newMode)
    return this.getSnapshot()
  }

  public switchMode(newMode: Mode): TimerCoreSnapshot {
    return this.reset(newMode)
  }

  public updateSettings(newSettings: Settings): TimerCoreSnapshot {
    this.settings = { ...newSettings }
    if (!this.running) {
      this.remainingMs = durationOfMode(this.settings, this.mode)
    }
    return this.getSnapshot()
  }
}
