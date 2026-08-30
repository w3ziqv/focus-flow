import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Mode, Settings, Stats } from '../types'
import { loadSession, loadSettings, loadStats, saveSession, saveSettings } from './storage'
import { recordFocusSession } from './stats'
import { audio } from './audio'

export interface TimerEvent {
  kind: 'focus' | 'break'
  at: number
}

export interface TimerEngine {
  settings: Settings
  updateSettings: (next: Settings) => void
  mode: Mode
  round: number
  running: boolean
  remainingMs: number
  totalMs: number
  task: string
  taskDone: boolean
  stats: Stats
  lastEvent: TimerEvent | null
  start: () => void
  pause: () => void
  toggle: () => void
  reset: () => void
  switchMode: (mode: Mode) => void
  setTask: (task: string) => void
}

const TICK_MS = 250

function durationOf(settings: Settings, mode: Mode): number {
  const minutes = mode === 'focus' ? settings.focus : mode === 'short' ? settings.short : settings.long
  return minutes * 60_000
}

export function useTimerEngine(): TimerEngine {
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [stats, setStats] = useState<Stats>(loadStats)
  const snapshot = useMemo(() => loadSession(), [])
  const [mode, setMode] = useState<Mode>(() => snapshot?.mode ?? 'focus')
  const [round, setRound] = useState<number>(() => snapshot?.round ?? 0)
  const [task, setTaskState] = useState<string>(() => snapshot?.task ?? '')
  const [taskDone, setTaskDone] = useState<boolean>(() => snapshot?.taskDone ?? false)
  const [lastEvent, setLastEvent] = useState<TimerEvent | null>(null)

  // `remainingMs` is the single source of truth while paused; while running it is
  // derived from endTs so a throttled background tab never drifts.
  const [remainingMs, setRemainingMs] = useState<number>(() => {
    if (!snapshot) return durationOf(loadSettings(), 'focus')
    if (snapshot.running && snapshot.endTs !== null) {
      return Math.max(0, snapshot.endTs - Date.now())
    }
    return snapshot.remainingMs
  })
  const [running, setRunning] = useState<boolean>(() => snapshot?.running === true && (snapshot?.endTs ?? 0) > Date.now())

  const endTsRef = useRef<number | null>(running && snapshot?.endTs ? snapshot.endTs : null)
  const remainingRef = useRef<number>(remainingMs)
  const runningRef = useRef<boolean>(running)
  const modeRef = useRef<Mode>(mode)
  const roundRef = useRef<number>(round)
  const settingsRef = useRef<Settings>(settings)
  const statsRef = useRef<Stats>(stats)
  const taskRef = useRef<string>(task)
  const taskDoneRef = useRef<boolean>(taskDone)

  remainingRef.current = remainingMs
  runningRef.current = running
  modeRef.current = mode
  roundRef.current = round
  settingsRef.current = settings
  statsRef.current = stats
  taskRef.current = task
  taskDoneRef.current = taskDone

  const totalMs = useMemo(() => durationOf(settings, mode), [settings, mode])

  const persist = useCallback(
    (next: { running: boolean; remainingMs: number; endTs: number | null }) => {
      saveSession({
        mode: modeRef.current,
        round: roundRef.current,
        running: next.running,
        endTs: next.endTs,
        remainingMs: next.remainingMs,
        task: taskRef.current,
        taskDone: taskDoneRef.current,
      })
    },
    [],
  )

  const start = useCallback(() => {
    if (runningRef.current) return
    if (Notification.permission === 'default') {
      void Notification.requestPermission()
    }
    const endTs = Date.now() + Math.max(1000, remainingRef.current)
    endTsRef.current = endTs
    setTaskDone(false)
    taskDoneRef.current = false
    setRunning(true)
    runningRef.current = true
    setRemainingMs(endTs - Date.now())
    persist({ running: true, remainingMs: endTs - Date.now(), endTs })
  }, [persist])

  const pause = useCallback(() => {
    if (!runningRef.current) return
    const remaining = Math.max(0, (endTsRef.current ?? Date.now()) - Date.now())
    endTsRef.current = null
    setRunning(false)
    runningRef.current = false
    setRemainingMs(remaining)
    remainingRef.current = remaining
    persist({ running: false, remainingMs: remaining, endTs: null })
  }, [persist])

  /** Fires when the countdown reaches zero: chime, stats, phase advance. */
  const complete = useCallback(() => {
    const currentMode = modeRef.current
    const currentSettings = settingsRef.current
    audio.chime()

    if (currentMode === 'focus') {
      const nextStats = recordFocusSession(statsRef.current, currentSettings.focus)
      setStats(nextStats)
      statsRef.current = nextStats
      if (taskRef.current.trim() !== '') {
        setTaskDone(true)
        taskDoneRef.current = true
      }
    }

    const finishedKind: 'focus' | 'break' = currentMode === 'focus' ? 'focus' : 'break'
    setLastEvent({ kind: finishedKind, at: Date.now() })

    if (currentMode === 'focus') {
      const nextRound = roundRef.current + 1
      if (nextRound >= currentSettings.rounds) {
        roundRef.current = 0
        setRound(0)
        modeRef.current = 'long'
        setMode('long')
      } else {
        roundRef.current = nextRound
        setRound(nextRound)
        modeRef.current = 'short'
        setMode('short')
      }
    } else {
      modeRef.current = 'focus'
      setMode('focus')
    }

    const nextRemaining = durationOf(settingsRef.current, modeRef.current)
    setRunning(false)
    runningRef.current = false
    setRemainingMs(nextRemaining)
    remainingRef.current = nextRemaining
    endTsRef.current = null
    persist({ running: false, remainingMs: nextRemaining, endTs: null })

    if (currentSettings.autoStart) {
      // Start the next phase after a beat so the completion state is visible.
      window.setTimeout(() => {
        if (!runningRef.current) start()
      }, 1200)
    }
  }, [persist, start])

  // Ticker: derive remaining time from the wall clock, never by decrementing.
  useEffect(() => {
    if (!running) return
    const tick = () => {
      const endTs = endTsRef.current
      if (endTs === null) return
      const remaining = endTs - Date.now()
      if (remaining <= 0) {
        setRemainingMs(0)
        remainingRef.current = 0
        setRunning(false)
        runningRef.current = false
        complete()
        return
      }
      setRemainingMs(remaining)
      remainingRef.current = remaining
    }
    tick()
    const id = window.setInterval(tick, TICK_MS)
    return () => window.clearInterval(id)
  }, [running, complete])

  const reset = useCallback(() => {
    const next = durationOf(settingsRef.current, modeRef.current)
    endTsRef.current = null
    setRunning(false)
    runningRef.current = false
    setRemainingMs(next)
    remainingRef.current = next
    setTaskDone(false)
    taskDoneRef.current = false
    persist({ running: false, remainingMs: next, endTs: null })
  }, [persist])

  const switchMode = useCallback(
    (nextMode: Mode) => {
      if (nextMode === modeRef.current && !runningRef.current) return
      if (nextMode === 'focus' && roundRef.current >= settingsRef.current.rounds) {
        roundRef.current = 0
        setRound(0)
      }
      modeRef.current = nextMode
      setMode(nextMode)
      const next = durationOf(settingsRef.current, nextMode)
      endTsRef.current = null
      setRunning(false)
      runningRef.current = false
      setRemainingMs(next)
      remainingRef.current = next
      setTaskDone(false)
      taskDoneRef.current = false
      persist({ running: false, remainingMs: next, endTs: null })
    },
    [persist],
  )

  const updateSettings = useCallback(
    (next: Settings) => {
      setSettings(next)
      settingsRef.current = next
      saveSettings(next)
      // Match the original behavior: saving settings resets the current phase.
      const nextRemaining = durationOf(next, modeRef.current)
      endTsRef.current = null
      setRunning(false)
      runningRef.current = false
      setRemainingMs(nextRemaining)
      remainingRef.current = nextRemaining
      persist({ running: false, remainingMs: nextRemaining, endTs: null })
    },
    [persist],
  )

  const setTask = useCallback((value: string) => {
    const trimmed = value.slice(0, 200)
    setTaskState(trimmed)
    taskRef.current = trimmed
    saveSession({
      mode: modeRef.current,
      round: roundRef.current,
      running: runningRef.current,
      endTs: endTsRef.current,
      remainingMs: remainingRef.current,
      task: trimmed,
      taskDone: taskDoneRef.current,
    })
  }, [])

  const toggle = useCallback(() => {
    if (runningRef.current) pause()
    else start()
  }, [pause, start])

  useEffect(() => {
    return () => {
      audio.dispose()
    }
  }, [])

  return {
    settings,
    updateSettings,
    mode,
    round,
    running,
    remainingMs,
    totalMs,
    task,
    taskDone,
    stats,
    lastEvent,
    start,
    pause,
    toggle,
    reset,
    switchMode,
    setTask,
  }
}
