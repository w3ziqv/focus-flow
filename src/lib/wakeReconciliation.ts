import { translate } from './translations'
/**
 * Reconciles sessions that expired while the system was asleep or tab was suspended.
 */

import type { Lang, Mode, SessionSnapshotV2, Settings, StatsV2, TimerMode } from '../types'
import { loadSession, saveSession } from './storage'
import { FocusStore } from './store'
import { calculateNextPhase } from './timerCore'

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
    elapsedMinutes = snapshot.phaseSettings?.focus ?? settings.focus
    // Legacy snapshots have no ID; the persisted deadline is a stable retry key.
    const sessionId = snapshot.id || `wake_${endTs.toString(36)}`
    newStats = FocusStore.recordSession({
      id: sessionId,
      date: new Date(endTs).toISOString(),
      minutes: elapsedMinutes,
      task: typeof snapshot.task === 'string' && snapshot.task.trim() !== '' ? snapshot.task.trim() : null,
      checklist: snapshot.checklist && snapshot.checklist.length > 0 ? [...snapshot.checklist] : undefined,
    }, stats, new Date(now)).stats

    notice = translate(lang, 'wakeReconciled')
  }

  // Next mode and next round calculation
  const { nextMode: newMode, nextRound: newRound } = calculateNextPhase(snapshot.mode, snapshot.round, settings.rounds)

  const nextRemainingMs = durationOfMode(settings, newMode)

  const newSnapshot: SessionSnapshotV2 = {
    ...(snapshot.phaseSettings ? {phaseSettings: settings} : {}),
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
