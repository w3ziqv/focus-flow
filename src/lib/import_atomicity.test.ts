import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { exportData, importData } from './dataPort'
import { addSession, loadSessions, loadSettings, loadStats, saveCustomSounds, saveSettings, saveStats } from './storage'

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())
const snapshot = () => Object.fromEntries(Object.entries(localStorage))

async function fixture() {
  saveSettings({ focus: 25, short: 5, long: 15, rounds: 4, autoStart: false })
  addSession({ id: 'original-session', date: '2026-11-04T12:00:00Z', minutes: 25, task: 'Keep this history' })
  saveStats({ ...loadStats(), minutes: 25, goals: { dailyTargetMinutes: 60, enabled: true }, milestones: [{ id: 'first', unlockedAt: '2026-11-04T12:00:00Z', seen: false }] })
  const backup = await exportData()
  backup.data.settings.focus = 45
  backup.data.stats.minutes = 45
  backup.data.stats.goals = { dailyTargetMinutes: 120, enabled: true }
  backup.data.stats.milestones = [{ id: 'next', unlockedAt: '2026-11-04T13:00:00Z', seen: true }]
  backup.data.sessions = [{ id: 'replacement-session', date: '2026-11-04T13:00:00Z', minutes: 45, task: 'Imported history' }]
  backup.data.presets = [{ id: 'new-preset', label: 'Imported preset' }]
  backup.data.interface.showGreeting = !backup.data.interface.showGreeting
  backup.data.lang = 'pl'
  backup.data.theme = 'sage'
  backup.data.volume = 0.25
  return backup
}

function failWrite(keyToFail: string, always = false) {
  const original = Storage.prototype.setItem
  let failed = false
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
    if (key === keyToFail && (!failed || always)) {
      failed = true
      throw new DOMException('Storage quota exceeded', 'QuotaExceededError')
    }
    return original.call(this, key, value)
  })
  return () => failed
}

describe('backup import write failures', () => {
  it.each(['ff2_settings', 'ff2_stats', 'ff2_goals', 'ff2_milestones', 'ff2_sessions', 'ff2_presets', 'ff2_interface', 'ff2_lang', 'ff2_theme', 'ff2_volume', 'ff3_cloud_outbox'])(
    'rolls back all core fields and pending cloud writes when %s fails', async key => {
      const backup = await fixture()
      const before = snapshot()
      const didFail = failWrite(key)
      const changed = vi.fn()
      window.addEventListener('focus-flow:storage', changed)
      try {
        expect(await importData(JSON.stringify(backup))).toMatchObject({ success: false, reason: 'storage' })
        expect(didFail()).toBe(true)
        expect(snapshot()).toEqual(before)
        expect(changed).not.toHaveBeenCalled()
      } finally { window.removeEventListener('focus-flow:storage', changed) }
    },
  )
  it('keeps existing history when its key remains unwritable', async () => {
    const backup = await fixture()
    const before = snapshot()
    failWrite('ff2_sessions', true)
    expect((await importData(JSON.stringify(backup))).success).toBe(false)
    expect(snapshot()).toEqual(before)
  })
  it('notifies observers only after the entire core snapshot is committed', async () => {
    const backup = await fixture()
    const observed: string[] = []
    const changed = () => { observed.push(`${loadSettings().focus}:${loadSessions()[0]?.id}`) }
    window.addEventListener('focus-flow:storage', changed)
    try {
      expect((await importData(JSON.stringify(backup))).success).toBe(true)
      expect(observed.length).toBeGreaterThan(0)
      expect(observed.every(value => value === '45:replacement-session')).toBe(true)
    } finally { window.removeEventListener('focus-flow:storage', changed) }
  })
  it('also rolls back legacy-v1 core writes', async () => {
    const backup = await fixture()
    const before = snapshot()
    failWrite('ff2_theme')
    expect((await importData(JSON.stringify({ ...backup, version: 1 }))).success).toBe(false)
    expect(snapshot()).toEqual(before)
  })
  it('rolls back the core snapshot if audio metadata cannot be committed', async () => {
    const backup = await fixture()
    saveCustomSounds([{ id: 'original-sound', name: 'Original' }])
    failWrite('ff2_sounds')
    const result = await importData(JSON.stringify(backup))
    expect(result).toMatchObject({ success: false, reason: 'storage' })
    expect(loadSettings().focus).toBe(25)
    expect(localStorage.getItem('ff2_sounds')).toContain('original-sound')
  })
})
