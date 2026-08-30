import { beforeEach, describe, expect, it } from 'vitest'
import type { Stats } from '../types'
import { loadCustomSounds, loadSettings, loadStats, saveCustomSounds, weekStartOf } from './storage'

beforeEach(() => {
  localStorage.clear()
})

describe('loadSettings', () => {
  it('returns defaults when storage is empty', () => {
    expect(loadSettings()).toEqual({ focus: 25, short: 5, long: 15, rounds: 4, autoStart: false })
  })

  it('clamps out-of-range values', () => {
    localStorage.setItem('ff2_settings', JSON.stringify({ focus: 9999, short: -5, long: 15, rounds: 4, autoStart: true }))
    const settings = loadSettings()
    expect(settings.focus).toBe(120)
    expect(settings.short).toBe(1)
    expect(settings.autoStart).toBe(true)
  })

  it('falls back to defaults for corrupt JSON', () => {
    localStorage.setItem('ff2_settings', '{not json')
    expect(loadSettings()).toEqual({ focus: 25, short: 5, long: 15, rounds: 4, autoStart: false })
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

describe('loadStats', () => {
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

  it('returns a fresh record for corrupt JSON', () => {
    localStorage.setItem('ff2_stats', 'null')
    const stats = loadStats()
    expect(stats.today).toBe(0)
    expect(stats.streak).toBe(0)
    expect(stats.history).toEqual({})
  })
})
