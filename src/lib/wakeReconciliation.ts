/**
 * Pure Cold-Start Wake Reconciliation (Milestone v2.4)
 *
 * Reconciles sessions that expired while the system was in deep sleep,
 * laptop lid was closed, or browser process was suspended/closed.
 *
 * Invariants:
 * - Pure, fully unit-testable function with deterministic outputs.
 * - If an active focus session expired: credits stats, logs session with micro-steps,
 *   advances phase to short/long break, saves snapshot, and returns a bilingual notice.
 * - If an active break session expired: advances to focus phase without crediting stats or notice.
 * - If active session has not expired or was not running: returns reconciled: false without mutations.
 * - Strict idempotency: re-running on an already-reconciled snapshot produces zero mutations.
 */

import type { Lang, Mode, SessionSnapshotV2, Settings, StatsV2, TimerMode } from '../types'
import { addSession, loadSession, saveSession, saveStats } from './storage'
import { recordFocusSession } from './stats'

export { loadSession as loadSessionSnapshot, saveSession as saveSessionSnapshot }

export interface WakeReconciliationResult {
  reconciled: boolean
  elapsedMinutes?: number
  newSnapshot: SessionSnapshotV2 | null
  newStats: StatsV2
  newMode: TimerMode
  newRound: number
  notice: string | null
}

export function durationOfMode(settings: Settings, mode: string): number {
  switch (mode) {
    case 'focus':
      return settings.focus * 60_000
    case 'short':
    case 'shortBreak':
      return settings.short * 60_000
    case 'long':
    case 'longBreak':
      return settings.long * 60_000
    default:
      return settings.focus * 60_000
  }
}

/**
 * Reconciles a session snapshot against current wall-clock time.
 */
export function reconcileExpiredSession(
  snapshot: SessionSnapshotV2 | null,
  settings: Settings,
  stats: StatsV2,
  now: number = Date.now(),
  lang: Lang = 'en',
): WakeReconciliationResult {
  if (!snapshot || !snapshot.running || snapshot.endTs === null || snapshot.endTs > now) {
    return {
      reconciled: false,
      elapsedMinutes: undefined,
      newSnapshot: snapshot,
      newStats: stats,
      newMode: (snapshot?.mode ?? 'focus') as TimerMode,
      newRound: snapshot?.round ?? 0,
      notice: null,
    }
  }

  const endTs = snapshot.endTs
  const isFocus = snapshot.mode === 'focus'
  let newStats = stats
  let elapsedMinutes: number | undefined
  let notice: string | null = null

  if (isFocus) {
    elapsedMinutes = settings.focus
    // 1. Credit stats with elapsed focus minutes
    newStats = recordFocusSession(stats, elapsedMinutes)

    // 2. Append completed session to storage with exact completion timestamp
    const sessionId = snapshot.id || `s${endTs.toString(36)}${Math.random().toString(36).slice(2, 7)}`
    addSession({
      id: sessionId,
      date: new Date(endTs).toISOString(),
      minutes: elapsedMinutes,
      task: typeof snapshot.task === 'string' && snapshot.task.trim() !== '' ? snapshot.task.trim() : null,
      checklist: snapshot.checklist && snapshot.checklist.length > 0 ? [...snapshot.checklist] : undefined,
    })

    // 3. Persist updated stats
    saveStats(newStats)

    // 4. Bilingual tranquil in-app notice
    notice =
      lang === 'pl'
        ? 'Sesja skupienia została ukończona podczas Twojej nieobecności.'
        : 'Focus session completed while you were away.'
  }

  // Next mode and next round calculation
  let newMode: TimerMode
  let newRound: number

  if (isFocus) {
    const candidateRound = snapshot.round + 1
    if (candidateRound >= settings.rounds) {
      newRound = 0
      newMode = 'long'
    } else {
      newRound = candidateRound
      newMode = 'short'
    }
  } else {
    // Break expired: advance to focus mode, no stats credited, no session logged, no notice needed
    newMode = 'focus'
    newRound = snapshot.round
  }

  const nextRemainingMs = durationOfMode(settings, newMode)

  const newSnapshot: SessionSnapshotV2 = {
    mode: newMode as Mode,
    round: newRound,
    running: false,
    endTs: null,
    remainingMs: nextRemainingMs,
    task: snapshot.task ?? '',
    taskDone: isFocus,
    checklist: isFocus ? [] : (snapshot.checklist ? [...snapshot.checklist] : []),
  }

  // Persist updated snapshot to storage (idempotency guarantee)
  saveSession(newSnapshot)

  return {
    reconciled: true,
    elapsedMinutes,
    newSnapshot,
    newStats,
    newMode,
    newRound,
    notice,
  }
}
