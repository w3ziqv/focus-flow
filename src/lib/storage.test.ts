import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GoalSettings, InterfacePrefs, MilestoneRecord, SessionLogEntry, SessionLogEntryV2, SessionSnapshot, Stats } from '../types'
import {
  addSession,
  DEFAULT_INTERFACE,
  DEFAULT_SETTINGS,
  DEFAULT_SOUND_PREFERENCES,
  DEFAULT_VOLUME,
  deleteSession,
  isSessionEntry,
  loadCustomSounds,
  loadGoals,
  loadInstallDismissed,
  loadInterface,
  loadLang,
  loadMilestones,
  loadOnboardingDone,
  loadSession,
  loadSessions,
  loadSettings,
  loadSoundPreferences,
  loadStats,
  loadTheme,
  loadVolume,
  MAX_SESSIONS,
  MAX_TONE_WARMTH,
  MIN_TONE_WARMTH,
  sanitizeSessionEntry,
  saveCustomSounds,
  saveGoals,
  saveInstallDismissed,
  saveInterface,
  saveLang,
  saveMilestones,
  saveOnboardingDone,
  saveSession,
  saveSessions,
  saveSettings,
  saveSoundPreferences,
  saveStats,
  saveTheme,
  saveVolume,
  systemTheme,
  updateSessionTask,
  weekStartOf,
} from './storage'

beforeEach(() => {
  localStorage.clear()
})

describe('loadSettings & saveSettings', () => {
  it('returns defaults when storage is empty', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('clamps out-of-range values', () => {
    localStorage.setItem(
      'ff2_settings',
      JSON.stringify({ focus: 9999, short: -5, long: 15, rounds: 4, autoStart: true }),
    )
    const settings = loadSettings()
    expect(settings.focus).toBe(120)
    expect(settings.short).toBe(1)
    expect(settings.autoStart).toBe(true)
  })

  it('falls back to defaults for corrupt JSON', () => {
    localStorage.setItem('ff2_settings', '{not json')
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('saves and reloads valid custom settings', () => {
    saveSettings({ focus: 45, short: 10, long: 25, rounds: 6, autoStart: true })
    const loaded = loadSettings()
    expect(loaded).toEqual({ focus: 45, short: 10, long: 25, rounds: 6, autoStart: true })
  })
})

describe('loadStats & saveStats', () => {
  it('rolls today and week counters on a new day', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const stale: Stats = {
      today: 3,
      week: 12,
      streak: 4,
      minutes: 900,
      date: yesterday.toDateString(),
      weekStart: weekStartOf(),
      lastDate: yesterday.toDateString(),
      history: {},
    }
    localStorage.setItem('ff2_stats', JSON.stringify(stale))
    const stats = loadStats()
    expect(stats.today).toBe(0)
    expect(stats.week).toBe(12)
    expect(stats.streak).toBe(4)
    expect(stats.date).toBe(new Date().toDateString())
  })

  it('returns a fresh record for corrupt JSON or non-object', () => {
    localStorage.setItem('ff2_stats', 'null')
    const stats = loadStats()
    expect(stats.today).toBe(0)
    expect(stats.streak).toBe(0)
    expect(stats.history).toEqual({})

    localStorage.setItem('ff2_stats', '{corrupt json')
    const stats2 = loadStats()
    expect(stats2.today).toBe(0)
  })

  it('saves and loads stats correctly with history', () => {
    const today = new Date().toDateString()
    const stats: Stats = {
      today: 4,
      week: 15,
      streak: 5,
      minutes: 375,
      date: today,
      weekStart: weekStartOf(),
      lastDate: today,
      history: { [today]: 375 },
    }
    saveStats(stats)
    const loaded = loadStats()
    expect(loaded.today).toBe(4)
    expect(loaded.week).toBe(15)
    expect(loaded.streak).toBe(5)
    expect(loaded.minutes).toBe(375)
    expect(loaded.history).toEqual({ [today]: 375 })
  })
})

describe('isSessionEntry & sanitizeSessionEntry', () => {
  it('parses valid session entry with date, minutes and task', () => {
    const input = {
      id: 'sess_1',
      date: '2026-09-01T10:00:00.000Z',
      minutes: 25,
      task: 'Write tests',
    }
    const result = isSessionEntry(input)
    expect(result).toEqual({
      id: 'sess_1',
      date: '2026-09-01T10:00:00.000Z',
      minutes: 25,
      task: 'Write tests',
    })
  })

  it('supports legacy alias fields (startTime and durationMinutes)', () => {
    const input = {
      id: 'sess_legacy',
      startTime: '2026-09-01T11:00:00.000Z',
      durationMinutes: 50,
      task: 'Refactor storage',
    }
    const result = sanitizeSessionEntry(input)
    expect(result).toEqual({
      id: 'sess_legacy',
      date: '2026-09-01T11:00:00.000Z',
      minutes: 50,
      task: 'Refactor storage',
    })
  })

  it('coerces numeric string minutes and rounds floating values', () => {
    const result = isSessionEntry({
      id: 's_str',
      date: '2026-09-01T12:00:00.000Z',
      minutes: '24.6',
    })
    expect(result).toEqual({
      id: 's_str',
      date: '2026-09-01T12:00:00.000Z',
      minutes: 25,
      task: null,
    })
  })

  it('rejects negative, non-numeric, NaN, or non-finite minutes', () => {
    expect(isSessionEntry({ id: 's1', date: '2026-09-01T12:00:00.000Z', minutes: -1 })).toBeNull()
    expect(isSessionEntry({ id: 's2', date: '2026-09-01T12:00:00.000Z', minutes: NaN })).toBeNull()
    expect(isSessionEntry({ id: 's3', date: '2026-09-01T12:00:00.000Z', minutes: Infinity })).toBeNull()
    expect(isSessionEntry({ id: 's4', date: '2026-09-01T12:00:00.000Z', minutes: 'abc' })).toBeNull()
  })

  it('rejects invalid date strings', () => {
    expect(isSessionEntry({ id: 's1', date: 'invalid-date', minutes: 25 })).toBeNull()
    expect(isSessionEntry({ id: 's2', date: '', minutes: 25 })).toBeNull()
    expect(isSessionEntry({ id: 's3', date: '   ', minutes: 25 })).toBeNull()
  })

  it('rejects missing, empty, or whitespace-only id', () => {
    expect(isSessionEntry({ id: '', date: '2026-09-01T12:00:00.000Z', minutes: 25 })).toBeNull()
    expect(isSessionEntry({ id: '   ', date: '2026-09-01T12:00:00.000Z', minutes: 25 })).toBeNull()
    expect(isSessionEntry({ date: '2026-09-01T12:00:00.000Z', minutes: 25 })).toBeNull()
  })

  it('clamps id to 64 characters and task to 200 characters', () => {
    const longId = 'id_'.repeat(30) // 90 chars
    const longTask = 'task_'.repeat(50) // 250 chars
    const result = isSessionEntry({
      id: longId,
      date: '2026-09-01T12:00:00.000Z',
      minutes: 25,
      task: longTask,
    })
    expect(result).not.toBeNull()
    expect(result?.id.length).toBe(64)
    expect(result?.task?.length).toBe(200)
  })

  it('sets task to null if empty, whitespace-only, or not a string', () => {
    const emptyTask = isSessionEntry({ id: 's1', date: '2026-09-01T12:00:00.000Z', minutes: 25, task: '' })
    expect(emptyTask?.task).toBeNull()

    const spaceTask = isSessionEntry({ id: 's2', date: '2026-09-01T12:00:00.000Z', minutes: 25, task: '   ' })
    expect(spaceTask?.task).toBeNull()

    const numTask = isSessionEntry({ id: 's3', date: '2026-09-01T12:00:00.000Z', minutes: 25, task: 12345 })
    expect(numTask?.task).toBeNull()
  })

  it('rejects non-object inputs', () => {
    expect(isSessionEntry(null)).toBeNull()
    expect(isSessionEntry(undefined)).toBeNull()
    expect(isSessionEntry('string')).toBeNull()
    expect(isSessionEntry(123)).toBeNull()
    expect(isSessionEntry(true)).toBeNull()
    expect(isSessionEntry([])).toBeNull()
  })

  it('strips prototype pollution keys without polluting Object.prototype', () => {
    const dirty = JSON.parse(
      '{"id":"p1","date":"2026-09-01T12:00:00.000Z","minutes":25,"task":"Task","__proto__":{"polluted":true},"constructor":{"prototype":{"pwned":true}}}',
    )
    const sanitized = sanitizeSessionEntry(dirty)
    expect(sanitized).toEqual({
      id: 'p1',
      date: '2026-09-01T12:00:00.000Z',
      minutes: 25,
      task: 'Task',
    })
    const globalProto = Object.prototype as Record<string, unknown>
    expect(globalProto['polluted']).toBeUndefined()
    expect(globalProto['pwned']).toBeUndefined()
  })
})

describe('loadSessions', () => {
  it('returns empty array when storage is empty', () => {
    expect(loadSessions()).toEqual([])
  })

  it('returns valid session entries from storage', () => {
    const data: SessionLogEntry[] = [
      { id: 's1', date: '2026-09-01T10:00:00.000Z', minutes: 25, task: 'Task 1' },
      { id: 's2', date: '2026-09-01T11:00:00.000Z', minutes: 50, task: null },
    ]
    localStorage.setItem('ff2_sessions', JSON.stringify(data))
    expect(loadSessions()).toEqual(data)
  })

  it('returns empty array on malformed JSON without throwing', () => {
    localStorage.setItem('ff2_sessions', '{corrupt json')
    expect(loadSessions()).toEqual([])
  })

  it('returns empty array when storage contains non-array JSON', () => {
    localStorage.setItem('ff2_sessions', '{"not":"an array"}')
    expect(loadSessions()).toEqual([])
    localStorage.setItem('ff2_sessions', '"a string"')
    expect(loadSessions()).toEqual([])
    localStorage.setItem('ff2_sessions', '123')
    expect(loadSessions()).toEqual([])
  })

  it('filters out corrupt and invalid items in stored array', () => {
    const mixed = [
      { id: 'valid_1', date: '2026-09-01T10:00:00.000Z', minutes: 25, task: 'Ok' },
      null,
      'invalid item',
      { id: '', date: '2026-09-01T10:00:00.000Z', minutes: 25 },
      { id: 'invalid_date', date: 'not-date', minutes: 25 },
      { id: 'negative_min', date: '2026-09-01T10:00:00.000Z', minutes: -10 },
      { id: 'valid_2', date: '2026-09-01T11:00:00.000Z', minutes: 30, task: null },
    ]
    localStorage.setItem('ff2_sessions', JSON.stringify(mixed))
    const loaded = loadSessions()
    expect(loaded).toHaveLength(2)
    expect(loaded[0].id).toBe('valid_1')
    expect(loaded[1].id).toBe('valid_2')
  })

  it('caps loaded sessions at MAX_SESSIONS (1000)', () => {
    const large: SessionLogEntry[] = []
    for (let i = 0; i < 1100; i++) {
      large.push({
        id: `s_${i}`,
        date: new Date('2026-01-01T00:00:00.000Z').toISOString(),
        minutes: 25,
        task: `Task ${i}`,
      })
    }
    localStorage.setItem('ff2_sessions', JSON.stringify(large))
    const loaded = loadSessions()
    expect(loaded).toHaveLength(MAX_SESSIONS)
    expect(loaded[0].id).toBe('s_0')
    expect(loaded[MAX_SESSIONS - 1].id).toBe(`s_${MAX_SESSIONS - 1}`)
  })
})

describe('saveSessions', () => {
  it('saves valid sessions and returns true', () => {
    const sessions: SessionLogEntry[] = [
      { id: 's1', date: '2026-09-01T10:00:00.000Z', minutes: 25, task: 'Focus' },
    ]
    expect(saveSessions(sessions)).toBe(true)
    expect(JSON.parse(localStorage.getItem('ff2_sessions')!)).toEqual(sessions)
  })

  it('returns false when input is not an array', () => {
    expect(saveSessions(null as unknown as SessionLogEntry[])).toBe(false)
    expect(saveSessions(undefined as unknown as SessionLogEntry[])).toBe(false)
    expect(saveSessions({} as unknown as SessionLogEntry[])).toBe(false)
  })

  it('sanitizes and removes corrupt entries during save', () => {
    const dirty: Array<Record<string, unknown>> = [
      { id: 'good', date: '2026-09-01T10:00:00.000Z', minutes: 25, task: 'Good' },
      { id: 'bad_date', date: 'invalid', minutes: 25 },
      { id: 'bad_min', date: '2026-09-01T10:00:00.000Z', minutes: -5 },
    ]
    expect(saveSessions(dirty as unknown as SessionLogEntry[])).toBe(true)
    const stored = JSON.parse(localStorage.getItem('ff2_sessions')!)
    expect(stored).toHaveLength(1)
    expect(stored[0].id).toBe('good')
  })

  it('strips prototype pollution payloads when saving', () => {
    const dirtyJson =
      '[{"id":"clean_id","date":"2026-09-01T10:00:00.000Z","minutes":25,"task":"Task","__proto__":{"polluted":true}}]'
    const dirtyArr = JSON.parse(dirtyJson)
    expect(saveSessions(dirtyArr)).toBe(true)
    const stored = JSON.parse(localStorage.getItem('ff2_sessions')!)
    expect(stored).toHaveLength(1)
    expect(stored[0]).toEqual({
      id: 'clean_id',
      date: '2026-09-01T10:00:00.000Z',
      minutes: 25,
      task: 'Task',
    })
    const globalProto = Object.prototype as Record<string, unknown>
    expect(globalProto['polluted']).toBeUndefined()
  })

  it('caps saved sessions at MAX_SESSIONS (1000)', () => {
    const large: SessionLogEntry[] = []
    for (let i = 0; i < 1200; i++) {
      large.push({
        id: `s_${i}`,
        date: '2026-09-01T10:00:00.000Z',
        minutes: 25,
        task: `Task ${i}`,
      })
    }
    expect(saveSessions(large)).toBe(true)
    const stored = JSON.parse(localStorage.getItem('ff2_sessions')!)
    expect(stored).toHaveLength(MAX_SESSIONS)
  })

  it('returns false if localStorage.setItem throws (quota exceeded)', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    expect(saveSessions([{ id: 's1', date: '2026-09-01T10:00:00.000Z', minutes: 25, task: null }])).toBe(false)
    spy.mockRestore()
  })
})

describe('addSession', () => {
  it('prepends a new session entry to empty storage', () => {
    const entry: SessionLogEntry = {
      id: 'first',
      date: '2026-09-01T10:00:00.000Z',
      minutes: 25,
      task: 'First session',
    }
    const result = addSession(entry)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(entry)
    expect(loadSessions()).toEqual([entry])
  })

  it('prepends new sessions so the newest is at index 0', () => {
    const e1: SessionLogEntry = { id: 's1', date: '2026-09-01T10:00:00.000Z', minutes: 25, task: 'Task 1' }
    const e2: SessionLogEntry = { id: 's2', date: '2026-09-01T11:00:00.000Z', minutes: 30, task: 'Task 2' }

    addSession(e1)
    const result = addSession(e2)

    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('s2')
    expect(result[1].id).toBe('s1')
    expect(loadSessions()[0].id).toBe('s2')
  })

  it('clamps task string to 200 characters upon adding', () => {
    const longTask = 'A'.repeat(300)
    const entry: SessionLogEntry = {
      id: 'clamp_task',
      date: '2026-09-01T10:00:00.000Z',
      minutes: 25,
      task: longTask,
    }
    const result = addSession(entry)
    expect(result[0].task).toBe('A'.repeat(200))
    expect(loadSessions()[0].task).toBe('A'.repeat(200))
  })

  it('enforces rolling limit capping at MAX_SESSIONS (1000 items)', () => {
    // Fill storage with 1000 items
    const full: SessionLogEntry[] = []
    for (let i = 0; i < MAX_SESSIONS; i++) {
      full.push({
        id: `old_${i}`,
        date: '2026-01-01T00:00:00.000Z',
        minutes: 25,
        task: `Old ${i}`,
      })
    }
    saveSessions(full)
    expect(loadSessions()).toHaveLength(MAX_SESSIONS)

    // Add a 1001st session
    const newEntry: SessionLogEntry = {
      id: 'new_entry',
      date: '2026-09-01T12:00:00.000Z',
      minutes: 50,
      task: 'Newest',
    }
    const result = addSession(newEntry)
    expect(result).toHaveLength(MAX_SESSIONS)
    expect(result[0].id).toBe('new_entry')
    expect(result[1].id).toBe('old_0')
    // The last element should be old_998 (old_999 dropped)
    expect(result[MAX_SESSIONS - 1].id).toBe('old_998')
  })

  it('ignores invalid session entry without corrupting existing sessions', () => {
    const valid: SessionLogEntry = { id: 'valid_1', date: '2026-09-01T10:00:00.000Z', minutes: 25, task: 'Ok' }
    addSession(valid)

    const invalid = { id: '', date: 'invalid-date', minutes: -50 } as unknown as SessionLogEntry
    const result = addSession(invalid)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('valid_1')
  })
})

describe('legacy migration', () => {
  it('migrates ff_* keys once into the new namespace', () => {
    localStorage.setItem('ff_settings', JSON.stringify({ focus: 50, short: 10, long: 20, rounds: 6, autoStart: false }))
    localStorage.setItem('ff_theme', 'dark')
    localStorage.setItem('ff_lang', 'en')
    localStorage.setItem('ff_custom_sounds', JSON.stringify([{ id: 'cs1', name: 'waves', dataUrl: 'data:audio/x' }]))

    expect(loadSettings().focus).toBe(50)
    expect(JSON.parse(localStorage.getItem('ff2_settings')!).focus).toBe(50)
    expect(loadCustomSounds()).toHaveLength(1)
    expect(localStorage.getItem('ff2_migrated')).not.toBeNull()
  })

  it('migrates legacy sessions from ff_sessions to ff2_sessions with sanitization', () => {
    const legacySessions = [
      { id: 'leg_1', date: '2026-08-01T10:00:00.000Z', minutes: 25, task: 'Legacy 1' },
      { id: 'leg_bad', date: 'not-date', minutes: 25 },
      { id: 'leg_2', startTime: '2026-08-01T11:00:00.000Z', durationMinutes: 50, task: 'Legacy 2' },
    ]
    localStorage.setItem('ff_sessions', JSON.stringify(legacySessions))

    const sessions = loadSessions()
    expect(sessions).toHaveLength(2)
    expect(sessions[0].id).toBe('leg_1')
    expect(sessions[1].id).toBe('leg_2')
    expect(sessions[1].minutes).toBe(50)
    expect(localStorage.getItem('ff2_sessions')).not.toBeNull()
    expect(localStorage.getItem('ff2_migrated')).not.toBeNull()
  })

  it('does not overwrite newer data on a second load', () => {
    localStorage.setItem('ff_settings', JSON.stringify({ focus: 50, short: 5, long: 15, rounds: 4, autoStart: false }))
    const first = loadSettings()
    expect(first.focus).toBe(50)
    localStorage.setItem('ff2_settings', JSON.stringify({ focus: 10, short: 5, long: 15, rounds: 4, autoStart: false }))
    expect(loadSettings().focus).toBe(10)
  })

  it('reports success when custom sounds persist', () => {
    expect(saveCustomSounds([{ id: 'cs1', name: 'waves', dataUrl: 'data:audio/x' }])).toBe(true)
    expect(loadCustomSounds()).toHaveLength(1)
  })
})

describe('loadSession & saveSession (Snapshot)', () => {
  it('returns null when no session snapshot exists or storage is corrupt', () => {
    expect(loadSession()).toBeNull()
    localStorage.setItem('ff2_session', '{corrupt json')
    expect(loadSession()).toBeNull()
  })

  it('saves and loads a valid session snapshot', () => {
    const snapshot: SessionSnapshot = {
      mode: 'focus',
      round: 2,
      running: true,
      endTs: Date.now() + 1500000,
      remainingMs: 1500000,
      task: 'Active focus sprint',
      taskDone: false,
    }
    saveSession(snapshot)
    const loaded = loadSession()
    expect(loaded).toEqual(snapshot)
  })

  it('rejects snapshot with invalid mode', () => {
    localStorage.setItem(
      'ff2_session',
      JSON.stringify({
        mode: 'invalid_mode',
        round: 1,
        running: false,
        endTs: null,
        remainingMs: 0,
        task: '',
        taskDone: false,
      }),
    )
    expect(loadSession()).toBeNull()
  })

  it('clamps snapshot task string to 200 characters', () => {
    const longTask = 'X'.repeat(300)
    saveSession({
      mode: 'short',
      round: 1,
      running: false,
      endTs: null,
      remainingMs: 300000,
      task: longTask,
      taskDone: true,
    })
    const loaded = loadSession()
    expect(loaded?.task).toBe('X'.repeat(200))
  })
})

describe('preferences, volume and interface storage', () => {
  it('loadVolume defaults to DEFAULT_VOLUME (0.7) and clamps/validates range [0, 1]', () => {
    expect(loadVolume()).toBe(DEFAULT_VOLUME)
    saveVolume(0.3)
    expect(loadVolume()).toBe(0.3)

    localStorage.setItem('ff2_volume', '1.5') // out of range
    expect(loadVolume()).toBe(DEFAULT_VOLUME)

    localStorage.setItem('ff2_volume', '-0.2') // out of range
    expect(loadVolume()).toBe(DEFAULT_VOLUME)

    localStorage.setItem('ff2_volume', '"invalid"')
    expect(loadVolume()).toBe(DEFAULT_VOLUME)
  })

  it('loadInterface returns defaults and persists custom preferences', () => {
    expect(loadInterface()).toEqual(DEFAULT_INTERFACE)

    const custom: InterfacePrefs = { reduceMotion: true, showGreeting: false }
    expect(saveInterface(custom)).toBe(true)
    expect(loadInterface()).toEqual(custom)
  })

  it('loadLang and saveLang handle pl and en languages correctly', () => {
    expect(loadLang()).toBeNull()
    saveLang('pl')
    expect(loadLang()).toBe('pl')
    saveLang('en')
    expect(loadLang()).toBe('en')
  })

  it('loadTheme and saveTheme handle dark and light themes', () => {
    expect(loadTheme()).toBeNull()
    saveTheme('dark')
    expect(loadTheme()).toBe('dark')
    saveTheme('light')
    expect(loadTheme()).toBe('light')
  })

  it('systemTheme detects theme from matchMedia', () => {
    const originalMatchMedia = window.matchMedia
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('dark'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    expect(systemTheme()).toBe('dark')

    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    expect(systemTheme()).toBe('light')

    if (originalMatchMedia) {
      window.matchMedia = originalMatchMedia
    } else {
      Reflect.deleteProperty(window, 'matchMedia')
    }
  })
})

describe('onboarding and install flags', () => {
  it('defaults both flags to false', () => {
    expect(loadOnboardingDone()).toBe(false)
    expect(loadInstallDismissed()).toBe(false)
  })

  it('persists once written', () => {
    saveOnboardingDone()
    saveInstallDismissed()
    expect(loadOnboardingDone()).toBe(true)
    expect(loadInstallDismissed()).toBe(true)
  })

  it('treats corrupt values as false', () => {
    localStorage.setItem('ff2_onboardingDone', '{bad')
    localStorage.setItem('ff2_installDismissed', '"yes"')
    expect(loadOnboardingDone()).toBe(false)
    expect(loadInstallDismissed()).toBe(false)
  })
})

describe('loadSoundPreferences & saveSoundPreferences (Schema v1.2)', () => {
  it('returns default sound preferences when storage is empty', () => {
    expect(loadSoundPreferences()).toEqual(DEFAULT_SOUND_PREFERENCES)
  })

  it('restores valid custom sound preferences from ff2_sound_prefs', () => {
    const prefs = {
      baseTexture: 'rain' as const,
      binauralMode: 'alpha' as const,
      toneWarmthCutoff: 650,
      volume: 0.85,
    }
    expect(saveSoundPreferences(prefs)).toBe(true)
    expect(loadSoundPreferences()).toEqual(prefs)
  })

  it('clamps toneWarmthCutoff to [MIN_TONE_WARMTH, MAX_TONE_WARMTH]', () => {
    localStorage.setItem(
      'ff2_sound_prefs',
      JSON.stringify({
        baseTexture: 'waves',
        binauralMode: 'theta',
        toneWarmthCutoff: 9999,
        volume: 0.5,
      }),
    )
    expect(loadSoundPreferences().toneWarmthCutoff).toBe(MAX_TONE_WARMTH)

    localStorage.setItem(
      'ff2_sound_prefs',
      JSON.stringify({
        baseTexture: 'waves',
        binauralMode: 'theta',
        toneWarmthCutoff: -50,
        volume: 0.5,
      }),
    )
    expect(loadSoundPreferences().toneWarmthCutoff).toBe(MIN_TONE_WARMTH)
  })

  it('clamps volume to [0, 1]', () => {
    localStorage.setItem(
      'ff2_sound_prefs',
      JSON.stringify({
        baseTexture: 'brown',
        binauralMode: 'off',
        toneWarmthCutoff: 800,
        volume: 2.5,
      }),
    )
    expect(loadSoundPreferences().volume).toBe(1)

    localStorage.setItem(
      'ff2_sound_prefs',
      JSON.stringify({
        baseTexture: 'brown',
        binauralMode: 'off',
        toneWarmthCutoff: 800,
        volume: -0.5,
      }),
    )
    expect(loadSoundPreferences().volume).toBe(0)
  })

  it('maps legacy noise to brown texture', () => {
    localStorage.setItem(
      'ff2_sound_prefs',
      JSON.stringify({
        baseTexture: 'noise',
        binauralMode: 'off',
        toneWarmthCutoff: 800,
        volume: 0.7,
      }),
    )
    expect(loadSoundPreferences().baseTexture).toBe('brown')
  })

  it('validates custom sound ID and falls back corrupted custom sound to brown', () => {
    localStorage.setItem(
      'ff2_sound_prefs',
      JSON.stringify({
        baseTexture: 'custom:my_valid_id',
        binauralMode: 'off',
        toneWarmthCutoff: 800,
        volume: 0.7,
      }),
    )
    expect(loadSoundPreferences().baseTexture).toBe('custom:my_valid_id')

    localStorage.setItem(
      'ff2_sound_prefs',
      JSON.stringify({
        baseTexture: 'custom:',
        binauralMode: 'off',
        toneWarmthCutoff: 800,
        volume: 0.7,
      }),
    )
    expect(loadSoundPreferences().baseTexture).toBe('brown')
  })

  it('falls back unrecognized baseTexture to none', () => {
    localStorage.setItem(
      'ff2_sound_prefs',
      JSON.stringify({
        baseTexture: 'unknown_synth_sound',
        binauralMode: 'off',
        toneWarmthCutoff: 800,
        volume: 0.7,
      }),
    )
    expect(loadSoundPreferences().baseTexture).toBe('none')
  })

  it('validates binauralMode and falls back invalid values to off', () => {
    localStorage.setItem(
      'ff2_sound_prefs',
      JSON.stringify({
        baseTexture: 'none',
        binauralMode: 'gamma_invalid',
        toneWarmthCutoff: 800,
        volume: 0.7,
      }),
    )
    expect(loadSoundPreferences().binauralMode).toBe('off')
  })

  it('falls back to default preferences when JSON is corrupted', () => {
    localStorage.setItem('ff2_sound_prefs', '{"baseTexture": invalid json}')
    expect(loadSoundPreferences()).toEqual(DEFAULT_SOUND_PREFERENCES)
  })

  it('resists prototype pollution attacks against ff2_sound_prefs', () => {
    const malicious = JSON.stringify({
      baseTexture: 'pink',
      binauralMode: 'alpha',
      toneWarmthCutoff: 800,
      volume: 0.7,
      __proto__: { polluted: true },
      constructor: { prototype: { injected: true } },
    })
    localStorage.setItem('ff2_sound_prefs', malicious)

    const loaded = loadSoundPreferences()
    expect(loaded.baseTexture).toBe('pink')
    expect(loaded.binauralMode).toBe('alpha')

    const globalProto = Object.prototype as Record<string, unknown>
    expect(globalProto['polluted']).toBeUndefined()
    expect(globalProto['injected']).toBeUndefined()
  })

  it('migrates legacy ff2_volume when ff2_sound_prefs is absent', () => {
    localStorage.setItem('ff2_volume', '0.92')
    const loaded = loadSoundPreferences()
    expect(loaded.volume).toBe(0.92)
    expect(loaded.baseTexture).toBe('none')
  })

  it('saveSoundPreferences also synchronizes legacy ff2_volume', () => {
    saveSoundPreferences({
      baseTexture: 'waves',
      binauralMode: 'theta',
      toneWarmthCutoff: 900,
      volume: 0.45,
    })
    expect(loadVolume()).toBe(0.45)
  })
})

// ============================================================================
// Milestone 1 Additions: Storage Schema v1.3 Boundaries & Adapters
// ============================================================================

describe('isSessionEntry & sanitizeSessionEntry (Schema v1.3 Micro-steps & Boundaries)', () => {
  it('validates and clamps micro-step checklist items to a maximum of 3 items', () => {
    const dirty = {
      id: 'sess_micro_1',
      date: '2026-09-10T12:00:00.000Z',
      minutes: 25,
      task: 'Checklist task',
      checklist: [
        { id: 'c1', text: 'Step 1', completed: false },
        { id: 'c2', text: 'Step 2', completed: true },
        { id: 'c3', text: 'Step 3', completed: false },
        { id: 'c4', text: 'Step 4 (excess)', completed: true },
        { id: 'c5', text: 'Step 5 (excess)', completed: false },
      ],
    }

    const sanitized = isSessionEntry(dirty)
    expect(sanitized).not.toBeNull()
    expect(sanitized?.checklist).toHaveLength(3)
    expect(sanitized?.checklist?.[0].id).toBe('c1')
    expect(sanitized?.checklist?.[1].id).toBe('c2')
    expect(sanitized?.checklist?.[2].id).toBe('c3')
  })

  it('clamps checklist item text to 140 characters and id to 64 characters', () => {
    const longId = 'id_'.repeat(30) // 90 chars
    const longText = 'A'.repeat(250) // 250 chars
    const dirty = {
      id: 'sess_micro_clamp',
      date: '2026-09-10T12:00:00.000Z',
      minutes: 25,
      task: 'Task',
      checklist: [
        { id: longId, text: longText, completed: true },
      ],
    }

    const sanitized = isSessionEntry(dirty)
    expect(sanitized).not.toBeNull()
    const item = sanitized?.checklist?.[0]
    expect(item?.id.length).toBe(64)
    expect(item?.text.length).toBe(140)
    expect(item?.text).toBe('A'.repeat(140))
    expect(item?.completed).toBe(true)
  })

  it('normalizes checklist item completed flag to boolean', () => {
    const dirty = {
      id: 'sess_micro_bool',
      date: '2026-09-10T12:00:00.000Z',
      minutes: 25,
      task: 'Task',
      checklist: [
        { id: 'c1', text: 'Step 1', completed: true },
        { id: 'c2', text: 'Step 2', completed: false },
        { id: 'c3', text: 'Step 3', completed: 1 as unknown as boolean },
      ],
    }

    const sanitized = isSessionEntry(dirty)
    expect(sanitized?.checklist?.[0].completed).toBe(true)
    expect(sanitized?.checklist?.[1].completed).toBe(false)
    expect(typeof sanitized?.checklist?.[2].completed).toBe('boolean')
  })

  it('filters out invalid, empty, or non-object checklist items', () => {
    const dirty = {
      id: 'sess_micro_invalid',
      date: '2026-09-10T12:00:00.000Z',
      minutes: 25,
      task: 'Task',
      checklist: [
        null,
        'not an object',
        { id: '', text: 'No id', completed: false },
        { id: 'c1', text: '', completed: false },
        { id: 'c2', text: '   ', completed: false },
        { id: 'c3', text: 12345 as unknown as string, completed: false },
        { id: 'valid', text: 'Valid step', completed: true },
      ],
    }

    const sanitized = isSessionEntry(dirty)
    expect(sanitized?.checklist).toHaveLength(1)
    expect(sanitized?.checklist?.[0].id).toBe('valid')
    expect(sanitized?.checklist?.[0].text).toBe('Valid step')
  })

  it('strips prototype pollution payloads from checklist items without polluting Object.prototype', () => {
    const dirty = JSON.parse(
      '{"id":"s_pollute","date":"2026-09-10T12:00:00.000Z","minutes":25,"task":"Task","checklist":[{"id":"c1","text":"Clean","completed":false,"__proto__":{"polluted":true},"constructor":{"prototype":{"pwned":true}}}]}',
    )

    const sanitized = sanitizeSessionEntry(dirty)
    expect(sanitized).not.toBeNull()
    expect(sanitized?.checklist).toHaveLength(1)
    expect(sanitized?.checklist?.[0].id).toBe('c1')

    const globalProto = Object.prototype as Record<string, unknown>
    expect(globalProto['polluted']).toBeUndefined()
    expect(globalProto['pwned']).toBeUndefined()
  })

  it('clamps task string to 200 characters and normalizes empty string or whitespace to null', () => {
    const longTask = 'T'.repeat(300)
    const res1 = isSessionEntry({ id: 's1', date: '2026-09-10T12:00:00.000Z', minutes: 25, task: longTask })
    expect(res1?.task?.length).toBe(200)
    expect(res1?.task).toBe('T'.repeat(200))

    const res2 = isSessionEntry({ id: 's2', date: '2026-09-10T12:00:00.000Z', minutes: 25, task: '' })
    expect(res2?.task).toBeNull()

    const res3 = isSessionEntry({ id: 's3', date: '2026-09-10T12:00:00.000Z', minutes: 25, task: '   \n  \t  ' })
    expect(res3?.task).toBeNull()
  })
})

describe('updateSessionTask', () => {
  it('updates task of target session in-place and persists to storage', () => {
    const initial: SessionLogEntryV2[] = [
      { id: 's1', date: '2026-09-10T10:00:00.000Z', minutes: 25, task: 'Old Task' },
      { id: 's2', date: '2026-09-10T11:00:00.000Z', minutes: 50, task: 'Second Task' },
    ]
    saveSessions(initial)

    const updated = updateSessionTask('s1', 'Refactored Task')
    expect(updated).toHaveLength(2)
    expect(updated[0].id).toBe('s1')
    expect(updated[0].task).toBe('Refactored Task')
    expect(updated[1].task).toBe('Second Task')

    // Verify storage persistence
    const loaded = loadSessions()
    expect(loaded[0].task).toBe('Refactored Task')
  })

  it('clamps updated task string to 200 characters', () => {
    const initial: SessionLogEntryV2[] = [
      { id: 's1', date: '2026-09-10T10:00:00.000Z', minutes: 25, task: 'Original' },
    ]
    saveSessions(initial)

    const longTask = 'U'.repeat(300)
    const updated = updateSessionTask('s1', longTask)
    expect(updated[0].task?.length).toBe(200)
    expect(updated[0].task).toBe('U'.repeat(200))
  })

  it('converts empty string or whitespace-only updated task to null', () => {
    const initial: SessionLogEntryV2[] = [
      { id: 's1', date: '2026-09-10T10:00:00.000Z', minutes: 25, task: 'To be cleared' },
    ]
    saveSessions(initial)

    const updated = updateSessionTask('s1', '    ')
    expect(updated[0].task).toBeNull()
    expect(loadSessions()[0].task).toBeNull()
  })

  it('preserves other session fields (id, date, minutes, checklist) when updating task', () => {
    const initial: SessionLogEntryV2[] = [
      {
        id: 's_full',
        date: '2026-09-10T12:00:00.000Z',
        minutes: 45,
        task: 'Initial Task',
        checklist: [{ id: 'c1', text: 'Step 1', completed: true }],
      },
    ]
    saveSessions(initial)

    const updated = updateSessionTask('s_full', 'New Title')
    expect(updated[0].id).toBe('s_full')
    expect(updated[0].date).toBe('2026-09-10T12:00:00.000Z')
    expect(updated[0].minutes).toBe(45)
    expect(updated[0].checklist).toEqual([{ id: 'c1', text: 'Step 1', completed: true }])
  })

  it('returns sessions unchanged when target session id does not exist', () => {
    const initial: SessionLogEntryV2[] = [
      { id: 's1', date: '2026-09-10T10:00:00.000Z', minutes: 25, task: 'Task' },
    ]
    saveSessions(initial)

    const updated = updateSessionTask('non_existent', 'New Title')
    expect(updated).toEqual(initial)
  })
})

describe('deleteSession', () => {
  it('deletes target session by id and returns deleted record with updated array', () => {
    const s1: SessionLogEntryV2 = { id: 's1', date: '2026-09-10T10:00:00.000Z', minutes: 25, task: 'Task 1' }
    const s2: SessionLogEntryV2 = { id: 's2', date: '2026-09-10T11:00:00.000Z', minutes: 50, task: 'Task 2' }
    saveSessions([s1, s2])

    const result = deleteSession('s1')
    expect(result.deleted).toEqual(s1)
    expect(result.sessions).toHaveLength(1)
    expect(result.sessions[0].id).toBe('s2')

    // Verify storage persistence
    expect(loadSessions()).toEqual([s2])
  })

  it('returns deleted: null and unmodified list when id is not found', () => {
    const initial: SessionLogEntryV2[] = [
      { id: 's1', date: '2026-09-10T10:00:00.000Z', minutes: 25, task: 'Task 1' },
    ]
    saveSessions(initial)

    const result = deleteSession('unknown_id')
    expect(result.deleted).toBeNull()
    expect(result.sessions).toEqual(initial)
    expect(loadSessions()).toEqual(initial)
  })

  it('handles deletion from empty storage gracefully', () => {
    const result = deleteSession('any_id')
    expect(result.deleted).toBeNull()
    expect(result.sessions).toEqual([])
  })

  it('correctly handles deleting the only existing session', () => {
    const s1: SessionLogEntryV2 = { id: 'only_one', date: '2026-09-10T10:00:00.000Z', minutes: 25, task: null }
    saveSessions([s1])

    const result = deleteSession('only_one')
    expect(result.deleted).toEqual(s1)
    expect(result.sessions).toEqual([])
    expect(loadSessions()).toEqual([])
  })
})

describe('loadGoals & saveGoals (Schema v1.3)', () => {
  it('returns default goal settings when storage is empty', () => {
    const goals = loadGoals()
    expect(goals).toEqual({ dailyTargetMinutes: 0, enabled: false })
  })

  it('saves and reloads valid custom goal settings', () => {
    const custom: GoalSettings = { dailyTargetMinutes: 120, enabled: true }
    saveGoals(custom)
    expect(loadGoals()).toEqual(custom)
  })

  it('clamps dailyTargetMinutes to [0, 720]', () => {
    saveGoals({ dailyTargetMinutes: 9999, enabled: true })
    expect(loadGoals().dailyTargetMinutes).toBe(720)

    saveGoals({ dailyTargetMinutes: -50, enabled: true })
    expect(loadGoals().dailyTargetMinutes).toBe(0)
  })

  it('rounds floating-point minutes and clamps non-numeric values to 0', () => {
    saveGoals({ dailyTargetMinutes: 45.7, enabled: true })
    expect(loadGoals().dailyTargetMinutes).toBe(46)

    localStorage.setItem('ff2_goals', JSON.stringify({ dailyTargetMinutes: 'invalid', enabled: true }))
    expect(loadGoals().dailyTargetMinutes).toBe(0)
  })

  it('falls back to defaults when stored JSON is corrupted', () => {
    localStorage.setItem('ff2_goals', '{corrupt json')
    expect(loadGoals()).toEqual({ dailyTargetMinutes: 0, enabled: false })
  })

  it('resists prototype pollution payloads in stored goals', () => {
    const malicious = JSON.stringify({
      dailyTargetMinutes: 100,
      enabled: true,
      __proto__: { polluted: true },
      constructor: { prototype: { injected: true } },
    })
    localStorage.setItem('ff2_goals', malicious)

    const loaded = loadGoals()
    expect(loaded.dailyTargetMinutes).toBe(100)
    expect(loaded.enabled).toBe(true)

    const globalProto = Object.prototype as Record<string, unknown>
    expect(globalProto['polluted']).toBeUndefined()
    expect(globalProto['injected']).toBeUndefined()
  })
})

describe('loadMilestones & saveMilestones (Schema v1.3)', () => {
  it('returns empty array when storage is empty or corrupt', () => {
    expect(loadMilestones()).toEqual([])

    localStorage.setItem('ff2_milestones', '{corrupt json')
    expect(loadMilestones()).toEqual([])

    localStorage.setItem('ff2_milestones', '{"not":"array"}')
    expect(loadMilestones()).toEqual([])
  })

  it('saves and loads valid milestone records', () => {
    const records: MilestoneRecord[] = [
      { id: 'the_first_step', unlockedAt: '2026-09-10T12:00:00.000Z', seen: true },
      { id: 'stone_of_stillness', unlockedAt: '2026-09-10T14:00:00.000Z', seen: false },
    ]
    saveMilestones(records)
    expect(loadMilestones()).toEqual(records)
  })

  it('discards malformed milestone items in stored array', () => {
    const mixed = [
      { id: 'valid_1', unlockedAt: '2026-09-10T12:00:00.000Z', seen: true },
      null,
      'invalid string',
      { id: '', unlockedAt: '2026-09-10T12:00:00.000Z', seen: false },
      { id: 'bad_date', unlockedAt: 'not-a-date', seen: false },
      { id: 'valid_2', unlockedAt: '2026-09-10T13:00:00.000Z', seen: false },
    ]
    localStorage.setItem('ff2_milestones', JSON.stringify(mixed))

    const loaded = loadMilestones()
    expect(loaded).toHaveLength(2)
    expect(loaded[0].id).toBe('valid_1')
    expect(loaded[1].id).toBe('valid_2')
  })

  it('strips prototype pollution attacks from stored milestones', () => {
    const malicious = JSON.stringify([
      {
        id: 'the_first_step',
        unlockedAt: '2026-09-10T12:00:00.000Z',
        seen: true,
        __proto__: { polluted: true },
      },
    ])
    localStorage.setItem('ff2_milestones', malicious)

    const loaded = loadMilestones()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].id).toBe('the_first_step')

    const globalProto = Object.prototype as Record<string, unknown>
    expect(globalProto['polluted']).toBeUndefined()
  })
})


