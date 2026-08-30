import type { LucideIcon } from 'lucide-react'

export type Mode = 'focus' | 'short' | 'long'
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
  dataUrl: string
}

export type TopicId = 'learning' | 'break' | 'sleep' | 'food' | 'productivity' | 'wellbeing' | 'mindfulness'

export interface SessionLogEntry {
  id: string
  /** ISO timestamp of completion */
  date: string
  minutes: number
  task: string | null
}

export type AmbientSound =
  | 'none'
  | 'rain'
  | 'waves'
  | 'stream'
  | 'campfire'
  | 'noise'
  | `custom:${string}`

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
