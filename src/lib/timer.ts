import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChecklistItem, GoalSettings, Mode, SessionSnapshotV2, Settings, StatsV2 } from '../types'
import {
  isChecklist,
  loadGoals,
  loadLang,
  loadSession,
  loadSettings,
  loadStats,
  loadWebhookSettings,
  saveGoals,
  saveSession,
  saveSettings,
} from './storage'
import { recordFocusSession } from './stats'
import { addSession } from './sessions'
import { audio } from './audio'
import { getNotificationPermission, requestNotificationPermission } from './notifications'
import { createTimerTicker } from './timerWorker'
import { reconcileExpiredSession } from './wakeReconciliation'
import { createWebhookPayload, dispatchWebhook } from './webhook'

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
  stats: StatsV2
  lastEvent: TimerEvent | null
  start: () => void
  pause: () => void
  toggle: () => void
  reset: () => void
  switchMode: (mode: Mode) => void
  setTask: (task: string) => void
  checklist: ChecklistItem[]
  setChecklist: (items: ChecklistItem[]) => void
  addChecklistItem: (text: string) => void
  toggleChecklistItem: (id: string) => void
  removeChecklistItem: (id: string) => void
  goals: GoalSettings
  updateGoals: (next: GoalSettings) => void
  goalCelebration: boolean
  refreshStats: () => void
  setStats: (next: StatsV2) => void
  wakeNotice: string | null
  dismissWakeNotice: () => void
}

const TICK_MS = 250

function durationOf(settings: Settings, mode: Mode): number {
  const minutes = mode === 'focus' ? settings.focus : mode === 'short' ? settings.short : settings.long
  return minutes * 60_000
}

function getInitialTimerData(): {
  snapshot: SessionSnapshotV2 | null
  stats: StatsV2
  wakeNotice: string | null
} {
  const rawSnapshot = loadSession()
  const currentSettings = loadSettings()
  const currentStats = loadStats()
  const now = Date.now()

  if (rawSnapshot?.running === true && rawSnapshot.endTs !== null && rawSnapshot.endTs <= now) {
    const lang = loadLang() ?? 'en'
    const reconciliation = reconcileExpiredSession(rawSnapshot, currentSettings, currentStats, now, lang)
    return {
      snapshot: reconciliation.newSnapshot,
      stats: reconciliation.newStats,
      wakeNotice: reconciliation.notice,
    }
  }

  return {
    snapshot: rawSnapshot,
    stats: currentStats,
    wakeNotice: null,
  }
}

export function useTimerEngine(): TimerEngine {
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [initialData] = useState(getInitialTimerData)

  const [stats, setStats] = useState<StatsV2>(() => initialData.stats)
  const [wakeNotice, setWakeNotice] = useState<string | null>(() => initialData.wakeNotice)

  const snapshot = initialData.snapshot
  const [mode, setMode] = useState<Mode>(() => snapshot?.mode ?? 'focus')
  const [round, setRound] = useState<number>(() => snapshot?.round ?? 0)
  const [task, setTaskState] = useState<string>(() => snapshot?.task ?? '')
  const [taskDone, setTaskDone] = useState<boolean>(() => snapshot?.taskDone ?? false)
  const [checklist, setChecklistState] = useState<ChecklistItem[]>(() => snapshot?.checklist ?? [])
  const [goals, setGoals] = useState<GoalSettings>(loadGoals)
  const [goalCelebration, setGoalCelebration] = useState<boolean>(false)
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
  const statsRef = useRef<StatsV2>(stats)
  const taskRef = useRef<string>(task)
  const taskDoneRef = useRef<boolean>(taskDone)
  const checklistRef = useRef<ChecklistItem[]>(checklist)
  const goalsRef = useRef<GoalSettings>(goals)
  const autoStartTimer = useRef<number | null>(null)
  const celebrationTimer = useRef<number | null>(null)
  const sessionIdRef = useRef<string | null>(null)

  const triggerWebhook = useCallback(
    (event: 'start' | 'pause' | 'complete', overrideSessionId?: string, overrideMode?: Mode) => {
      try {
        const webhookSettings = loadWebhookSettings()
        if (!webhookSettings.enabled || !webhookSettings.url) return

        const activeMode = overrideMode ?? modeRef.current
        const activeSettings = settingsRef.current
        const durationMinutes =
          activeMode === 'focus'
            ? activeSettings.focus
            : activeMode === 'short'
              ? activeSettings.short
              : activeSettings.long

        const sid =
          overrideSessionId ??
          sessionIdRef.current ??
          `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`

        const payload = createWebhookPayload(event, {
          id: sid,
          mode: activeMode,
          durationMinutes,
          task: taskRef.current.trim() !== '' ? taskRef.current.trim() : null,
          checklist: checklistRef.current.length > 0 ? [...checklistRef.current] : undefined,
        })

        void dispatchWebhook(webhookSettings, payload)
      } catch {
        // Non-blocking silent error handling
      }
    },
    [],
  )

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
        checklist: checklistRef.current,
      })
    },
    [],
  )

  const start = useCallback(() => {
    if (runningRef.current) return
    if (getNotificationPermission() === 'default') {
      void requestNotificationPermission()
    }
    const endTs = Date.now() + Math.max(1000, remainingRef.current)
    endTsRef.current = endTs
    remainingRef.current = endTs - Date.now()
    setTaskDone(false)
    taskDoneRef.current = false
    setRunning(true)
    runningRef.current = true
    setRemainingMs(endTs - Date.now())
    persist({ running: true, remainingMs: endTs - Date.now(), endTs })

    if (!sessionIdRef.current) {
      sessionIdRef.current = `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
    }
    triggerWebhook('start', sessionIdRef.current)
  }, [persist, triggerWebhook])

  const pause = useCallback(() => {
    if (!runningRef.current) return
    const remaining = Math.max(0, (endTsRef.current ?? Date.now()) - Date.now())
    endTsRef.current = null
    setRunning(false)
    runningRef.current = false
    setRemainingMs(remaining)
    remainingRef.current = remaining
    persist({ running: false, remainingMs: remaining, endTs: null })
    triggerWebhook('pause', sessionIdRef.current ?? undefined)
  }, [persist, triggerWebhook])

  /** Fires when the countdown reaches zero: chime, stats, phase advance. */
  const complete = useCallback(() => {
    const currentMode = modeRef.current
    const currentSettings = settingsRef.current
    const currentSessionId =
      sessionIdRef.current ?? `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`

    if (currentMode === 'focus') {
      const todayKey = new Date().toDateString()
      const prevTodayMinutes = statsRef.current.history[todayKey] ?? 0
      const nextStats = recordFocusSession(statsRef.current, currentSettings.focus)
      setStats(nextStats)
      statsRef.current = nextStats

      // Record completed session
      addSession({
        id: currentSessionId,
        date: new Date().toISOString(),
        minutes: currentSettings.focus,
        task: taskRef.current.trim() !== '' ? taskRef.current.trim() : null,
        checklist: checklistRef.current.length > 0 ? [...checklistRef.current] : undefined,
      })

      if (taskRef.current.trim() !== '') {
        setTaskDone(true)
        taskDoneRef.current = true
      }

      // Check daily target goal celebration
      const currentGoals = goalsRef.current
      const newTodayMinutes = nextStats.history[todayKey] ?? 0
      if (
        currentGoals.enabled &&
        currentGoals.dailyTargetMinutes > 0 &&
        prevTodayMinutes < currentGoals.dailyTargetMinutes &&
        newTodayMinutes >= currentGoals.dailyTargetMinutes
      ) {
        setGoalCelebration(true)
        audio.playChime()
        if (celebrationTimer.current !== null) {
          window.clearTimeout(celebrationTimer.current)
        }
        celebrationTimer.current = window.setTimeout(() => {
          setGoalCelebration(false)
          celebrationTimer.current = null
        }, 3000)
      }

      // Reset micro-steps checklist for the next session
      setChecklistState([])
      checklistRef.current = []
    }

    // Trigger complete webhook before resetting sessionId
    triggerWebhook('complete', currentSessionId, currentMode)
    sessionIdRef.current = null

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
      autoStartTimer.current = window.setTimeout(() => {
        autoStartTimer.current = null
        if (!runningRef.current) start()
      }, 1200)
    }
  }, [persist, start, triggerWebhook])

  // Ticker: unthrottled Web Worker ticker with fallback
  useEffect(() => {
    if (!running) return
    const ticker = createTimerTicker(() => {
      const endTs = endTsRef.current
      if (endTs === null) return
      const remaining = endTs - Date.now()
      if (remaining <= 0) {
        setRemainingMs(0)
        remainingRef.current = 0
        setRunning(false)
        runningRef.current = false
        ticker.stop()
        complete()
        return
      }
      setRemainingMs(remaining)
      remainingRef.current = remaining
    })

    ticker.start(TICK_MS)
    return () => {
      ticker.stop()
    }
  }, [running, complete])

  // Sleep / Tab wake detection
  useEffect(() => {
    const handleWakeCheck = (): void => {
      const now = Date.now()
      // Deadline passed in memory while tab was asleep or hidden
      if (runningRef.current && endTsRef.current !== null && endTsRef.current <= now) {
        if (modeRef.current === 'focus') {
          const lang = loadLang() ?? 'en'
          setWakeNotice(
            lang === 'pl'
              ? 'Sesja skupienia została ukończona podczas Twojej nieobecności.'
              : 'Focus session completed while you were away.',
          )
        }
        setRemainingMs(0)
        remainingRef.current = 0
        setRunning(false)
        runningRef.current = false
        complete()
        return
      }

      // Reconcile persisted snapshot if tab woke with stale state
      const snap = loadSession()
      if (snap?.running === true && snap.endTs !== null && snap.endTs <= now) {
        const lang = loadLang() ?? 'en'
        const reconciliation = reconcileExpiredSession(
          snap,
          settingsRef.current,
          statsRef.current,
          now,
          lang,
        )
        if (reconciliation.reconciled) {
          setMode(reconciliation.newMode as Mode)
          modeRef.current = reconciliation.newMode as Mode
          setRound(reconciliation.newRound)
          roundRef.current = reconciliation.newRound
          setStats(reconciliation.newStats)
          statsRef.current = reconciliation.newStats
          setRunning(false)
          runningRef.current = false
          endTsRef.current = null
          const nextRemaining = durationOf(settingsRef.current, reconciliation.newMode as Mode)
          setRemainingMs(nextRemaining)
          remainingRef.current = nextRemaining
          if (reconciliation.notice) {
            setWakeNotice(reconciliation.notice)
          }
        }
      }
    }

    const onVisibilityChange = (): void => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        handleWakeCheck()
      }
    }

    const onFocus = (): void => {
      handleWakeCheck()
    }

    const onPageShow = (): void => {
      handleWakeCheck()
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onFocus)
      window.addEventListener('pageshow', onPageShow)
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange)
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', onFocus)
        window.removeEventListener('pageshow', onPageShow)
      }
    }
  }, [complete])

  const reset = useCallback(() => {
    if (autoStartTimer.current !== null) {
      window.clearTimeout(autoStartTimer.current)
      autoStartTimer.current = null
    }
    sessionIdRef.current = null
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
      if (autoStartTimer.current !== null) {
        window.clearTimeout(autoStartTimer.current)
        autoStartTimer.current = null
      }
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
      checklist: checklistRef.current,
    })
  }, [])

  const setChecklist = useCallback((items: ChecklistItem[]) => {
    const sanitized = (isChecklist(items) ?? []).slice(0, 3)
    setChecklistState(sanitized)
    checklistRef.current = sanitized
    saveSession({
      mode: modeRef.current,
      round: roundRef.current,
      running: runningRef.current,
      endTs: endTsRef.current,
      remainingMs: remainingRef.current,
      task: taskRef.current,
      taskDone: taskDoneRef.current,
      checklist: sanitized,
    })
  }, [])

  const addChecklistItem = useCallback((text: string) => {
    const trimmed = text.trim().slice(0, 140)
    if (!trimmed || checklistRef.current.length >= 3) return
    const item: ChecklistItem = {
      id: `chk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      text: trimmed,
      completed: false,
    }
    const next = [...checklistRef.current, item]
    checklistRef.current = next
    setChecklistState(next)
    saveSession({
      mode: modeRef.current,
      round: roundRef.current,
      running: runningRef.current,
      endTs: endTsRef.current,
      remainingMs: remainingRef.current,
      task: taskRef.current,
      taskDone: taskDoneRef.current,
      checklist: next,
    })
  }, [])

  const toggleChecklistItem = useCallback((id: string) => {
    const next = checklistRef.current.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item,
    )
    checklistRef.current = next
    setChecklistState(next)
    saveSession({
      mode: modeRef.current,
      round: roundRef.current,
      running: runningRef.current,
      endTs: endTsRef.current,
      remainingMs: remainingRef.current,
      task: taskRef.current,
      taskDone: taskDoneRef.current,
      checklist: next,
    })
  }, [])

  const removeChecklistItem = useCallback((id: string) => {
    const next = checklistRef.current.filter((item) => item.id !== id)
    checklistRef.current = next
    setChecklistState(next)
    saveSession({
      mode: modeRef.current,
      round: roundRef.current,
      running: runningRef.current,
      endTs: endTsRef.current,
      remainingMs: remainingRef.current,
      task: taskRef.current,
      taskDone: taskDoneRef.current,
      checklist: next,
    })
  }, [])

  const updateGoals = useCallback((next: GoalSettings) => {
    setGoals(next)
    goalsRef.current = next
    saveGoals(next)
  }, [])

  const toggle = useCallback(() => {
    if (runningRef.current) pause()
    else start()
  }, [pause, start])

  useEffect(() => {
    return () => {
      if (autoStartTimer.current !== null) window.clearTimeout(autoStartTimer.current)
      if (celebrationTimer.current !== null) window.clearTimeout(celebrationTimer.current)
      audio.dispose()
    }
  }, [])

  const refreshStats = useCallback(() => {
    const loaded = loadStats()
    setStats(loaded)
    statsRef.current = loaded
  }, [])

  const setStatsCallback = useCallback((next: StatsV2) => {
    setStats(next)
    statsRef.current = next
  }, [])

  const dismissWakeNotice = useCallback((): void => {
    setWakeNotice(null)
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
    checklist,
    setChecklist,
    addChecklistItem,
    toggleChecklistItem,
    removeChecklistItem,
    goals,
    updateGoals,
    goalCelebration,
    refreshStats,
    setStats: setStatsCallback,
    wakeNotice,
    dismissWakeNotice,
  }
}
