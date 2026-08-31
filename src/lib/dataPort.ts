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
import { getSoundBlob, putSound } from './soundStore'

export interface BackupSound {
  id: string
  name: string
  /** Audio as a data: URL. Present for every sound that could be read at export time. */
  audio?: string
}

export interface BackupFile {
  app: 'focus-flow'
  version: 1
  exportedAt: string
  data: {
    settings: Settings
    stats: Stats
    sounds: BackupSound[]
    lang: Lang
    theme: Theme
    volume: number
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Blob read failed'))
    reader.readAsDataURL(blob)
  })
}

/** Snapshot of every ff2_* key plus custom sound audio, as a portable JSON document. */
export async function exportData(): Promise<BackupFile> {
  const sounds: BackupSound[] = []
  for (const sound of loadCustomSounds()) {
    if (sound.dataUrl !== undefined) {
      sounds.push({ id: sound.id, name: sound.name, audio: sound.dataUrl })
      continue
    }
    try {
      const blob = await getSoundBlob(sound.id)
      if (blob) sounds.push({ id: sound.id, name: sound.name, audio: await blobToDataUrl(blob) })
    } catch {
      // Unreadable blob — the rest of the backup is worth saving without this audio.
    }
  }
  return {
    app: 'focus-flow',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      settings: loadSettings(),
      stats: loadStats(),
      sounds,
      lang: loadLang() ?? 'pl',
      theme: loadTheme() ?? 'light',
      volume: loadVolume(),
    },
  }
}

/**
 * Validates the document shape and hands the values back to the storage
 * validators (the same ones that sanitise on load). Returns false for files
 * that are not a Focus Flow backup. Accepts both current backups (audio under
 * `audio`) and pre-IndexedDB ones (inline `dataUrl`).
 */
export async function importData(raw: string): Promise<boolean> {
  let parsed: Partial<BackupFile>
  try {
    parsed = JSON.parse(raw) as Partial<BackupFile>
  } catch {
    return false
  }
  if (
    parsed?.app !== 'focus-flow' ||
    typeof parsed.exportedAt !== 'string' ||
    typeof parsed.data !== 'object' ||
    parsed.data === null
  ) {
    return false
  }
  const data = parsed.data as Record<string, unknown>
  if (data.settings !== undefined) saveSettings(data.settings as Settings)
  if (data.stats !== undefined) saveStats(data.stats as Stats)
  if (Array.isArray(data.sounds)) {
    const metas: CustomSound[] = []
    for (const entry of data.sounds as unknown[]) {
      if (typeof entry !== 'object' || entry === null) continue
      const v = entry as Record<string, unknown>
      if (typeof v.id !== 'string' || typeof v.name !== 'string') continue
      const audio = typeof v.audio === 'string' ? v.audio : typeof v.dataUrl === 'string' ? v.dataUrl : null
      if (audio !== null) {
        try {
          const blob = await (await fetch(audio)).blob()
          await putSound(v.id, v.name, blob)
        } catch {
          continue
        }
      }
      metas.push({ id: v.id, name: v.name })
    }
    saveCustomSounds(metas)
  }
  if (data.lang === 'pl' || data.lang === 'en') saveLang(data.lang)
  if (data.theme === 'dark' || data.theme === 'light') saveTheme(data.theme)
  if (typeof data.volume === 'number' && data.volume >= 0 && data.volume <= 1) saveVolume(data.volume)
  return true
}
