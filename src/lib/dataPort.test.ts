import { beforeEach, describe, expect, it } from 'vitest'
import type { Stats } from '../types'
import { exportData, importData } from './dataPort'
import { loadSettings, loadStats, saveStats } from './storage'

beforeEach(() => {
  localStorage.clear()
})

describe('dataPort', () => {
  it('round-trips settings, stats and sounds through a backup file', () => {
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

    const backup = JSON.stringify(exportData())
    localStorage.clear()
    expect(loadSettings().focus).toBe(25)

    expect(importData(backup)).toBe(true)
    expect(loadSettings().focus).toBe(40)
    expect(loadStats().minutes).toBe(400)
    expect(loadStats().streak).toBe(4)
  })

  it('rejects files that are not Focus Flow backups', () => {
    expect(importData('not json')).toBe(false)
    expect(importData('{}')).toBe(false)
    expect(importData(JSON.stringify({ app: 'other-app', data: {} }))).toBe(false)
  })
})
