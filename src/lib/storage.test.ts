import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { InterfacePrefs, SessionLogEntry, SessionSnapshot, Stats } from '../types'
import {
  addSession,
  DEFAULT_INTERFACE,
  DEFAULT_SETTINGS,
  DEFAULT_VOLUME,
  isSessionEntry,
  loadCustomSounds,
  loadInstallDismissed,
  loadInterface,
  loadLang,
  loadOnboardingDone,
  loadSession,
  loadSessions,
  loadSettings,
  loadStats,
  loadTheme,
  loadVolume,
  MAX_SESSIONS,
  sanitizeSessionEntry,
  saveCustomSounds,
  saveInstallDismissed,
  saveInterface,
  saveLang,
  saveOnboardingDone,
  saveSession,
  saveSessions,
  saveSettings,
  saveStats,
  saveTheme,
  saveVolume,
  systemTheme,
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
