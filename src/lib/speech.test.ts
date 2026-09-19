import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  announceTimerEvent,
  formatNarrationText,
  shouldAnnounce,
  speakNarration,
} from './speech'
import type { TimerNarrationEvent } from './speech'

describe('Speech & Narration Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('shouldAnnounce policy', () => {
    it('only announces completions under minimal verbosity', () => {
      expect(shouldAnnounce('session-complete', 'minimal')).toBe(true)
      expect(shouldAnnounce('break-complete', 'minimal')).toBe(true)
      expect(shouldAnnounce('session-start', 'minimal')).toBe(false)
      expect(shouldAnnounce('session-pause', 'minimal')).toBe(false)
      expect(shouldAnnounce('round-advance', 'minimal')).toBe(false)
    })

    it('announces starts, completions, and round advances under standard verbosity', () => {
      expect(shouldAnnounce('session-complete', 'standard')).toBe(true)
      expect(shouldAnnounce('break-complete', 'standard')).toBe(true)
      expect(shouldAnnounce('session-start', 'standard')).toBe(true)
      expect(shouldAnnounce('break-start', 'standard')).toBe(true)
      expect(shouldAnnounce('round-advance', 'standard')).toBe(true)
      expect(shouldAnnounce('session-pause', 'standard')).toBe(false)
      expect(shouldAnnounce('session-resume', 'standard')).toBe(false)
    })

    it('announces all events under detailed verbosity', () => {
      const events: TimerNarrationEvent['type'][] = [
        'session-start',
        'session-pause',
        'session-resume',
        'session-complete',
        'break-start',
        'break-complete',
        'round-advance',
      ]
      for (const e of events) {
        expect(shouldAnnounce(e, 'detailed')).toBe(true)
      }
    })
  })

  describe('formatNarrationText localization', () => {
    it('formats session start with and without task in Polish and English', () => {
      expect(formatNarrationText({ type: 'session-start', task: 'Implement Auth' }, 'pl')).toBe(
        'Rozpoczęto sesję skupienia: Implement Auth',
      )
      expect(formatNarrationText({ type: 'session-start', task: 'Implement Auth' }, 'en')).toBe(
        'Focus session started: Implement Auth',
      )
      expect(formatNarrationText({ type: 'session-start' }, 'pl')).toBe('Rozpoczęto sesję skupienia')
      expect(formatNarrationText({ type: 'session-start' }, 'en')).toBe('Focus session started')
    })

    it('formats pause and resume in Polish and English', () => {
      expect(formatNarrationText({ type: 'session-pause' }, 'pl')).toBe('Licznik wstrzymany')
      expect(formatNarrationText({ type: 'session-pause' }, 'en')).toBe('Timer paused')
      expect(formatNarrationText({ type: 'session-resume' }, 'pl')).toBe('Wznowiono licznik')
      expect(formatNarrationText({ type: 'session-resume' }, 'en')).toBe('Timer resumed')
    })

    it('formats completions and round advances', () => {
      expect(formatNarrationText({ type: 'session-complete' }, 'pl')).toBe(
        'Sesja skupienia zakończona. Czas na przerwę',
      )
      expect(formatNarrationText({ type: 'session-complete' }, 'en')).toBe(
        'Focus session completed. Time for a break',
      )

      expect(formatNarrationText({ type: 'break-start', mode: 'short' }, 'pl')).toBe(
        'Krótka przerwa rozpoczęta',
      )
      expect(formatNarrationText({ type: 'break-start', mode: 'long' }, 'en')).toBe(
        'Long break started',
      )

      expect(formatNarrationText({ type: 'round-advance', round: 2, totalRounds: 4 }, 'pl')).toBe(
        'Runda 2 z 4',
      )
      expect(formatNarrationText({ type: 'round-advance', round: 3, totalRounds: 4 }, 'en')).toBe(
        'Round 3 of 4',
      )
    })
  })

  describe('speakNarration & announceTimerEvent', () => {
    it('dispatches speech synthesis when voiceAlertsEnabled is true', () => {
      const mockSpeak = vi.fn()

      class MockUtterance {
        text: string
        lang: string = ''
        rate: number = 1
        pitch: number = 1
        onend?: () => void
        constructor(text: string) {
          this.text = text
        }
      }

      // Mock window.speechSynthesis & SpeechSynthesisUtterance
      vi.stubGlobal('speechSynthesis', {
        speak: mockSpeak,
        paused: false,
        getVoices: () => [],
      })
      vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance)

      const onEnd = vi.fn()
      speakNarration('Test message', 'en', true, onEnd)
      expect(mockSpeak).toHaveBeenCalledTimes(1)

      vi.unstubAllGlobals()
    })

    it('does not dispatch speech when voiceAlertsEnabled is false but returns text for a11y live region', () => {
      const mockSpeak = vi.fn()
      vi.stubGlobal('speechSynthesis', {
        speak: mockSpeak,
        cancel: vi.fn(),
      })

      const text = announceTimerEvent(
        { type: 'session-complete' },
        { verbosity: 'standard', voiceAlertsEnabled: false },
        'en',
      )

      expect(text).toBe('Focus session completed. Time for a break')
      expect(mockSpeak).not.toHaveBeenCalled()

      vi.unstubAllGlobals()
    })

    it('returns null when event is suppressed by verbosity', () => {
      const text = announceTimerEvent(
        { type: 'session-pause' },
        { verbosity: 'minimal', voiceAlertsEnabled: true },
        'en',
      )
      expect(text).toBeNull()
    })
  })
})
