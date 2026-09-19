import { beforeEach, describe, expect, it } from 'vitest'
import {
  exportData,
  importData,
  isBackupFile,
} from './dataPort'
import {
  loadInterface,
  loadTheme,
  saveInterface,
  saveTheme,
  isInterface,
} from './storage'
import {
  applyTheme,
  getContrastRatio,
  isValidTheme,
  THEMES,
  THEME_TOKENS,
} from './theme'
import {
  announceTimerEvent,
  formatNarrationText,
  shouldAnnounce,
} from './speech'
import {
  DEFAULT_NARRATION,
  DEFAULT_SHORTCUTS,
  type BackupFileV2,
  type InterfacePrefs,
  type Theme,
} from '../types'

describe('Stage 5 (v2.5) — Customization, Themes & Accessibility Suite', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
    document.documentElement.style.colorScheme = ''
  })

  describe('Sensory-Friendly Themes & WCAG 2.2 AAA Compliance', () => {
    it('supports all five official sensory-friendly themes', () => {
      const themes: Theme[] = ['light', 'dark', 'obsidian', 'sage', 'eink']
      for (const t of themes) {
        expect(isValidTheme(t)).toBe(true)
        expect(THEME_TOKENS[t]).toBeDefined()
        expect(THEME_TOKENS[t].surfacePage).toMatch(/^#[0-9a-fA-F]{6}$/)
        expect(THEME_TOKENS[t].textPrimary).toMatch(/^#[0-9a-fA-F]{6}$/)
      }
    })

    it('verifies that all five themes satisfy WCAG 2.2 AAA contrast (>= 7.0:1) for body text', () => {
      for (const theme of THEMES) {
        const ratio = getContrastRatio(theme.textPrimary, theme.surfacePage)
        expect(
          ratio,
          `Theme ${theme.id} contrast ratio (${ratio}:1) must meet or exceed 7.0:1`,
        ).toBeGreaterThanOrEqual(7.0)
      }
    })

    it('applies sensory themes dynamically to the document root element', () => {
      applyTheme('obsidian')
      expect(document.documentElement.classList.contains('obsidian')).toBe(true)
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.style.colorScheme).toBe('dark')

      applyTheme('sage')
      expect(document.documentElement.classList.contains('sage')).toBe(true)
      expect(document.documentElement.classList.contains('obsidian')).toBe(false)
      expect(document.documentElement.style.colorScheme).toBe('light')

      applyTheme('eink')
      expect(document.documentElement.classList.contains('eink')).toBe(true)
      expect(document.documentElement.classList.contains('sage')).toBe(false)
      expect(document.documentElement.style.colorScheme).toBe('light')
    })

    it('persists and loads custom sensory themes from storage', () => {
      saveTheme('obsidian')
      expect(loadTheme()).toBe('obsidian')

      saveTheme('sage')
      expect(loadTheme()).toBe('sage')

      saveTheme('eink')
      expect(loadTheme()).toBe('eink')
    })

    it('falls back to null when corrupted or non-existent theme is loaded', () => {
      localStorage.setItem('ff2_theme', JSON.stringify('non-existent-theme'))
      expect(loadTheme()).toBeNull()
    })
  })

  describe('Screen Reader Narration & Voice Alerts', () => {
    it('respects minimal, standard, and detailed narration verbosity tiers', () => {
      expect(shouldAnnounce('session-complete', 'minimal')).toBe(true)
      expect(shouldAnnounce('break-complete', 'minimal')).toBe(true)
      expect(shouldAnnounce('session-start', 'minimal')).toBe(false)
      expect(shouldAnnounce('session-pause', 'minimal')).toBe(false)

      expect(shouldAnnounce('session-start', 'standard')).toBe(true)
      expect(shouldAnnounce('round-advance', 'standard')).toBe(true)
      expect(shouldAnnounce('session-pause', 'standard')).toBe(false)

      expect(shouldAnnounce('session-pause', 'detailed')).toBe(true)
      expect(shouldAnnounce('session-resume', 'detailed')).toBe(true)
    })

    it('formats localized narration strings in Polish and English', () => {
      const plText = formatNarrationText(
        { type: 'session-start', task: 'Redesign Accessibility' },
        'pl',
      )
      expect(plText).toBe('Rozpoczęto sesję skupienia: Redesign Accessibility')

      const enText = formatNarrationText(
        { type: 'session-start', task: 'Redesign Accessibility' },
        'en',
      )
      expect(enText).toBe('Focus session started: Redesign Accessibility')
    })

    it('returns null when event is suppressed by verbosity level', () => {
      const result = announceTimerEvent(
        { type: 'session-pause' },
        { verbosity: 'minimal', voiceAlertsEnabled: false },
        'en',
      )
      expect(result).toBeNull()
    })
  })

  describe('Customizable Shortcuts & Interface Preferences Schema v2.1', () => {
    it('persists and retrieves custom shortcuts and narration preferences', () => {
      const customPrefs: InterfacePrefs = {
        reduceMotion: true,
        showGreeting: false,
        shortcuts: {
          toggleTimer: 'k',
          resetTimer: 't',
          toggleFullscreen: 'w',
          openSettings: '/',
        },
        narration: {
          verbosity: 'detailed',
          voiceAlertsEnabled: true,
        },
      }

      saveInterface(customPrefs)
      const loaded = loadInterface()

      expect(loaded.reduceMotion).toBe(true)
      expect(loaded.showGreeting).toBe(false)
      expect(loaded.shortcuts).toEqual(customPrefs.shortcuts)
      expect(loaded.narration).toEqual(customPrefs.narration)
    })

    it('sanitizes corrupted shortcuts and narration in isInterface validator', () => {
      const corrupted = {
        reduceMotion: 'invalid',
        showGreeting: 'invalid',
        shortcuts: { toggleTimer: 123 }, // invalid keymap
        narration: { verbosity: 'ultra' }, // invalid verbosity
      }

      const sanitized = isInterface(corrupted)
      expect(sanitized).toBeDefined()
      expect(sanitized?.reduceMotion).toBe(false)
      expect(sanitized?.showGreeting).toBe(true)
      expect(sanitized?.shortcuts).toBeUndefined()
      expect(sanitized?.narration).toBeUndefined()
    })

    it('populates DEFAULT_SHORTCUTS and DEFAULT_NARRATION when not set', () => {
      expect(DEFAULT_SHORTCUTS.toggleTimer).toBe(' ')
      expect(DEFAULT_SHORTCUTS.resetTimer).toBe('r')
      expect(DEFAULT_SHORTCUTS.toggleFullscreen).toBe('f')
      expect(DEFAULT_SHORTCUTS.openSettings).toBe('?')

      expect(DEFAULT_NARRATION.verbosity).toBe('standard')
      expect(DEFAULT_NARRATION.voiceAlertsEnabled).toBe(false)
    })
  })

  describe('Data Portability & Backup v2.1 Import/Export', () => {
    it('exports full snapshot preserving custom sensory theme and extended interface prefs', async () => {
      saveTheme('obsidian')
      saveInterface({
        reduceMotion: false,
        showGreeting: true,
        shortcuts: {
          toggleTimer: 'p',
          resetTimer: 'x',
          toggleFullscreen: 'z',
          openSettings: 'h',
        },
        narration: {
          verbosity: 'detailed',
          voiceAlertsEnabled: true,
        },
      })

      const backup = await exportData()
      expect(backup.app).toBe('focus-flow')
      expect(backup.version).toBe(2)
      expect(backup.data.theme).toBe('obsidian')
      expect(backup.data.interface.shortcuts?.toggleTimer).toBe('p')
      expect(backup.data.interface.narration?.verbosity).toBe('detailed')
    })

    it('imports and restores backup with sensory theme and shortcuts', async () => {
      const validBackup: BackupFileV2 = {
        app: 'focus-flow',
        version: 2,
        exportedAt: new Date().toISOString(),
        data: {
          settings: { focus: 25, short: 5, long: 15, rounds: 4, autoStart: false },
          stats: {
            today: 1,
            week: 1,
            streak: 1,
            minutes: 25,
            date: new Date().toDateString(),
            weekStart: new Date().toDateString(),
            lastDate: new Date().toDateString(),
            history: {},
          },
          sessions: [],
          presets: [],
          sounds: [],
          lang: 'pl',
          theme: 'sage',
          volume: 0.8,
          interface: {
            reduceMotion: true,
            showGreeting: false,
            shortcuts: {
              toggleTimer: 'j',
              resetTimer: 'k',
              toggleFullscreen: 'l',
              openSettings: ';',
            },
            narration: {
              verbosity: 'minimal',
              voiceAlertsEnabled: true,
            },
          },
        },
      }

      const res = await importData(JSON.stringify(validBackup))
      expect(res.success).toBe(true)

      expect(loadTheme()).toBe('sage')
      const restoredInterface = loadInterface()
      expect(restoredInterface.reduceMotion).toBe(true)
      expect(restoredInterface.shortcuts?.toggleTimer).toBe('j')
      expect(restoredInterface.narration?.verbosity).toBe('minimal')
    })

    it('rejects invalid themes while preserving compatibility regex', async () => {
      const invalidBackup = {
        app: 'focus-flow',
        version: 2,
        exportedAt: new Date().toISOString(),
        data: {
          settings: { focus: 25, short: 5, long: 15, rounds: 4, autoStart: false },
          stats: {
            today: 0,
            week: 0,
            streak: 0,
            minutes: 0,
            date: new Date().toDateString(),
            weekStart: new Date().toDateString(),
            lastDate: null,
            history: {},
          },
          sessions: [],
          presets: [],
          sounds: [],
          lang: 'en',
          theme: 'neon-cyberpunk',
          volume: 0.5,
          interface: { reduceMotion: false, showGreeting: true },
        },
      }

      expect(isBackupFile(invalidBackup)).toBe(false)
      const res = await importData(JSON.stringify(invalidBackup))
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error).toMatch(/theme must be "light" or "dark"/i)
      }
    })
  })
})
