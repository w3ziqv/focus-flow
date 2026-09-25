import {
  DEFAULT_NARRATION,
  DEFAULT_SHORTCUTS,
  DEFAULT_SOUND_PREFERENCES,
  type BaseSoundTexture,
  type BinauralMode,
  type ChecklistItem,
  type CustomSound,
  type GoalSettings,
  type InterfacePrefs,
  type Lang,
  type MilestoneRecord,
  type NarrationSettings,
  type SessionLogEntry,
  type SessionLogEntryV2,
  type SessionSnapshotV2,
  type Settings,
  type ShortcutKeymap,
  type SoundPreferences,
  type Stats,
  type StatsV2,
  type TaskPreset,
  type Theme,
  type WebhookSettings,
} from '../types'

import type { CloudSyncState, SessionTombstone } from './sync/types'

export const MAX_SOUND_SIZE: number = 200 * 1024 * 1024
export const MAX_SESSIONS: number = 1000
export const MAX_TASK_LENGTH: number = 200
export const MAX_CHECKLIST_ITEMS: number = 3
export const MAX_CHECKLIST_TEXT_LENGTH: number = 140
export const MAX_CHECKLIST_ID_LENGTH: number = 64
export const MIN_GOAL_MINUTES: number = 0
export const MAX_GOAL_MINUTES: number = 720

export const DEFAULT_GOAL_SETTINGS: GoalSettings = {
  dailyTargetMinutes: 0,
  enabled: false,
}

const PREFIX = 'ff2_'
const LEGACY_PREFIX = 'ff_'

const KEYS = {
  settings: `${PREFIX}settings`,
  stats: `${PREFIX}stats`,
  sessions: `${PREFIX}sessions`,
  lang: `${PREFIX}lang`,
  theme: `${PREFIX}theme`,
  sounds: `${PREFIX}sounds`,
  volume: `${PREFIX}volume`,
  soundPrefs: `${PREFIX}sound_prefs`,
  interface: `${PREFIX}interface`,
  migrated: `${PREFIX}migrated`,
  onboardingDone: `${PREFIX}onboardingDone`,
  installDismissed: `${PREFIX}installDismissed`,
  goals: `${PREFIX}goals`,
  milestones: `${PREFIX}milestones`,
  presets: `${PREFIX}presets`,
  webhook: `${PREFIX}webhook`,
  tombstones: `${PREFIX}session_tombstones`,
  cloudSync: `${PREFIX}cloud_sync`,
  lastSyncedUid: `${PREFIX}last_synced_uid`,
} as const

function read<T>(key: string, validate: (value: unknown) => T | null): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return null
    return validate(JSON.parse(raw))
  } catch {
    return null
  }
}

function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    // Quota exceeded or storage unavailable — the caller decides what to tell the user.
    return false
  }
}

function readString(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

/* ---------- validators ---------- */

export const DEFAULT_SETTINGS: Settings = { focus: 25, short: 5, long: 15, rounds: 4, autoStart: false }

export function isSettings(value: unknown): Settings | null {
  if (typeof value !== 'object' || value === null) return null
  const v = value as Record<string, unknown>
  const num = (x: unknown, fallback: number, min: number, max: number) =>
    typeof x === 'number' && Number.isFinite(x) ? Math.min(max, Math.max(min, Math.round(x))) : fallback
  return {
    focus: num(v.focus, DEFAULT_SETTINGS.focus, 1, 120),
    short: num(v.short, DEFAULT_SETTINGS.short, 1, 60),
    long: num(v.long, DEFAULT_SETTINGS.long, 1, 120),
    rounds: num(v.rounds, DEFAULT_SETTINGS.rounds, 1, 20),
    autoStart: typeof v.autoStart === 'boolean' ? v.autoStart : DEFAULT_SETTINGS.autoStart,
  }
}

export function weekStartOf(date: Date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  return d.toDateString()
}

export function isChecklistItem(value: unknown): ChecklistItem | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const v = value as Record<string, unknown>

  if (typeof v.id !== 'string' || v.id.trim() === '') return null
  const id: string = v.id.trim().slice(0, MAX_CHECKLIST_ID_LENGTH)

  if (typeof v.text !== 'string' || v.text.trim() === '') return null
  const text: string = v.text.trim().slice(0, MAX_CHECKLIST_TEXT_LENGTH)

  const completed: boolean = v.completed === true

  return { id, text, completed }
}

export function isChecklist(value: unknown): ChecklistItem[] | undefined {
  if (!Array.isArray(value)) return undefined
  return value
    .map(isChecklistItem)
    .filter((item): item is ChecklistItem => item !== null)
    .slice(0, MAX_CHECKLIST_ITEMS)
}

export function isGoalSettings(value: unknown): GoalSettings | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const v = value as Record<string, unknown>

  let dailyTargetMinutes: number = DEFAULT_GOAL_SETTINGS.dailyTargetMinutes
  const rawTarget: unknown = v.dailyTargetMinutes ?? v.targetMinutes
  if (typeof rawTarget === 'number' && Number.isFinite(rawTarget)) {
    dailyTargetMinutes = Math.min(MAX_GOAL_MINUTES, Math.max(MIN_GOAL_MINUTES, Math.round(rawTarget)))
  } else if (typeof rawTarget === 'string') {
    const parsed = Number(rawTarget)
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      dailyTargetMinutes = Math.min(MAX_GOAL_MINUTES, Math.max(MIN_GOAL_MINUTES, Math.round(parsed)))
    }
  }

  const enabled: boolean = v.enabled === true

  return { dailyTargetMinutes, enabled }
}

export function isMilestoneRecord(value: unknown): MilestoneRecord | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const v = value as Record<string, unknown>

  if (typeof v.id !== 'string' || v.id.trim() === '') return null
  const id: string = v.id.trim().slice(0, 64)

  const rawDate: unknown = v.unlockedAt ?? v.date
  if (typeof rawDate !== 'string' || rawDate.trim() === '') return null
  const parsedDate = Date.parse(rawDate.trim())
  if (Number.isNaN(parsedDate)) return null
  const unlockedAt: string = rawDate.trim()

  const seen: boolean = v.seen === true

  return { id, unlockedAt, seen }
}

export function isMilestones(value: unknown): MilestoneRecord[] | null {
  if (!Array.isArray(value)) return null
  return value
    .map(isMilestoneRecord)
    .filter((m): m is MilestoneRecord => m !== null)
}

export function isStats(value: unknown): StatsV2 | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const v = value as Record<string, unknown>
  const history: Record<string, number> = {}
  if (typeof v.history === 'object' && v.history !== null && !Array.isArray(v.history)) {
    for (const [k, n] of Object.entries(v.history as Record<string, unknown>)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue
      if (typeof n === 'number' && Number.isFinite(n) && n >= 0) history[k] = n
    }
  }
  const today = new Date().toDateString()
  const ws = weekStartOf()
  const date = typeof v.date === 'string' ? v.date : today
  const weekStart = typeof v.weekStart === 'string' ? v.weekStart : ws
  // Roll day and week counters the way a fresh day demands.
  const rolledToday = date === today ? Number(v.today) || 0 : 0
  const rolledWeek = weekStart === ws ? Number(v.week) || 0 : 0
  const stats: StatsV2 = {
    today: rolledToday,
    week: rolledWeek,
    streak: Number(v.streak) || 0,
    minutes: Number(v.minutes) || 0,
    date: today,
    weekStart: ws,
    lastDate: typeof v.lastDate === 'string' ? v.lastDate : null,
    history,
  }

  if (v.goals !== undefined && typeof v.goals === 'object' && v.goals !== null) {
    const goals = isGoalSettings(v.goals)
    if (goals) {
      stats.goals = goals
    }
  }

  if (Array.isArray(v.milestones)) {
    stats.milestones = v.milestones
      .map(isMilestoneRecord)
      .filter((m): m is MilestoneRecord => m !== null)
  }

  return stats
}

function isCustomSounds(value: unknown): CustomSound[] | null {
  if (!Array.isArray(value)) return null
  const sounds: CustomSound[] = []
  for (const x of value) {
    if (typeof x !== 'object' || x === null) continue
    const v = x as Record<string, unknown>
    if (typeof v.id !== 'string' || typeof v.name !== 'string') continue
    sounds.push(typeof v.dataUrl === 'string' ? { id: v.id, name: v.name, dataUrl: v.dataUrl } : { id: v.id, name: v.name })
  }
  return sounds
}

export function isSessionEntry(value: unknown): SessionLogEntryV2 | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const v = value as Record<string, unknown>

  if (typeof v.id !== 'string' || v.id.trim() === '') return null
  const id: string = v.id.trim().slice(0, 64)

  const rawDate: unknown = typeof v.date === 'string' ? v.date : (typeof v.startTime === 'string' ? v.startTime : null)
  if (typeof rawDate !== 'string' || rawDate.trim() === '') return null
  const parsedDate = Date.parse(rawDate.trim())
  if (Number.isNaN(parsedDate)) return null
  const date: string = rawDate.trim()

  let rawMinutes: unknown = v.minutes !== undefined ? v.minutes : v.durationMinutes
  if (typeof rawMinutes === 'string') {
    const parsed = Number(rawMinutes)
    if (!Number.isNaN(parsed)) rawMinutes = parsed
  }
  if (typeof rawMinutes !== 'number' || !Number.isFinite(rawMinutes) || rawMinutes < 0) return null
  const minutes: number = Math.round(rawMinutes)

  const task: string | null =
    typeof v.task === 'string' && v.task.trim() !== '' ? v.task.trim().slice(0, MAX_TASK_LENGTH) : null

  const entry: SessionLogEntryV2 = { id, date, minutes, task }

  if (Array.isArray(v.checklist)) {
    const checklist = isChecklist(v.checklist)
    if (checklist && checklist.length > 0) {
      entry.checklist = checklist
    }
  }

  return entry
}

export { isSessionEntry as sanitizeSessionEntry }

/* ---------- legacy migration (ff_* keys from the vanilla version) ---------- */

function migrateLegacy(): void {
  if (readString(KEYS.migrated) !== null) return
  const legacySettings = read<Settings>(`${LEGACY_PREFIX}settings`, isSettings)
  if (legacySettings) write(KEYS.settings, legacySettings)
  const legacyStats = read<Stats>(`${LEGACY_PREFIX}stats`, isStats)
  if (legacyStats) write(KEYS.stats, legacyStats)
  const legacySounds = read<CustomSound[]>(`${LEGACY_PREFIX}custom_sounds`, isCustomSounds)
  if (legacySounds) write(KEYS.sounds, legacySounds)
  const legacySessions = read<SessionLogEntry[]>(`${LEGACY_PREFIX}sessions`, (value) => {
    if (!Array.isArray(value)) return null
    return value.map(isSessionEntry).filter((e): e is SessionLogEntry => e !== null).slice(0, MAX_SESSIONS)
  })
  if (legacySessions) write(KEYS.sessions, legacySessions)
  const legacyTheme = readString(`${LEGACY_PREFIX}theme`)
  if (legacyTheme === 'dark' || legacyTheme === 'light') write(KEYS.theme, legacyTheme)
  const legacyLang = readString(`${LEGACY_PREFIX}lang`)
  if (legacyLang === 'pl' || legacyLang === 'en') write(KEYS.lang, legacyLang)
  write(KEYS.migrated, new Date().toISOString())
}

/* ---------- public API ---------- */

export function loadSettings(): Settings {
  migrateLegacy()
  return read<Settings>(KEYS.settings, isSettings) ?? { ...DEFAULT_SETTINGS }
}

export function saveSettings(settings: Settings): void {
  write(KEYS.settings, settings)
}

export function loadStats(): StatsV2 {
  migrateLegacy()
  const stats = read<StatsV2>(KEYS.stats, isStats) ?? {
    today: 0,
    week: 0,
    streak: 0,
    minutes: 0,
    date: new Date().toDateString(),
    weekStart: weekStartOf(),
    lastDate: null,
    history: {},
  }
  if (!stats.goals) {
    const goals = read<GoalSettings>(KEYS.goals, isGoalSettings)
    if (goals) stats.goals = goals
  }
  if (!stats.milestones) {
    const milestones = read<MilestoneRecord[]>(KEYS.milestones, isMilestones)
    if (milestones && milestones.length > 0) stats.milestones = milestones
  }
  return stats
}

export function saveStats(stats: StatsV2): void {
  const sanitized = isStats(stats) ?? stats
  write(KEYS.stats, sanitized)
  if (sanitized.goals) {
    write(KEYS.goals, sanitized.goals)
  }
  if (sanitized.milestones) {
    write(KEYS.milestones, sanitized.milestones)
  }
}

export function loadSessions(): SessionLogEntryV2[] {
  migrateLegacy()
  return (
    read<SessionLogEntryV2[]>(KEYS.sessions, (value) => {
      if (!Array.isArray(value)) return null
      return value.map(isSessionEntry).filter((e): e is SessionLogEntryV2 => e !== null).slice(0, MAX_SESSIONS)
    }) ?? []
  )
}

export function saveSessions(sessions: SessionLogEntryV2[]): boolean {
  if (!Array.isArray(sessions)) return false
  const sanitized: SessionLogEntryV2[] = sessions
    .map(isSessionEntry)
    .filter((e): e is SessionLogEntryV2 => e !== null)
    .slice(0, MAX_SESSIONS)
  return write(KEYS.sessions, sanitized)
}

export function addSession(entry: SessionLogEntryV2): SessionLogEntryV2[] {
  const sanitized = isSessionEntry(entry)
  const existing = loadSessions()
  const updated = sanitized ? [sanitized, ...existing].slice(0, MAX_SESSIONS) : existing.slice(0, MAX_SESSIONS)
  saveSessions(updated)
  return updated
}

export function updateSessionTask(id: string, task: string | null): SessionLogEntryV2[] {
  if (typeof id !== 'string' || id.trim() === '') {
    return loadSessions()
  }
  const targetId = id.trim()
  const sanitizedTask: string | null =
    typeof task === 'string' && task.trim() !== '' ? task.trim().slice(0, MAX_TASK_LENGTH) : null

  const sessions = loadSessions()
  let modified = false
  const updated = sessions.map((entry) => {
    if (entry.id === targetId) {
      modified = true
      return {
        ...entry,
        task: sanitizedTask,
      }
    }
    return entry
  })

  if (modified) {
    saveSessions(updated)
  }
  return updated
}

export function deleteSession(id: string): {
  sessions: SessionLogEntryV2[]
  deleted: SessionLogEntryV2 | null
} {
  if (typeof id !== 'string' || id.trim() === '') {
    return { sessions: loadSessions(), deleted: null }
  }
  const targetId = id.trim()
  const sessions = loadSessions()
  const targetIndex = sessions.findIndex((s) => s.id === targetId)

  if (targetIndex === -1) {
    return { sessions, deleted: null }
  }

  const deleted = sessions[targetIndex]
  const updated = sessions.filter((_, idx) => idx !== targetIndex)
  saveSessions(updated)
  addTombstone(targetId)

  return {
    sessions: updated,
    deleted,
  }
}

export const THIRTY_DAYS_MS: number = 30 * 24 * 60 * 60 * 1000

export function isSessionTombstone(value: unknown): SessionTombstone | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const v = value as Record<string, unknown>
  if (typeof v.id !== 'string' || v.id.trim() === '') return null
  if (typeof v.deletedAt !== 'string' || Number.isNaN(Date.parse(v.deletedAt))) return null
  return { id: v.id.trim().slice(0, 64), deletedAt: v.deletedAt }
}

export function loadTombstones(): SessionTombstone[] {
  const list = read<SessionTombstone[]>(KEYS.tombstones, (raw) => {
    if (!Array.isArray(raw)) return null
    return raw
      .map(isSessionTombstone)
      .filter((item): item is SessionTombstone => item !== null)
  })
  return list ?? []
}

export function saveTombstones(tombstones: SessionTombstone[]): void {
  const sanitized = tombstones
    .map(isSessionTombstone)
    .filter((item): item is SessionTombstone => item !== null)
  write(KEYS.tombstones, sanitized)
}

export function addTombstone(id: string, deletedAt: string = new Date().toISOString()): SessionTombstone[] {
  const existing = loadTombstones()
  const now = Date.now()
  const active = existing.filter((t) => {
    const time = Date.parse(t.deletedAt)
    return !Number.isNaN(time) && now - time < THIRTY_DAYS_MS && t.id !== id
  })
  const updated = [{ id, deletedAt }, ...active]
  saveTombstones(updated)
  return updated
}

export function pruneTombstones(now: number = Date.now()): SessionTombstone[] {
  const existing = loadTombstones()
  const active = existing.filter((t) => {
    const time = Date.parse(t.deletedAt)
    return !Number.isNaN(time) && now - time < THIRTY_DAYS_MS
  })
  if (active.length !== existing.length) {
    saveTombstones(active)
  }
  return active
}

export function loadCloudSyncState(): CloudSyncState | null {
  return read<CloudSyncState>(KEYS.cloudSync, (val) => {
    if (typeof val !== 'object' || val === null || Array.isArray(val)) return null
    const v = val as Record<string, unknown>
    if (
      v.status !== 'disconnected' &&
      v.status !== 'idle' &&
      v.status !== 'syncing' &&
      v.status !== 'synced' &&
      v.status !== 'error'
    ) {
      return null
    }
    return {
      status: v.status,
      uid: typeof v.uid === 'string' ? v.uid : null,
      email: typeof v.email === 'string' ? v.email : null,
      displayName: typeof v.displayName === 'string' ? v.displayName : null,
      photoURL: typeof v.photoURL === 'string' ? v.photoURL : null,
      lastSyncedAt: typeof v.lastSyncedAt === 'string' ? v.lastSyncedAt : null,
      error: typeof v.error === 'string' ? v.error : null,
    }
  })
}

export function saveCloudSyncState(state: CloudSyncState | null): void {
  if (state === null) {
    localStorage.removeItem(KEYS.cloudSync)
  } else {
    write(KEYS.cloudSync, state)
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('focus-flow:sync-state', { detail: state }))
  }
}

export function loadLastSyncedUid(): string | null {
  return readString(KEYS.lastSyncedUid)
}

export function saveLastSyncedUid(uid: string | null): void {
  if (uid === null) {
    localStorage.removeItem(KEYS.lastSyncedUid)
  } else {
    localStorage.setItem(KEYS.lastSyncedUid, uid)
  }
}

export function loadGoals(): GoalSettings {
  migrateLegacy()
  const stored = read<GoalSettings>(KEYS.goals, isGoalSettings)
  if (stored) return stored
  const stats = read<StatsV2>(KEYS.stats, isStats)
  if (stats?.goals) return stats.goals
  return { ...DEFAULT_GOAL_SETTINGS }
}

export function saveGoals(goals: GoalSettings): void {
  const sanitized = isGoalSettings(goals) ?? { ...DEFAULT_GOAL_SETTINGS }
  write(KEYS.goals, sanitized)
  const stats = read<StatsV2>(KEYS.stats, isStats)
  if (stats) {
    write(KEYS.stats, { ...stats, goals: sanitized })
  }
}

export function loadMilestones(): MilestoneRecord[] {
  migrateLegacy()
  const stored = read<MilestoneRecord[]>(KEYS.milestones, isMilestones)
  if (stored) return stored
  const stats = read<StatsV2>(KEYS.stats, isStats)
  if (stats?.milestones) return stats.milestones
  return []
}

export function saveMilestones(milestones: MilestoneRecord[]): void {
  const sanitized = isMilestones(milestones) ?? []
  write(KEYS.milestones, sanitized)
  const stats = read<StatsV2>(KEYS.stats, isStats)
  if (stats) {
    write(KEYS.stats, { ...stats, milestones: sanitized })
  }
}

export function loadCustomSounds(): CustomSound[] {
  migrateLegacy()
  return read<CustomSound[]>(KEYS.sounds, isCustomSounds) ?? []
}

export function saveCustomSounds(sounds: CustomSound[]): boolean {
  return write(KEYS.sounds, sounds)
}

export function isTaskPreset(value: unknown): TaskPreset | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const v = value as Record<string, unknown>
  if (typeof v.id !== 'string' || v.id.trim() === '') return null
  const id: string = v.id.trim().slice(0, 64)
  if (typeof v.label !== 'string' || v.label.trim() === '') return null
  const label: string = v.label.trim().slice(0, MAX_TASK_LENGTH)
  return { id, label }
}

export function isTaskPresets(value: unknown): TaskPreset[] | null {
  if (!Array.isArray(value)) return null
  const list: TaskPreset[] = []
  for (const item of value) {
    const preset = isTaskPreset(item)
    if (!preset) return null
    list.push(preset)
  }
  return list.slice(0, 50)
}

export const DEFAULT_TASK_PRESETS: TaskPreset[] = [
  { id: 'deep-work', label: 'Deep Work' },
  { id: 'writing', label: 'Writing' },
  { id: 'code-review', label: 'Code Review' },
  { id: 'reading', label: 'Reading' },
  { id: 'inbox-zero', label: 'Inbox Zero' },
]

export function loadPresets(): TaskPreset[] {
  migrateLegacy()
  const stored = read<TaskPreset[]>(KEYS.presets, (val) => {
    if (!Array.isArray(val)) return null
    return val.map(isTaskPreset).filter((p): p is TaskPreset => p !== null).slice(0, 50)
  })
  if (stored && stored.length > 0) return stored
  const lang = loadLang()
  if (lang === 'pl') {
    return [
      { id: 'deep-work', label: 'Głęboka praca' },
      { id: 'writing', label: 'Pisanie' },
      { id: 'code-review', label: 'Przegląd kodu' },
      { id: 'reading', label: 'Czytanie' },
      { id: 'inbox-zero', label: 'Inbox Zero' },
    ]
  }
  return [...DEFAULT_TASK_PRESETS]
}

export function savePresets(presets: TaskPreset[]): boolean {
  if (!Array.isArray(presets)) return false
  const sanitized: TaskPreset[] = presets
    .map(isTaskPreset)
    .filter((p): p is TaskPreset => p !== null)
    .slice(0, 50)
  return write(KEYS.presets, sanitized)
}


export function loadLang(): Lang | null {
  migrateLegacy()
  const stored = read<Lang>(KEYS.lang, (v) => (v === 'pl' || v === 'en' ? v : null))
  if (stored) return stored
  const raw = readString(KEYS.lang)
  return raw === 'en' ? 'en' : raw === 'pl' ? 'pl' : null
}

export function saveLang(lang: Lang): void {
  write(KEYS.lang, lang)
}

export function loadTheme(): Theme | null {
  migrateLegacy()
  return read<Theme>(
    KEYS.theme,
    (v) => (v === 'dark' || v === 'light' || v === 'obsidian' || v === 'sage' || v === 'eink' ? v : null),
  )
}

export function saveTheme(theme: Theme): void {
  write(KEYS.theme, theme)
}

export const DEFAULT_VOLUME: number = 0.7

export function loadVolume(): number {
  const stored = read<number>(KEYS.volume, (v) => (typeof v === 'number' && v >= 0 && v <= 1 ? v : null))
  return stored ?? DEFAULT_VOLUME
}

export function saveVolume(volume: number): void {
  write(KEYS.volume, volume)
}

export { DEFAULT_SOUND_PREFERENCES }
export const DEFAULT_TONE_WARMTH: number = 800
export const MIN_TONE_WARMTH: number = 200
export const MAX_TONE_WARMTH: number = 1200

const VALID_BUILTIN_TEXTURES = new Set<string>(['none', 'brown', 'pink', 'rain', 'waves'])
const VALID_BINAURAL_MODES = new Set<string>(['off', 'alpha', 'theta'])

export function isSoundPreferences(value: unknown): SoundPreferences | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const v = value as Record<string, unknown>

  // Base Texture validation & fallback
  let baseTexture: BaseSoundTexture = DEFAULT_SOUND_PREFERENCES.baseTexture
  const rawTexture = v.baseTexture ?? v.texture
  if (typeof rawTexture === 'string') {
    const trimmed = rawTexture.trim()
    if (VALID_BUILTIN_TEXTURES.has(trimmed)) {
      baseTexture = trimmed as BaseSoundTexture
    } else if (trimmed === 'noise') {
      baseTexture = 'brown'
    } else if (trimmed.startsWith('custom:')) {
      const customId = trimmed.slice(7).trim()
      if (customId.length > 0 && customId.length <= 64) {
        baseTexture = `custom:${customId}`
      } else {
        baseTexture = 'brown'
      }
    } else {
      baseTexture = 'none'
    }
  }

  // Binaural Mode validation
  let binauralMode: BinauralMode = DEFAULT_SOUND_PREFERENCES.binauralMode
  const rawBinaural = v.binauralMode ?? v.binaural
  if (typeof rawBinaural === 'string') {
    const trimmed = rawBinaural.trim()
    if (VALID_BINAURAL_MODES.has(trimmed)) {
      binauralMode = trimmed as BinauralMode
    } else if (trimmed === 'none') {
      binauralMode = 'off'
    }
  }

  // Tone Warmth Cutoff (200 - 1200 Hz)
  let toneWarmthCutoff = DEFAULT_TONE_WARMTH
  const rawWarmth = v.toneWarmthCutoff ?? v.toneWarmth
  if (typeof rawWarmth === 'number' && Number.isFinite(rawWarmth)) {
    toneWarmthCutoff = Math.min(MAX_TONE_WARMTH, Math.max(MIN_TONE_WARMTH, Math.round(rawWarmth)))
  }

  // Volume (0.0 - 1.0)
  let volume = DEFAULT_VOLUME
  if (typeof v.volume === 'number' && Number.isFinite(v.volume)) {
    volume = Math.min(1, Math.max(0, Math.round(v.volume * 100) / 100))
  }

  // Clean object stripping prototype pollution
  return {
    baseTexture,
    binauralMode,
    toneWarmthCutoff,
    volume,
  }
}

export function loadSoundPreferences(): SoundPreferences {
  migrateLegacy()
  const stored = read<SoundPreferences>(KEYS.soundPrefs, isSoundPreferences)
  if (stored) return stored
  const legacyVol = loadVolume()
  return {
    ...DEFAULT_SOUND_PREFERENCES,
    volume: legacyVol,
  }
}

export function saveSoundPreferences(prefs: SoundPreferences): boolean {
  const sanitized = isSoundPreferences(prefs)
  if (!sanitized) return false
  const ok = write(KEYS.soundPrefs, sanitized)
  if (ok) {
    saveVolume(sanitized.volume)
  }
  return ok
}

export const isSoundPrefs: (value: unknown) => SoundPreferences | null = isSoundPreferences
export const loadSoundPrefs: () => SoundPreferences = loadSoundPreferences
export const saveSoundPrefs: (prefs: SoundPreferences) => boolean = saveSoundPreferences

export const DEFAULT_INTERFACE: InterfacePrefs = {
  reduceMotion: false,
  showGreeting: true,
  shortcuts: { ...DEFAULT_SHORTCUTS },
  narration: { ...DEFAULT_NARRATION },
  maskTaskTitlesInCloud: false,
}

export function isShortcutKeymap(val: unknown): ShortcutKeymap | null {
  if (typeof val !== 'object' || val === null || Array.isArray(val)) return null
  const v = val as Record<string, unknown>
  if (typeof v.toggleTimer !== 'string' || !v.toggleTimer) return null
  if (typeof v.resetTimer !== 'string' || !v.resetTimer) return null
  if (typeof v.toggleFullscreen !== 'string' || !v.toggleFullscreen) return null
  if (typeof v.openSettings !== 'string' || !v.openSettings) return null
  return {
    toggleTimer: v.toggleTimer,
    resetTimer: v.resetTimer,
    toggleFullscreen: v.toggleFullscreen,
    openSettings: v.openSettings,
  }
}

export function isNarrationSettings(val: unknown): NarrationSettings | null {
  if (typeof val !== 'object' || val === null || Array.isArray(val)) return null
  const v = val as Record<string, unknown>
  const verbosity = v.verbosity
  if (verbosity !== 'minimal' && verbosity !== 'standard' && verbosity !== 'detailed') return null
  return {
    verbosity,
    voiceAlertsEnabled: v.voiceAlertsEnabled === true,
  }
}

export function isInterface(value: unknown): InterfacePrefs | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const v = value as Record<string, unknown>
  const res: InterfacePrefs = {
    reduceMotion: v.reduceMotion === true,
    showGreeting: v.showGreeting !== false,
  }
  if (v.shortcuts !== undefined) {
    const shortcuts = isShortcutKeymap(v.shortcuts)
    if (shortcuts) res.shortcuts = shortcuts
  }
  if (v.narration !== undefined) {
    const narration = isNarrationSettings(v.narration)
    if (narration) res.narration = narration
  }
  if (v.maskTaskTitlesInCloud !== undefined) {
    res.maskTaskTitlesInCloud = v.maskTaskTitlesInCloud === true
  }
  return res
}

export function loadInterface(): InterfacePrefs {
  return read<InterfacePrefs>(KEYS.interface, isInterface) ?? { ...DEFAULT_INTERFACE }
}

export function saveInterface(prefs: InterfacePrefs): boolean {
  return write(KEYS.interface, prefs)
}

export function loadOnboardingDone(): boolean {
  return read<boolean>(KEYS.onboardingDone, (v) => v === true) === true
}

export function saveOnboardingDone(): void {
  write(KEYS.onboardingDone, true)
}

export function loadInstallDismissed(): boolean {
  return read<boolean>(KEYS.installDismissed, (v) => v === true) === true
}

export function saveInstallDismissed(): void {
  write(KEYS.installDismissed, true)
}

export function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Detects default user language from device/browser settings.
 * Defaults to 'pl' if browser locale begins with Polish ('pl'), otherwise 'en' for global users.
 */
export function systemLang(): Lang {
  if (typeof navigator === 'undefined') return 'en'
  const nav = navigator as Navigator & { userLanguage?: string }
  const navLang = (nav.language || nav.userLanguage || '').toLowerCase()
  return navLang.startsWith('pl') ? 'pl' : 'en'
}

const SESSION_KEY = `${PREFIX}session`

function isSnapshot(value: unknown): SessionSnapshotV2 | null {
  if (typeof value !== 'object' || value === null) return null
  const v = value as Record<string, unknown>
  if (v.mode !== 'focus' && v.mode !== 'short' && v.mode !== 'long') return null
  const snapshot: SessionSnapshotV2 = {
    mode: v.mode,
    round: Number(v.round) || 0,
    running: v.running === true,
    endTs: typeof v.endTs === 'number' && Number.isFinite(v.endTs) ? v.endTs : null,
    remainingMs: typeof v.remainingMs === 'number' && Number.isFinite(v.remainingMs) ? Math.max(0, v.remainingMs) : 0,
    task: typeof v.task === 'string' ? v.task.slice(0, 200) : '',
    taskDone: v.taskDone === true,
  }
  if (Array.isArray(v.checklist)) {
    const items = isChecklist(v.checklist)
    if (items && items.length > 0) {
      snapshot.checklist = items
    }
  }
  return snapshot
}

export function loadSession(): SessionSnapshotV2 | null {
  return read<SessionSnapshotV2>(SESSION_KEY, isSnapshot)
}

export function saveSession(snapshot: SessionSnapshotV2): void {
  write(SESSION_KEY, snapshot)
}

export const DEFAULT_WEBHOOK_SETTINGS: WebhookSettings = {
  url: '',
  enabled: false,
}

export function isWebhookSettings(val: unknown): val is WebhookSettings {
  if (typeof val !== 'object' || val === null || Array.isArray(val)) return false
  const v = val as Record<string, unknown>
  return typeof v.url === 'string' && typeof v.enabled === 'boolean'
}

export function loadWebhookSettings(): WebhookSettings {
  migrateLegacy()
  const stored = read<WebhookSettings>(KEYS.webhook, (val) => {
    if (!isWebhookSettings(val)) return null
    return {
      url: val.url.trim().slice(0, 2048),
      enabled: val.enabled === true,
    }
  })
  return stored ?? { ...DEFAULT_WEBHOOK_SETTINGS }
}

export function saveWebhookSettings(settings: WebhookSettings): void {
  if (isWebhookSettings(settings)) {
    write(KEYS.webhook, {
      url: settings.url.trim().slice(0, 2048),
      enabled: settings.enabled === true,
    })
  } else {
    write(KEYS.webhook, { ...DEFAULT_WEBHOOK_SETTINGS })
  }
}
