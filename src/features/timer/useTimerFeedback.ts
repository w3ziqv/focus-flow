import { useCallback, useEffect, useRef } from 'react'
import { audioSubsystem } from '../../lib/audioSubsystem'
import { dispatchNotification, triggerHapticFeedback } from '../../lib/notifications'
import { announceTimerEvent } from '../../lib/speech'
import { useI18n } from '../../lib/i18n'
import type { TimerEngine } from '../../lib/timer'
import type { InterfacePrefs } from '../../types'

export function useTimerFeedback(engine: TimerEngine, interfacePrefs: InterfacePrefs): void {
  const { t, lang } = useI18n()
  const lastHandledEventRef = useRef<number | null>(null)

  const handleCompletion = useCallback(
    (kind: 'focus' | 'break', taskTitle: string) => {
      const title = t(kind === 'focus' ? 'session.complete' : 'break.complete')
      const currentTask = taskTitle.trim()
      const body = kind === 'focus' && currentTask !== '' ? currentTask : undefined

      try {
        audioSubsystem.playChime()
      } catch {
        // Stay silent if browser blocks audio autoplay
      }

      // Native haptic feedback triggered upon session completion
      triggerHapticFeedback()

      announceTimerEvent(
        { type: kind === 'focus' ? 'session-complete' : 'break-complete', task: currentTask },
        interfacePrefs.narration,
        lang,
      )

      // Unified mobile ServiceWorker and desktop notification dispatcher
      void dispatchNotification(title, { body, hapticFeedback: false })
    },
    [t, interfacePrefs.narration, lang],
  )

  useEffect(() => {
    if (engine.lastEvent === null) return
    if (lastHandledEventRef.current === engine.lastEvent.at) return
    lastHandledEventRef.current = engine.lastEvent.at
    handleCompletion(engine.lastEvent.kind, engine.task)
  }, [engine.lastEvent, engine.task, handleCompletion])

  const prevRunningRef = useRef(engine.running)
  const prevRoundRef = useRef(engine.round)
  const prevModeRef = useRef(engine.mode)

  useEffect(() => {
    if (prevRunningRef.current !== engine.running) {
      if (engine.running) {
        announceTimerEvent(
          { type: 'session-start', task: engine.task },
          interfacePrefs.narration,
          lang,
        )
      } else if (lastHandledEventRef.current !== engine.lastEvent?.at) {
        // Paused manually by user (not an auto-completion)
        announceTimerEvent(
          { type: 'session-pause' },
          interfacePrefs.narration,
          lang,
        )
      }
      prevRunningRef.current = engine.running
    }
  }, [engine.running, engine.task, engine.lastEvent, interfacePrefs.narration, lang])

  useEffect(() => {
    if (prevRoundRef.current !== engine.round) {
      if (engine.round > prevRoundRef.current) {
        announceTimerEvent(
          { type: 'round-advance', round: engine.round, totalRounds: engine.settings.rounds },
          interfacePrefs.narration,
          lang,
        )
      }
      prevRoundRef.current = engine.round
    }
  }, [engine.round, engine.settings.rounds, interfacePrefs.narration, lang])

  useEffect(() => {
    if (prevModeRef.current !== engine.mode) {
      if (engine.mode !== 'focus' && engine.running) {
        announceTimerEvent(
          { type: 'break-start', mode: engine.mode === 'long' ? 'long' : 'short' },
          interfacePrefs.narration,
          lang,
        )
      }
      prevModeRef.current = engine.mode
    }
  }, [engine.mode, engine.running, interfacePrefs.narration, lang])

}
