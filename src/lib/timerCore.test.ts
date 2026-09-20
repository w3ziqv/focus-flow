import { describe, expect, it } from 'vitest'
import { calculateNextPhase, durationOfMode, TimerCore } from './timerCore'
import type { Settings } from '../types'

describe('TimerCore (Headless State Machine)', () => {
  const defaultSettings: Settings = {
    focus: 25,
    short: 5,
    long: 15,
    rounds: 4,
    autoStart: false,
  }

  it('computes correct duration for all 3 modes', () => {
    expect(durationOfMode(defaultSettings, 'focus')).toBe(25 * 60_000)
    expect(durationOfMode(defaultSettings, 'short')).toBe(5 * 60_000)
    expect(durationOfMode(defaultSettings, 'long')).toBe(15 * 60_000)
  })

  it('calculates next phase advancing rounds and transitioning to long break', () => {
    // Focus round 0 -> Short break round 1
    expect(calculateNextPhase('focus', 0, 4)).toEqual({ nextMode: 'short', nextRound: 1 })
    // Focus round 3 (4th round) -> Long break round 0
    expect(calculateNextPhase('focus', 3, 4)).toEqual({ nextMode: 'long', nextRound: 0 })
    // Break -> Focus keeping same round
    expect(calculateNextPhase('short', 1, 4)).toEqual({ nextMode: 'focus', nextRound: 1 })
    expect(calculateNextPhase('long', 0, 4)).toEqual({ nextMode: 'focus', nextRound: 0 })
  })

  it('starts and pauses with wall-clock precision', () => {
    const timer = new TimerCore(defaultSettings)
    const t0 = 1_000_000

    const startSnap = timer.start(t0)
    expect(startSnap.running).toBe(true)
    expect(startSnap.endTs).toBe(t0 + 25 * 60_000)

    // Tick at t0 + 60s
    const tickResult = timer.tick(t0 + 60_000)
    expect(tickResult.completed).toBe(false)
    expect(tickResult.snapshot.remainingMs).toBe(24 * 60_000)

    // Pause at t0 + 60s
    const pauseSnap = timer.pause(t0 + 60_000)
    expect(pauseSnap.running).toBe(false)
    expect(pauseSnap.endTs).toBeNull()
    expect(pauseSnap.remainingMs).toBe(24 * 60_000)
  })

  it('detects completion on tick when deadline elapses', () => {
    const timer = new TimerCore(defaultSettings)
    const t0 = 1_000_000
    timer.start(t0)

    const result = timer.tick(t0 + 25 * 60_000)
    expect(result.completed).toBe(true)
    expect(result.snapshot.running).toBe(false)
  })

  it('advances phase cleanly upon complete()', () => {
    const timer = new TimerCore(defaultSettings)
    const outcome = timer.complete()
    expect(outcome.completedMode).toBe('focus')
    expect(outcome.completedRound).toBe(0)
    expect(outcome.nextMode).toBe('short')
    expect(outcome.nextRound).toBe(1)
    expect(outcome.snapshot.mode).toBe('short')
    expect(outcome.snapshot.remainingMs).toBe(5 * 60_000)
  })
})
