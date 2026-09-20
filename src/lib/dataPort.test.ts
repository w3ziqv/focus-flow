import { beforeEach, describe, expect, it, vi } from 'vitest'
import type {
  BackupFile,
  BackupFileV2,
  SessionLogEntryV2,
  Settings,
  StatsV2,
  TaskPreset,
} from '../types'
import { exportData, exportDataString, importData, isBackupFile } from './dataPort'
import {
  loadCustomSounds,
  loadInterface,
  loadLang,
  loadPresets,
  loadSessions,
  loadSettings,
  loadStats,
  loadTheme,
  loadVolume,
  saveCustomSounds,
  saveInterface,
  saveLang,
  savePresets,
  saveSessions,
  saveSettings,
  saveStats,
  saveTheme,
  saveVolume,
} from './storage'

const { soundBlobs } = vi.hoisted(() => ({
  soundBlobs: new Map<string, { name: string; blob: Blob }>(),
}))

vi.mock('./soundStore', () => ({
  putSound: vi.fn(async (id: string, name: string, blob: Blob) => {
    soundBlobs.set(id, { name, blob })
  }),
  getSoundBlob: vi.fn(async (id: string) => soundBlobs.get(id)?.blob ?? null),
  deleteSound: vi.fn(async () => undefined),
  migrateLegacySounds: vi.fn(async () => undefined),
  isAudioUpload: vi.fn(() => true),
  probeAudio: vi.fn(async () => true),
}))

beforeEach(() => {
  localStorage.clear()
  soundBlobs.clear()
})

describe('dataPort - exportData & exportDataString', () => {
  it('exports Schema v2 snapshot capturing all 9 state slices with accurate metadata', async () => {
    const customSettings: Settings = { focus: 45, short: 10, long: 30, rounds: 5, autoStart: true }
    saveSettings(customSettings)

    const customStats: StatsV2 = {
      today: 3,
      week: 12,
      streak: 6,
      minutes: 540,
      date: new Date().toDateString(),
      weekStart: new Date().toDateString(),
      lastDate: new Date().toDateString(),
      history: { [new Date().toDateString()]: 540 },
      goals: { dailyTargetMinutes: 120, enabled: true },
      milestones: [{ id: 'zen-first-step', unlockedAt: '2026-09-01T10:00:00.000Z', seen: true }],
    }
    saveStats(customStats)

    const customSessions: SessionLogEntryV2[] = [
      {
        id: 's-exp-1',
        date: '2026-09-15T14:30:00.000Z',
        minutes: 45,
        task: 'Refactor Backup Engine',
        checklist: [
          { id: 'c1', text: 'Define v2 schema types', completed: true },
          { id: 'c2', text: 'Implement exportData', completed: true },
        ],
      },
      {
        id: 's-exp-2',
        date: '2026-09-15T15:30:00.000Z',
        minutes: 25,
        task: null,
      },
    ]
    saveSessions(customSessions)

    const customPresets: TaskPreset[] = [
      { id: 'p1', label: 'Architecture Review' },
      { id: 'p2', label: 'Core Implementation' },
    ]
    savePresets(customPresets)

    saveCustomSounds([{ id: 'snd-ocean', name: 'Pacific Waves' }])
    soundBlobs.set('snd-ocean', {
      name: 'Pacific Waves',
      blob: new Blob(['synthetic-ocean-audio'], { type: 'audio/mpeg' }),
    })

    saveLang('en')
    saveTheme('dark')
    saveVolume(0.85)
    saveInterface({ reduceMotion: true, showGreeting: false })

    const backup = await exportData()

    // Root envelope
    expect(backup.app).toBe('focus-flow')
    expect(backup.version).toBe(2)
    expect(typeof backup.exportedAt).toBe('string')
    expect(Number.isNaN(Date.parse(backup.exportedAt))).toBe(false)

    // Data slices
    expect(backup.data.settings).toEqual(customSettings)
    expect(backup.data.stats.minutes).toBe(540)
    expect(backup.data.stats.goals).toEqual({ dailyTargetMinutes: 120, enabled: true })
    expect(backup.data.stats.milestones).toHaveLength(1)
    expect(backup.data.sessions).toEqual(customSessions)
    expect(backup.data.presets).toEqual(customPresets)
    expect(backup.data.lang).toBe('en')
    expect(backup.data.theme).toBe('dark')
    expect(backup.data.volume).toBe(0.85)
    expect(backup.data.interface).toEqual({ reduceMotion: true, showGreeting: false })

    // Sound audio serialization
    expect(backup.data.sounds).toHaveLength(1)
    expect(backup.data.sounds[0].id).toBe('snd-ocean')
    expect(backup.data.sounds[0].name).toBe('Pacific Waves')
    expect(backup.data.sounds[0].audio).toMatch(/^data:audio\/mpeg;base64,/)
  })

  it('formats exportData as a readable JSON string via exportDataString', async () => {
    saveSettings({ focus: 30, short: 5, long: 15, rounds: 4, autoStart: false })
    const jsonString = await exportDataString()

    expect(typeof jsonString).toBe('string')
    const parsed = JSON.parse(jsonString) as BackupFileV2
    expect(parsed.app).toBe('focus-flow')
    expect(parsed.version).toBe(2)
    expect(parsed.data.settings.focus).toBe(30)
  })

  it('gracefully continues export when sound blobs are unreadable', async () => {
    saveCustomSounds([{ id: 'corrupt-snd', name: 'Missing Audio' }])
    // soundBlobs doesn't contain 'corrupt-snd', getSoundBlob resolves null

    const backup = await exportData()
    expect(backup.data.sounds).toEqual([])
    expect(backup.version).toBe(2)
  })
})

describe('dataPort - importData Schema v2 Restore', () => {
  it('cleanly restores complete Schema v2 backup and persists state', async () => {
    const backupV2: BackupFileV2 = {
      app: 'focus-flow',
      version: 2,
      exportedAt: '2026-09-16T12:00:00.000Z',
      data: {
        settings: { focus: 50, short: 10, long: 20, rounds: 4, autoStart: true },
        stats: {
          today: 4,
          week: 16,
          streak: 8,
          minutes: 800,
          date: new Date().toDateString(),
          weekStart: new Date().toDateString(),
          lastDate: new Date().toDateString(),
          history: { [new Date().toDateString()]: 800 },
          goals: { dailyTargetMinutes: 200, enabled: true },
          milestones: [{ id: 'zen-stone', unlockedAt: '2026-09-10T12:00:00.000Z', seen: false }],
        },
        sessions: [
          {
            id: 's-v2-1',
            date: '2026-09-16T10:00:00.000Z',
            minutes: 50,
            task: 'Design Schema v2',
            checklist: [{ id: 'chk-1', text: 'Draft specification', completed: true }],
          },
        ],
        presets: [
          { id: 'p-focus', label: 'Deep Coding' },
          { id: 'p-write', label: 'Tech Writing' },
        ],
        sounds: [
          {
            id: 's-imported',
            name: 'Rain Storm',
            audio: 'data:audio/mpeg;base64,cmFpbi1hdWRpby1ieXRlcw==',
          },
        ],
        lang: 'en',
        theme: 'dark',
        volume: 0.9,
        interface: { reduceMotion: true, showGreeting: false },
      },
    }

    const result = await importData(JSON.stringify(backupV2))
    expect(result).toEqual({ success: true, count: 1 })

    // Verify storage persistence
    expect(loadSettings().focus).toBe(50)
    expect(loadStats().minutes).toBe(800)
    expect(loadStats().goals?.dailyTargetMinutes).toBe(200)
    expect(loadStats().milestones).toHaveLength(1)
    expect(loadSessions()).toEqual(backupV2.data.sessions)
    expect(loadPresets()).toEqual(backupV2.data.presets)
    expect(loadLang()).toBe('en')
    expect(loadTheme()).toBe('dark')
    expect(loadVolume()).toBe(0.9)
    expect(loadInterface()).toEqual({ reduceMotion: true, showGreeting: false })

    // Verify sound blob persistence in soundStore
    expect(loadCustomSounds()).toEqual([{ id: 's-imported', name: 'Rain Storm' }])
    expect(soundBlobs.get('s-imported')?.name).toBe('Rain Storm')
    expect(await soundBlobs.get('s-imported')?.blob.text()).toBe('rain-audio-bytes')
  })

  it('sanitizes session entries during Schema v2 restore', async () => {
    const rawSessions = [
      {
        id: 's-sanitize-1',
        date: '2026-09-16T08:00:00.000Z',
        minutes: 25.4, // non-integer -> should be rounded to 25
        task: 'A'.repeat(300), // > 200 chars -> should be clamped to 200
        checklist: [
          { id: 'c1', text: 'B'.repeat(200), completed: true }, // text clamped to 140
          { id: 'c2', text: 'Step 2', completed: false },
          { id: 'c3', text: 'Step 3', completed: true },
          { id: 'c4', text: 'Extra Step (exceeds max 3)', completed: false }, // discarded
        ],
      },
    ]

    const backup = {
      app: 'focus-flow',
      version: 2,
      exportedAt: '2026-09-16T08:00:00.000Z',
      data: {
        settings: { focus: 25, short: 5, long: 15, rounds: 4, autoStart: false },
        stats: { today: 1, week: 1, streak: 1, minutes: 25, history: {} },
        sessions: rawSessions,
        presets: [{ id: 'p1', label: 'Preset ' + 'X'.repeat(300) }], // label clamped to 200
        sounds: [],
        lang: 'pl',
        theme: 'light',
        volume: 0.7,
        interface: { reduceMotion: false, showGreeting: true },
      },
    }

    const result = await importData(JSON.stringify(backup))
    expect(result).toEqual({ success: true, count: 1 })

    const saved = loadSessions()
    expect(saved).toHaveLength(1)
    expect(saved[0].minutes).toBe(25)
    expect(saved[0].task).toBe('A'.repeat(200))
    expect(saved[0].checklist).toHaveLength(3)
    expect(saved[0].checklist?.[0].text).toBe('B'.repeat(140))

    const savedPresets = loadPresets()
    expect(savedPresets[0].label).toBe(('Preset ' + 'X'.repeat(300)).slice(0, 200))
  })
})

describe('dataPort - importData Schema v1 Backward Compatibility', () => {
  it('imports legacy Schema v1 backup files and preserves existing sessions and presets', async () => {
    // Pre-populate storage with existing v2 sessions and presets
    const existingSessions: SessionLogEntryV2[] = [
      { id: 's-pre-existing', date: '2026-09-14T09:00:00.000Z', minutes: 25, task: 'Pre-existing Task' },
    ]
    saveSessions(existingSessions)

    const existingPresets: TaskPreset[] = [
      { id: 'p-pre-existing', label: 'Pre-existing Preset' },
    ]
    savePresets(existingPresets)

    saveInterface({ reduceMotion: true, showGreeting: false })

    const legacyV1: BackupFile = {
      app: 'focus-flow',
      version: 1,
      exportedAt: '2026-01-01T00:00:00.000Z',
      data: {
        settings: { focus: 35, short: 7, long: 21, rounds: 3, autoStart: true },
        stats: {
          today: 1,
          week: 5,
          streak: 3,
          minutes: 175,
          date: new Date().toDateString(),
          weekStart: new Date().toDateString(),
          lastDate: new Date().toDateString(),
          history: { [new Date().toDateString()]: 175 },
        },
        sounds: [{ id: 'cs-leg', name: 'Legacy Chime', audio: 'data:audio/mpeg;base64,bGVnYWN5LWJ5dGVz' }],
        lang: 'en',
        theme: 'dark',
        volume: 0.6,
      },
    }

    const result = await importData(JSON.stringify(legacyV1))
    expect(result).toEqual({ success: true, count: 0 })

    // Legacy values restored
    expect(loadSettings().focus).toBe(35)
    expect(loadStats().minutes).toBe(175)
    expect(loadLang()).toBe('en')
    expect(loadTheme()).toBe('dark')
    expect(loadVolume()).toBe(0.6)
    expect(loadCustomSounds()).toEqual([{ id: 'cs-leg', name: 'Legacy Chime' }])

    // Existing sessions, presets, and interface MUST NOT be erased
    expect(loadSessions()).toEqual(existingSessions)
    expect(loadPresets()).toEqual(existingPresets)
    expect(loadInterface()).toEqual({ reduceMotion: true, showGreeting: false })
  })

  it('imports pre-IndexedDB legacy backups carrying inline dataUrl audio', async () => {
    const legacyBackup = JSON.stringify({
      app: 'focus-flow',
      version: 1,
      exportedAt: '2026-01-01T00:00:00.000Z',
      data: {
        settings: {},
        stats: {},
        sounds: [{ id: 'cs9', name: 'inline-sound', dataUrl: 'data:audio/mpeg;base64,SGVsbG8=' }],
        lang: 'pl',
        theme: 'light',
        volume: 0.7,
      },
    })

    const result = await importData(legacyBackup)
    expect(result).toEqual({ success: true, count: 0 })
    expect(loadCustomSounds()).toEqual([{ id: 'cs9', name: 'inline-sound' }])
    expect(await soundBlobs.get('cs9')?.blob.text()).toBe('Hello')
  })
})

describe('dataPort - Validation & Security Rejection', () => {
  it('rejects non-string inputs', async () => {
    // @ts-expect-error test invalid argument types
    expect(await importData(null)).toEqual({ success: false, error: expect.stringMatching(/string/i) })
    // @ts-expect-error test invalid argument types
    expect(await importData(undefined)).toEqual({ success: false, error: expect.stringMatching(/string/i) })
    // @ts-expect-error test invalid argument types
    expect(await importData(12345)).toEqual({ success: false, error: expect.stringMatching(/string/i) })
  })

  it('rejects malformed and unparseable JSON', async () => {
    expect(await importData('not valid json')).toEqual({
      success: false,
      error: expect.stringMatching(/malformed json/i),
    })
    expect(await importData('{ "app": "focus-flow", incomplete ')).toEqual({
      success: false,
      error: expect.stringMatching(/malformed json/i),
    })
  })

  it('rejects non-object JSON roots', async () => {
    expect(await importData('"plain string"')).toEqual({
      success: false,
      error: expect.stringMatching(/root must be an object/i),
    })
    expect(await importData('true')).toEqual({
      success: false,
      error: expect.stringMatching(/root must be an object/i),
    })
    expect(await importData('[1, 2, 3]')).toEqual({
      success: false,
      error: expect.stringMatching(/root must be an object/i),
    })
  })

  it('rejects payloads with wrong app identifier', async () => {
    const wrongApp = JSON.stringify({
      app: 'pomodoro-tracker',
      version: 2,
      exportedAt: new Date().toISOString(),
      data: {},
    })
    expect(await importData(wrongApp)).toEqual({
      success: false,
      error: expect.stringMatching(/unsupported application/i),
    })
  })

  it('rejects payloads with missing or unsupported schema version', async () => {
    const missingVersion = JSON.stringify({
      app: 'focus-flow',
      exportedAt: new Date().toISOString(),
      data: {},
    })
    expect(await importData(missingVersion)).toEqual({
      success: false,
      error: expect.stringMatching(/unsupported backup version/i),
    })

    const futureVersion = JSON.stringify({
      app: 'focus-flow',
      version: 99,
      exportedAt: new Date().toISOString(),
      data: {},
    })
    expect(await importData(futureVersion)).toEqual({
      success: false,
      error: expect.stringMatching(/unsupported backup version: 99/i),
    })
  })

  it('rejects payloads with missing or invalid exportedAt timestamp', async () => {
    const badDate = JSON.stringify({
      app: 'focus-flow',
      version: 2,
      exportedAt: 'not-a-valid-timestamp',
      data: {},
    })
    expect(await importData(badDate)).toEqual({
      success: false,
      error: expect.stringMatching(/invalid exportedAt timestamp/i),
    })
  })

  it('rejects payloads with missing, null, or non-object data field', async () => {
    const noData = JSON.stringify({
      app: 'focus-flow',
      version: 2,
      exportedAt: new Date().toISOString(),
    })
    expect(await importData(noData)).toEqual({
      success: false,
      error: expect.stringMatching(/missing or malformed data payload/i),
    })

    const nullData = JSON.stringify({
      app: 'focus-flow',
      version: 2,
      exportedAt: new Date().toISOString(),
      data: null,
    })
    expect(await importData(nullData)).toEqual({
      success: false,
      error: expect.stringMatching(/missing or malformed data payload/i),
    })
  })

  it('rejects prototype pollution payloads and safeguards Object.prototype', async () => {
    const maliciousPayload = `{
      "app": "focus-flow",
      "version": 2,
      "exportedAt": "2026-09-16T10:00:00.000Z",
      "__proto__": { "polluted": true },
      "data": {
        "constructor": { "prototype": { "admin": true } },
        "settings": { "focus": 25 },
        "stats": {},
        "sessions": [],
        "presets": [],
        "sounds": [],
        "lang": "pl",
        "theme": "light",
        "volume": 0.7,
        "interface": {}
      }
    }`

    const result = await importData(maliciousPayload)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toMatch(/prototype pollution/i)
    }

    // Verify Object.prototype remains untainted
    expect((Object.prototype as unknown as Record<string, unknown>).polluted).toBeUndefined()
    expect((Object.prototype as unknown as Record<string, unknown>).admin).toBeUndefined()
  })

  it('rejects corrupted session entries in Schema v2 without mutating storage', async () => {
    saveSettings({ focus: 25, short: 5, long: 15, rounds: 4, autoStart: false })

    const corruptSessionsPayload = JSON.stringify({
      app: 'focus-flow',
      version: 2,
      exportedAt: '2026-09-16T10:00:00.000Z',
      data: {
        settings: { focus: 40, short: 8, long: 20, rounds: 4, autoStart: true },
        stats: { today: 1, week: 1, streak: 1, minutes: 25, history: {} },
        sessions: [
          { id: '', date: '2026-09-16T10:00:00.000Z', minutes: 25 }, // empty id
        ],
        presets: [],
        sounds: [],
        lang: 'pl',
        theme: 'light',
        volume: 0.7,
        interface: { reduceMotion: false, showGreeting: true },
      },
    })

    const result = await importData(corruptSessionsPayload)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toMatch(/corrupted session entry/i)
    }

    // Confirm settings were not mutated due to atomic rejection
    expect(loadSettings().focus).toBe(25)
  })

  it('rejects corrupted presets in Schema v2', async () => {
    const corruptPresetPayload = JSON.stringify({
      app: 'focus-flow',
      version: 2,
      exportedAt: '2026-09-16T10:00:00.000Z',
      data: {
        settings: { focus: 25, short: 5, long: 15, rounds: 4, autoStart: false },
        stats: { today: 0, week: 0, streak: 0, minutes: 0, history: {} },
        sessions: [],
        presets: [{ id: 'p1', label: '' }], // empty label
        sounds: [],
        lang: 'pl',
        theme: 'light',
        volume: 0.7,
        interface: { reduceMotion: false, showGreeting: true },
      },
    })

    const result = await importData(corruptPresetPayload)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toMatch(/corrupted task preset/i)
    }
  })

  it('rejects oversized backup files exceeding maximum allowed size', async () => {
    const payload = '{"app":"focus-flow","version":2,"exportedAt":"2026-09-16T12:00:00.000Z","data":{}}'
    const result = await importData(payload, 20) // limit to 20 bytes
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toMatch(/maximum allowed size/i)
    }
  })
})

describe('dataPort - isBackupFile predicate', () => {
  it('identifies valid Schema v1 and v2 backup envelopes', () => {
    const v1: BackupFile = {
      app: 'focus-flow',
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        settings: { focus: 25, short: 5, long: 15, rounds: 4, autoStart: false },
        stats: {
          today: 0,
          week: 0,
          streak: 0,
          minutes: 0,
          date: '',
          weekStart: '',
          lastDate: null,
          history: {},
        },
        sounds: [],
        lang: 'pl',
        theme: 'light',
        volume: 0.7,
      },
    }

    const v2: BackupFileV2 = {
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
          date: '',
          weekStart: '',
          lastDate: null,
          history: {},
        },
        sessions: [],
        presets: [],
        sounds: [],
        lang: 'en',
        theme: 'dark',
        volume: 0.8,
        interface: { reduceMotion: false, showGreeting: true },
      },
    }

    expect(isBackupFile(v1)).toBe(true)
    expect(isBackupFile(v2)).toBe(true)
  })

  it('rejects invalid structures and values', () => {
    expect(isBackupFile(null)).toBe(false)
    expect(isBackupFile(undefined)).toBe(false)
    expect(isBackupFile('string')).toBe(false)
    expect(isBackupFile(42)).toBe(false)
    expect(isBackupFile({})).toBe(false)
    expect(isBackupFile({ app: 'other-app', version: 2 })).toBe(false)
    expect(isBackupFile({ app: 'focus-flow', version: 3 })).toBe(false)
    expect(isBackupFile({ app: 'focus-flow', version: 2, exportedAt: 'invalid' })).toBe(false)
    expect(isBackupFile({ app: 'focus-flow', version: 2, exportedAt: new Date().toISOString(), data: null })).toBe(false)
  })
})

