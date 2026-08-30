import type { CustomSound, Lang, Settings, Stats, Theme } from '../types'
import {
  loadCustomSounds,
  loadLang,
  loadSettings,
  loadStats,
  loadTheme,
  loadVolume,
  saveCustomSounds,
  saveLang,
  saveSettings,
  saveStats,
  saveTheme,
  saveVolume,
} from './storage'

export interface BackupFile {
  app: 'focus-flow'
  version: 1
  exportedAt: string
  data: {
    settings: Settings
    stats: Stats
    sounds: CustomSound[]
    lang: Lang
    theme: Theme
    volume: number
  }
}

/** Snapshot of every ff2_* key as a portable JSON document. */
export function exportData(): BackupFile {
  return {
    app: 'focus-flow',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      settings: loadSettings(),
      stats: loadStats(),
      sounds: loadCustomSounds(),
      lang: loadLang() ?? 'pl',
      theme: loadTheme() ?? 'light',
      volume: loadVolume(),
    },
  }
}

/**
 * Validates the document shape and hands the values back to the storage
 * validators (the same ones that sanitise on load). Returns false for files
 * that are not a Focus Flow backup.
 */
export function importData(raw: string): boolean {
  let parsed: Partial<BackupFile>
  try {
    parsed = JSON.parse(raw) as Partial<BackupFile>
  } catch {
    return false
  }
  if (parsed?.app !== 'focus-flow' || typeof parsed.exportedAt !== 'string' || typeof parsed.data !== 'object' || parsed.data === null) {
    return false
  }
  const data = parsed.data as Record<string, unknown>
  if (data.settings !== undefined) saveSettings(data.settings as Settings)
  if (data.stats !== undefined) saveStats(data.stats as Stats)
  if (Array.isArray(data.sounds)) saveCustomSounds(data.sounds as CustomSound[])
  if (data.lang === 'pl' || data.lang === 'en') saveLang(data.lang)
  if (data.theme === 'dark' || data.theme === 'light') saveTheme(data.theme)
  if (typeof data.volume === 'number' && data.volume >= 0 && data.volume <= 1) saveVolume(data.volume)
  return true
}
