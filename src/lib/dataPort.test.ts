import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Stats } from '../types'
import { exportData, importData } from './dataPort'
import { loadCustomSounds, loadSettings, loadStats, saveCustomSounds, saveStats } from './storage'

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
}))

beforeEach(() => {
  localStorage.clear()
  soundBlobs.clear()
})

describe('dataPort', () => {
  it('round-trips settings, stats and sounds through a backup file', async () => {
    const settings = { focus: 40, short: 9, long: 25, rounds: 3, autoStart: true }
    localStorage.setItem('ff2_settings', JSON.stringify(settings))
    const stats: Stats = {
      today: 2,
      week: 7,
      streak: 4,
      minutes: 400,
      date: new Date().toDateString(),
      weekStart: new Date().toDateString(),
      lastDate: new Date().toDateString(),
      history: { [new Date().toDateString()]: 400 },
    }
    saveStats(stats)
    saveCustomSounds([{ id: 'cs1', name: 'waves' }])
    soundBlobs.set('cs1', { name: 'waves', blob: new Blob(['audio-bytes'], { type: 'audio/mpeg' }) })

    const backup = JSON.stringify(await exportData())
    localStorage.clear()
    soundBlobs.clear()
    expect(loadSettings().focus).toBe(25)

    expect(await importData(backup)).toBe(true)
    expect(loadSettings().focus).toBe(40)
    expect(loadStats().minutes).toBe(400)
    expect(loadStats().streak).toBe(4)
    expect(loadCustomSounds()).toEqual([{ id: 'cs1', name: 'waves' }])
    expect(soundBlobs.get('cs1')?.name).toBe('waves')
    expect(await soundBlobs.get('cs1')?.blob.text()).toBe('audio-bytes')
  })

  it('imports pre-IndexedDB backups that carry inline dataUrl audio', async () => {
    const backup = JSON.stringify({
      app: 'focus-flow',
      version: 1,
      exportedAt: '2026-01-01T00:00:00.000Z',
      data: {
        settings: {},
        stats: {},
        sounds: [{ id: 'cs9', name: 'legacy', dataUrl: 'data:audio/mpeg;base64,SGVsbG8=' }],
        lang: 'pl',
        theme: 'light',
        volume: 0.7,
      },
    })

    expect(await importData(backup)).toBe(true)
    expect(loadCustomSounds()).toEqual([{ id: 'cs9', name: 'legacy' }])
    expect(await soundBlobs.get('cs9')?.blob.text()).toBe('Hello')
  })

  it('rejects files that are not Focus Flow backups', async () => {
    expect(await importData('not json')).toBe(false)
    expect(await importData('{}')).toBe(false)
    expect(await importData(JSON.stringify({ app: 'other-app', data: {} }))).toBe(false)
  })
})
