import type { Lang, NarrationSettings, NarrationVerbosity } from '../types'
import { localeFor } from '../domain/language'
import { translate } from './translations'

export type TimerNarrationEvent =
  | { type: 'session-start'; task?: string | null }
  | { type: 'session-pause' }
  | { type: 'session-resume' }
  | { type: 'session-complete'; task?: string | null }
  | { type: 'break-start'; mode: 'short' | 'long' }
  | { type: 'break-complete' }
  | { type: 'round-advance'; round: number; totalRounds: number }

// Retain active utterance references to prevent garbage collection bugs in Firefox & Chromium
const activeUtterances = new Set<SpeechSynthesisUtterance>()

export function shouldAnnounce(eventType: TimerNarrationEvent['type'], verbosity: NarrationVerbosity): boolean {
  if (verbosity === 'minimal') {
    return eventType === 'session-complete' || eventType === 'break-complete'
  }
  if (verbosity === 'standard') {
    return (
      eventType === 'session-complete' ||
      eventType === 'break-complete' ||
      eventType === 'session-start' ||
      eventType === 'break-start' ||
      eventType === 'round-advance'
    )
  }
  // 'detailed' announces all timer state transitions
  return true
}

export function formatNarrationText(event: TimerNarrationEvent, lang: Lang): string {
  switch (event.type) {
    case 'session-start': {
      const task = event.task?.trim()
      if (task) {
        return translate(lang, 'narration.startTask', { task })
      }
      return translate(lang, 'narration.start')
    }
    case 'session-pause':
      return translate(lang, 'narration.pause')
    case 'session-resume':
      return translate(lang, 'narration.resume')
    case 'session-complete':
      return translate(lang, 'narration.complete')
    case 'break-start':
      if (event.mode === 'long') {
        return translate(lang, 'narration.longBreak')
      }
      return translate(lang, 'narration.shortBreak')
    case 'break-complete':
      return translate(lang, 'narration.breakComplete')
    case 'round-advance':
      return translate(lang, 'narration.round', { round: event.round, totalRounds: event.totalRounds })
  }
}

/**
 * Returns available voices if speech synthesis is supported.
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return []
  return window.speechSynthesis.getVoices()
}

/**
 * Dispatches spoken feedback via the Web Speech API (`SpeechSynthesisUtterance`).
 * Hardened for Firefox (avoids cancel deadlock, sets explicit voice, retains GC reference).
 */
export function speakNarration(
  text: string,
  lang: Lang,
  enabled: boolean,
  onEnd?: () => void,
  onError?: (err: string) => void,
): void {
  if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onError?.('Speech synthesis not supported or disabled')
    return
  }

  try {
    const synth = window.speechSynthesis

    // In Firefox/Safari, resume if paused
    if (synth.paused) {
      synth.resume()
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang === 'en' ? 'en-US' : localeFor(lang)
    utterance.rate = 1.0
    utterance.pitch = 1.0

    // Match best available voice for language
    const voices = synth.getVoices()
    if (voices.length > 0) {
      const prefix = lang.toLowerCase()
      const matchingVoice =
        voices.find((v) => v.lang.toLowerCase().replace('_', '-') === utterance.lang.toLowerCase()) ??
        voices.find((v) => v.lang.toLowerCase().split(/[-_]/)[0] === prefix && (lang !== 'zh' || !/[-_](hk|mo|yue)\b/i.test(v.lang)))
      if (matchingVoice) {
        utterance.voice = matchingVoice
      }
    }

    // Retain reference to prevent garbage collection before completion
    activeUtterances.add(utterance)

    utterance.onend = () => {
      activeUtterances.delete(utterance)
      onEnd?.()
    }

    utterance.onerror = (e) => {
      activeUtterances.delete(utterance)
      onError?.(e.error ?? 'Unknown error')
    }

    synth.speak(utterance)
  } catch (err) {
    onError?.(err instanceof Error ? err.message : String(err))
  }
}

/**
 * Dispatches polite text announcements to the screen reader live region.
 */
export function announceA11y(text: string): void {
  if (typeof document === 'undefined') return
  const el = document.getElementById('a11y-live-announcer')
  if (el) {
    el.textContent = ''
    setTimeout(() => {
      el.textContent = text
    }, 50)
  }
}

/**
 * Evaluates the timer event against the active narration verbosity policy,
 * dispatches voice alerts if enabled, and updates the live region for screen readers.
 */
export function announceTimerEvent(
  event: TimerNarrationEvent,
  settings: NarrationSettings | undefined,
  lang: Lang,
): string | null {
  const verbosity = settings?.verbosity ?? 'standard'
  const enabled = settings?.voiceAlertsEnabled ?? false

  if (!shouldAnnounce(event.type, verbosity)) {
    return null
  }

  const text = formatNarrationText(event, lang)
  announceA11y(text)
  if (enabled) {
    speakNarration(text, lang, true)
  }

  return text
}
