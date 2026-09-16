import type { LucideIcon } from 'lucide-react'

export type Mode = 'focus' | 'short' | 'long'
export type TimerMode = Mode
export type Lang = 'pl' | 'en'
export type Theme = 'light' | 'dark'

export interface Settings {
  focus: number
  short: number
  long: number
  rounds: number
  autoStart: boolean
}

export interface Stats {
  today: number
  week: number
  streak: number
  minutes: number
  date: string
  weekStart: string
  lastDate: string | null
  history: Record<string, number>
}

export interface InterfacePrefs {
  reduceMotion: boolean
  showGreeting: boolean
}

export interface CustomSound {
  id: string
  name: string
  /** Legacy fallback: inline data: URL kept only when the IndexedDB migration failed. */
  dataUrl?: string
}

/** A custom sound with a playable URL for this session (object URL or legacy data: URL). */
export interface PlayableSound extends CustomSound {
  url: string
}

export type TopicId = 'learning' | 'break' | 'sleep' | 'food' | 'productivity' | 'wellbeing' | 'mindfulness'

export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

export interface TaskPreset {
  id: string
  label: string
}

export interface SessionLogEntryV2 {
  id: string
  /** ISO timestamp of completion */
  date: string
  minutes: number
  task: string | null
  checklist?: ChecklistItem[]
}

export type SessionLogEntry = SessionLogEntryV2

export interface GoalSettings {
  dailyTargetMinutes: number
  enabled: boolean
}

export interface MilestoneRecord {
  id: string
  unlockedAt: string
  seen: boolean
}

export interface StatsV2 extends Stats {
  goals?: GoalSettings
  milestones?: MilestoneRecord[]
}

export type BaseSoundTexture =
  | 'none'
  | 'brown'
  | 'pink'
  | 'rain'
  | 'waves'
  | `custom:${string}`

export type BinauralMode = 'off' | 'alpha' | 'theta'

export interface SoundPreferences {
  baseTexture: BaseSoundTexture
  binauralMode: BinauralMode
  toneWarmthCutoff: number // 200 to 1200 Hz
  volume: number // 0.0 to 1.0
}

export const DEFAULT_SOUND_PREFERENCES: SoundPreferences = {
  baseTexture: 'none',
  binauralMode: 'off',
  toneWarmthCutoff: 800,
  volume: 0.7,
}

export type AmbientSound =
  | BaseSoundTexture
  | 'stream'
  | 'campfire'
  | 'noise'

export interface Tip {
  title: string
  desc: string
  source: string
}

export interface TipCategory {
  id: string
  icon: LucideIcon
  titlePl: string
  titleEn: string
  tips: { pl: Tip; en: Tip }[]
}

/** Snapshot of a possibly-running timer, persisted so a reload keeps the countdown. */
export interface SessionSnapshot {
  mode: Mode
  round: number
  running: boolean
  endTs: number | null
  remainingMs: number
  task: string
  taskDone: boolean
}

export interface SessionSnapshotV2 extends SessionSnapshot {
  id?: string
  checklist?: ChecklistItem[]
}

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

export interface BackupFileV2 {
  app: 'focus-flow'
  version: 2
  exportedAt: string
  data: {
    settings: Settings
    stats: StatsV2
    sessions: SessionLogEntryV2[]
    presets: TaskPreset[]
    sounds: BackupSound[]
    lang: Lang
    theme: Theme
    volume: number
    interface: InterfacePrefs
  }
}

export type BackupFileAny = BackupFile | BackupFileV2

export interface ImportSuccess {
  success: true
  count: number
}

export interface ImportError {
  success: false
  error: string
}

export type ImportResult = ImportSuccess | ImportError

export type WebhookEvent = 'start' | 'complete' | 'pause'

export interface WebhookSettings {
  url: string
  enabled: boolean
}

export interface WebhookPayload {
  event: WebhookEvent
  timestamp: string
  app: 'focus-flow'
  version: '2.4'
  session: {
    id: string
    mode: TimerMode
    durationMinutes: number
    task: string | null
    checklist?: ChecklistItem[]
  }
}
