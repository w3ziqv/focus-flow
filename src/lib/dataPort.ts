import type {
  BackupFile,
  BackupFileAny,
  BackupFileV2,
  BackupSound,
  CustomSound,
  ImportError,
  ImportResult,
  ImportSuccess,
  SessionLogEntryV2,
  TaskPreset,
} from '../types'
import {
  isInterface,
  isSettings,
  isStats,
  isTaskPreset,
  loadCustomSounds,
  loadInterface,
  loadLang,
  loadPresets,
  loadSessions,
  loadSettings,
  loadStats,
  loadTheme,
  loadVolume,
  sanitizeSessionEntry,
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
import { getSoundBlob, isAudioUpload, probeAudio, putSound } from './soundStore'

export type {
  BackupSound,
  BackupFile,
  BackupFileV2,
  BackupFileAny,
  ImportResult,
  ImportSuccess,
  ImportError,
}


function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Blob read failed'))
    reader.readAsDataURL(blob)
  })
}

/**
 * Snapshot of complete user state as Schema v2 portable JSON document.
 * Captures settings, stats, sessions, presets, custom sound audio, language, theme, volume, and interface prefs.
 */
export async function exportData(): Promise<BackupFileV2> {
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
    version: 2,
    exportedAt: new Date().toISOString(),
    data: {
      settings: loadSettings(),
      stats: loadStats(),
      sessions: loadSessions(),
      presets: loadPresets(),
      sounds,
      lang: loadLang() ?? 'pl',
      theme: loadTheme() ?? 'light',
      volume: loadVolume(),
      interface: loadInterface(),
    },
  }
}

/** Formatted JSON string of exportData(). */
export async function exportDataString(): Promise<string> {
  const backup = await exportData()
  return JSON.stringify(backup, null, 2)
}

/** Type predicate validating if value has the envelope shape of a Focus Flow backup file (v1 or v2). */
export function isBackupFile(val: unknown): val is BackupFileAny {
  if (typeof val !== 'object' || val === null || Array.isArray(val)) {
    return false
  }
  const obj = val as Record<string, unknown>
  if (obj.app !== 'focus-flow') {
    return false
  }
  if (typeof obj.exportedAt !== 'string' || Number.isNaN(Date.parse(obj.exportedAt))) {
    return false
  }
  if (typeof obj.data !== 'object' || obj.data === null || Array.isArray(obj.data)) {
    return false
  }
  const data = obj.data as Record<string, unknown>

  if (obj.version === 1) {
    if (typeof data.settings !== 'object' || data.settings === null) return false
    if (typeof data.stats !== 'object' || data.stats === null) return false
    if (data.sounds !== undefined && !Array.isArray(data.sounds)) return false
    if (data.lang !== undefined && data.lang !== 'pl' && data.lang !== 'en') return false
    if (data.theme !== undefined && data.theme !== 'light' && data.theme !== 'dark') return false
    if (data.volume !== undefined && (typeof data.volume !== 'number' || data.volume < 0 || data.volume > 1)) return false
    return true
  }

  if (obj.version === 2) {
    if (typeof data.settings !== 'object' || data.settings === null) return false
    if (typeof data.stats !== 'object' || data.stats === null) return false
    if (!Array.isArray(data.sessions)) return false
    if (!Array.isArray(data.presets)) return false
    if (!Array.isArray(data.sounds)) return false
    if (data.lang !== 'pl' && data.lang !== 'en') return false
    if (data.theme !== 'light' && data.theme !== 'dark') return false
    if (typeof data.volume !== 'number' || data.volume < 0 || data.volume > 1) return false
    if (typeof data.interface !== 'object' || data.interface === null) return false
    return true
  }

  return false
}

async function restoreSounds(sounds: unknown[]): Promise<void> {
  const metas: CustomSound[] = []
  for (const entry of sounds) {
    if (typeof entry !== 'object' || entry === null) continue
    const v = entry as Record<string, unknown>
    if (typeof v.id !== 'string' || typeof v.name !== 'string') continue
    const audio = typeof v.audio === 'string' ? v.audio : typeof v.dataUrl === 'string' ? v.dataUrl : null
    if (audio !== null) {
      try {
        const blob = await (await fetch(audio)).blob()
        if (!isAudioUpload({ type: blob.type, name: v.name })) continue
        if (!(await probeAudio(blob))) continue
        await putSound(v.id, v.name, blob)
      } catch {
        continue
      }
    }
    metas.push({ id: v.id, name: v.name })
  }
  saveCustomSounds(metas)
}

export const MAX_BACKUP_SIZE_BYTES: number = 250 * 1024 * 1024

/**
 * Safely parses JSON with strict boundary validation, prototype pollution detection,
 * and version detection (v1 backward-compatible migration vs v2 full snapshot restore).
 * Returns { success: true, count: number } on success, or { success: false, error: string } on failure.
 */
export async function importData(raw: string, maxSizeBytes: number = MAX_BACKUP_SIZE_BYTES): Promise<ImportResult> {
  if (typeof raw !== 'string') {
    return { success: false, error: 'Invalid input: backup payload must be a string' }
  }

  // Guard against massive JSON files crashing the thread (max 250 MB)
  if (raw.length > maxSizeBytes) {
    return { success: false, error: 'Backup file exceeds maximum allowed size (250 MB)' }
  }

  let protoPollutionDetected = false
  let parsed: unknown
  try {
    parsed = JSON.parse(raw, (key, value) => {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        protoPollutionDetected = true
        return undefined
      }
      return value
    })
  } catch {
    return { success: false, error: 'Malformed JSON: unable to parse backup file' }
  }

  if (protoPollutionDetected) {
    return { success: false, error: 'Security violation: prototype pollution payload detected' }
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { success: false, error: 'Invalid backup file: root must be an object' }
  }

  const file = parsed as Record<string, unknown>

  if (file.app !== 'focus-flow') {
    return { success: false, error: `Unsupported application: expected 'focus-flow', received '${String(file.app)}'` }
  }

  if (file.version !== 1 && file.version !== 2) {
    return { success: false, error: `Unsupported backup version: ${String(file.version)}` }
  }

  if (typeof file.exportedAt !== 'string' || Number.isNaN(Date.parse(file.exportedAt))) {
    return { success: false, error: 'Invalid backup file: missing or invalid exportedAt timestamp' }
  }

  if (typeof file.data !== 'object' || file.data === null || Array.isArray(file.data)) {
    return { success: false, error: 'Invalid backup file: missing or malformed data payload' }
  }

  const data = file.data as Record<string, unknown>

  // Version 1: restores settings, stats, sounds, lang, theme, volume
  // Preserves existing sessions, presets, and interface without data loss or exceptions.
  if (file.version === 1) {
    if (data.settings !== undefined) {
      const sanitizedSettings = isSettings(data.settings)
      if (sanitizedSettings) {
        saveSettings(sanitizedSettings)
      }
    }

    if (data.stats !== undefined) {
      const sanitizedStats = isStats(data.stats)
      if (sanitizedStats) {
        saveStats(sanitizedStats)
      }
    }

    if (Array.isArray(data.sounds)) {
      await restoreSounds(data.sounds)
    }

    if (data.lang === 'pl' || data.lang === 'en') {
      saveLang(data.lang)
    }

    if (data.theme === 'dark' || data.theme === 'light') {
      saveTheme(data.theme)
    }

    if (typeof data.volume === 'number' && Number.isFinite(data.volume)) {
      saveVolume(Math.min(1, Math.max(0, data.volume)))
    }

    return { success: true, count: 0 }
  }

  // Version 2: validates and sanitizes all fields and persists to storage.
  // 1. Settings
  if (typeof data.settings !== 'object' || data.settings === null || Array.isArray(data.settings)) {
    return { success: false, error: 'Invalid backup file: missing or invalid settings' }
  }
  const settings = isSettings(data.settings)
  if (!settings) {
    return { success: false, error: 'Invalid backup file: settings failed validation' }
  }

  // 2. Stats
  if (typeof data.stats !== 'object' || data.stats === null || Array.isArray(data.stats)) {
    return { success: false, error: 'Invalid backup file: missing or invalid stats' }
  }
  const stats = isStats(data.stats)
  if (!stats) {
    return { success: false, error: 'Invalid backup file: stats failed validation' }
  }

  // 3. Sessions
  if (!Array.isArray(data.sessions)) {
    return { success: false, error: 'Invalid backup file: sessions must be an array' }
  }
  const sanitizedSessions: SessionLogEntryV2[] = []
  for (const item of data.sessions) {
    const sanitized = sanitizeSessionEntry(item)
    if (!sanitized) {
      return { success: false, error: 'Invalid backup file: corrupted session entry detected' }
    }
    sanitizedSessions.push(sanitized)
  }

  // 4. Presets
  if (!Array.isArray(data.presets)) {
    return { success: false, error: 'Invalid backup file: presets must be an array' }
  }
  const sanitizedPresets: TaskPreset[] = []
  for (const item of data.presets) {
    const sanitized = isTaskPreset(item)
    if (!sanitized) {
      return { success: false, error: 'Invalid backup file: corrupted task preset detected' }
    }
    sanitizedPresets.push(sanitized)
  }

  // 5. Interface
  if (typeof data.interface !== 'object' || data.interface === null || Array.isArray(data.interface)) {
    return { success: false, error: 'Invalid backup file: interface must be an object' }
  }
  const interfacePrefs = isInterface(data.interface)
  if (!interfacePrefs) {
    return { success: false, error: 'Invalid backup file: interface failed validation' }
  }

  // 6. Sounds
  if (!Array.isArray(data.sounds)) {
    return { success: false, error: 'Invalid backup file: sounds must be an array' }
  }

  // 7. Lang, Theme, Volume
  if (data.lang !== 'pl' && data.lang !== 'en') {
    return { success: false, error: 'Invalid backup file: lang must be "pl" or "en"' }
  }

  if (data.theme !== 'light' && data.theme !== 'dark') {
    return { success: false, error: 'Invalid backup file: theme must be "light" or "dark"' }
  }

  if (typeof data.volume !== 'number' || !Number.isFinite(data.volume) || data.volume < 0 || data.volume > 1) {
    return { success: false, error: 'Invalid backup file: volume must be a number between 0 and 1' }
  }

  // Persist valid v2 snapshot to storage
  saveSettings(settings)
  saveStats(stats)
  saveSessions(sanitizedSessions)
  savePresets(sanitizedPresets)
  saveInterface(interfacePrefs)
  saveLang(data.lang)
  saveTheme(data.theme)
  saveVolume(data.volume)

  await restoreSounds(data.sounds)

  return { success: true, count: sanitizedSessions.length }
}

