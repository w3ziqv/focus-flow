import type {
  GoalSettings,
  InterfacePrefs,
  Lang,
  MilestoneRecord,
  SessionLogEntryV2,
  Settings,
  SoundPreferences,
  StatsV2,
  TaskPreset,
  Theme,
  WebhookSettings,
} from '../types'
import {
  addSession,
  loadGoals,
  loadInstallDismissed,
  loadInterface,
  loadLang,
  loadMilestones,
  loadOnboardingDone,
  loadPresets,
  loadSessions,
  loadSettings,
  loadSoundPreferences,
  loadStats,
  loadTheme,
  loadVolume,
  loadWebhookSettings,
  saveGoals,
  saveInstallDismissed,
  saveInterface,
  saveLang,
  saveMilestones,
  saveOnboardingDone,
  savePresets,
  saveSettings,
  saveSoundPreferences,
  saveStats,
  saveTheme,
  saveVolume,
  saveWebhookSettings,
  updateSessionTask as storageUpdateSessionTask,
} from './storage'
import { deleteSessionWithStats, evaluateMilestones, recordFocusSession } from './stats'

export interface RecordSessionResult {
  session: SessionLogEntryV2
  stats: StatsV2
  goalReached: boolean
  milestones: MilestoneRecord[]
}

export interface UserPreferences {
  lang: Lang
  theme: Theme
  volume: number
  sound: SoundPreferences
  interface: InterfacePrefs
  webhook: WebhookSettings
  goals: GoalSettings
}

/**
 * Unified Focus Flow State & Domain Store (Deep Repository Seam).
 *
 * Encapsulates multi-entity storage coordination, atomic stat tracking,
 * goal threshold detection, and milestone evaluation behind a cohesive, high-leverage interface.
 */
export class FocusStore {
  // --- Sessions & Atomic Domain Invariants ---

  public static getSessions(): SessionLogEntryV2[] {
    return loadSessions()
  }

  /**
   * Atomically records a completed focus session:
   * 1. Appends session to log with sanitized fields.
   * 2. Increments aggregate statistics and daily history.
   * 3. Checks if the session crossed the daily target goal threshold.
   * 4. Evaluates Zen milestone seals idempotently.
   */
  public static recordSession(entry: {
    id?: string
    date?: string
    minutes: number
    task?: string | null
    checklist?: SessionLogEntryV2['checklist']
  }): RecordSessionResult {
    const sessionId = entry.id || `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
    const date = entry.date || new Date().toISOString()
    const minutes = Math.max(1, Math.round(entry.minutes))
    const task = entry.task?.trim() ? entry.task.trim() : null

    const sessionRecord: SessionLogEntryV2 = {
      id: sessionId,
      date,
      minutes,
      task,
      checklist: entry.checklist && entry.checklist.length > 0 ? [...entry.checklist] : undefined,
    }

    addSession(sessionRecord)

    const currentStats = loadStats()
    const todayKey = new Date().toDateString()
    const prevTodayMinutes = currentStats.history[todayKey] ?? 0

    const updatedStats = recordFocusSession(currentStats, minutes)

    // Check goal threshold crossing
    const goals = loadGoals()
    const newTodayMinutes = updatedStats.history[todayKey] ?? 0
    const goalReached =
      goals.enabled &&
      goals.dailyTargetMinutes > 0 &&
      prevTodayMinutes < goals.dailyTargetMinutes &&
      newTodayMinutes >= goals.dailyTargetMinutes

    // Evaluate Zen milestones
    const existingMilestones = loadMilestones()
    const allSessions = loadSessions()
    const updatedMilestones = evaluateMilestones(existingMilestones, updatedStats, allSessions)
    saveMilestones(updatedMilestones)

    return {
      session: sessionRecord,
      stats: updatedStats,
      goalReached,
      milestones: updatedMilestones,
    }
  }

  /**
   * Atomically deletes a session record and adjusts aggregate statistics in a single transaction.
   */
  public static deleteSession(sessionId: string): {
    sessions: SessionLogEntryV2[]
    stats: StatsV2
    deleted: SessionLogEntryV2 | null
  } {
    return deleteSessionWithStats(sessionId)
  }

  public static updateSessionTask(id: string, task: string | null): SessionLogEntryV2[] {
    return storageUpdateSessionTask(id, task)
  }

  // --- Stats & Milestones ---

  public static getStats(): StatsV2 {
    return loadStats()
  }

  public static updateStats(patch: Partial<StatsV2>): StatsV2 {
    const current = loadStats()
    const updated = { ...current, ...patch }
    saveStats(updated)
    return updated
  }

  public static getMilestones(): MilestoneRecord[] {
    return loadMilestones()
  }

  // --- Settings ---

  public static getSettings(): Settings {
    return loadSettings()
  }

  public static updateSettings(patch: Partial<Settings>): Settings {
    const current = loadSettings()
    const updated = { ...current, ...patch }
    saveSettings(updated)
    return updated
  }

  // --- Task Presets ---

  public static getPresets(): TaskPreset[] {
    return loadPresets()
  }

  public static savePresets(presets: TaskPreset[]): void {
    savePresets(presets)
  }

  // --- User Preferences Bundle ---

  public static getPreferences(): UserPreferences {
    return {
      lang: loadLang() ?? 'en',
      theme: loadTheme() ?? 'light',
      volume: loadVolume(),
      sound: loadSoundPreferences(),
      interface: loadInterface(),
      webhook: loadWebhookSettings(),
      goals: loadGoals(),
    }
  }

  public static updatePreferences(patch: Partial<UserPreferences>): UserPreferences {
    if (patch.lang !== undefined) saveLang(patch.lang)
    if (patch.theme !== undefined) saveTheme(patch.theme)
    if (patch.volume !== undefined) saveVolume(patch.volume)
    if (patch.sound !== undefined) saveSoundPreferences(patch.sound)
    if (patch.interface !== undefined) saveInterface(patch.interface)
    if (patch.webhook !== undefined) saveWebhookSettings(patch.webhook)
    if (patch.goals !== undefined) saveGoals(patch.goals)
    return this.getPreferences()
  }

  // --- Onboarding & Install Flags ---

  public static isOnboardingDone(): boolean {
    return loadOnboardingDone()
  }

  public static setOnboardingDone(): void {
    saveOnboardingDone()
  }

  public static isInstallDismissed(): boolean {
    return loadInstallDismissed()
  }

  public static setInstallDismissed(): void {
    saveInstallDismissed()
  }
}
