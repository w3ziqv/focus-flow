import type { CustomSound, InterfacePrefs, Lang, SessionLogEntry, SessionSnapshot, Settings, Stats, Theme } from '../types'

export const MAX_SOUND_SIZE: number = 200 * 1024 * 1024
export const MAX_SESSIONS: number = 1000

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
  interface: `${PREFIX}interface`,
  migrated: `${PREFIX}migrated`,
  onboardingDone: `${PREFIX}onboardingDone`,
  installDismissed: `${PREFIX}installDismissed`,
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

function isSettings(value: unknown): Settings | null {
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

function isStats(value: unknown): Stats | null {
  if (typeof value !== 'object' || value === null) return null
  const v = value as Record<string, unknown>
  const history: Record<string, number> = {}
  if (typeof v.history === 'object' && v.history !== null) {
    for (const [k, n] of Object.entries(v.history as Record<string, unknown>)) {
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
  return {
    today: rolledToday,
    week: rolledWeek,
    streak: Number(v.streak) || 0,
    minutes: Number(v.minutes) || 0,
    date: today,
    weekStart: ws,
    lastDate: typeof v.lastDate === 'string' ? v.lastDate : null,
    history,
  }
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

export function isSessionEntry(value: unknown): SessionLogEntry | null {
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

  const task: string | null = typeof v.task === 'string' && v.task.trim() !== '' ? v.task.trim().slice(0, 200) : null

  return { id, date, minutes, task }
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

export function loadStats(): Stats {
  migrateLegacy()
  return read<Stats>(KEYS.stats, isStats) ?? {
    today: 0,
    week: 0,
    streak: 0,
    minutes: 0,
    date: new Date().toDateString(),
    weekStart: weekStartOf(),
    lastDate: null,
    history: {},
  }
}

export function saveStats(stats: Stats): void {
  write(KEYS.stats, stats)
}

export function loadSessions(): SessionLogEntry[] {
  migrateLegacy()
  return (
    read<SessionLogEntry[]>(KEYS.sessions, (value) => {
      if (!Array.isArray(value)) return null
      return value.map(isSessionEntry).filter((e): e is SessionLogEntry => e !== null).slice(0, MAX_SESSIONS)
    }) ?? []
  )
}

export function saveSessions(sessions: SessionLogEntry[]): boolean {
  if (!Array.isArray(sessions)) return false
  const sanitized: SessionLogEntry[] = sessions
    .map(isSessionEntry)
    .filter((e): e is SessionLogEntry => e !== null)
    .slice(0, MAX_SESSIONS)
  return write(KEYS.sessions, sanitized)
}

export function addSession(entry: SessionLogEntry): SessionLogEntry[] {
  const sanitized = isSessionEntry(entry)
  const existing = loadSessions()
  const updated = sanitized ? [sanitized, ...existing].slice(0, MAX_SESSIONS) : existing.slice(0, MAX_SESSIONS)
  saveSessions(updated)
  return updated
}

export function loadCustomSounds(): CustomSound[] {
  migrateLegacy()
  return read<CustomSound[]>(KEYS.sounds, isCustomSounds) ?? []
}

export function saveCustomSounds(sounds: CustomSound[]): boolean {
  return write(KEYS.sounds, sounds)
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
  return read<Theme>(KEYS.theme, (v) => (v === 'dark' || v === 'light' ? v : null))
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

export const DEFAULT_INTERFACE: InterfacePrefs = { reduceMotion: false, showGreeting: true }

function isInterface(value: unknown): InterfacePrefs | null {
  if (typeof value !== 'object' || value === null) return null
  const v = value as Record<string, unknown>
  return {
    reduceMotion: v.reduceMotion === true,
    showGreeting: v.showGreeting !== false,
  }
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

const SESSION_KEY = `${PREFIX}session`

function isSnapshot(value: unknown): SessionSnapshot | null {
  if (typeof value !== 'object' || value === null) return null
  const v = value as Record<string, unknown>
  if (v.mode !== 'focus' && v.mode !== 'short' && v.mode !== 'long') return null
  return {
    mode: v.mode,
    round: Number(v.round) || 0,
    running: v.running === true,
    endTs: typeof v.endTs === 'number' && Number.isFinite(v.endTs) ? v.endTs : null,
    remainingMs: typeof v.remainingMs === 'number' && Number.isFinite(v.remainingMs) ? Math.max(0, v.remainingMs) : 0,
    task: typeof v.task === 'string' ? v.task.slice(0, 200) : '',
    taskDone: v.taskDone === true,
  }
}

export function loadSession(): SessionSnapshot | null {
  return read<SessionSnapshot>(SESSION_KEY, isSnapshot)
}

export function saveSession(snapshot: SessionSnapshot): void {
  write(SESSION_KEY, snapshot)
}
