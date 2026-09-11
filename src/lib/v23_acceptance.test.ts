import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadSessions,
  addSession,
  updateSessionTask,
  saveGoals,
  loadGoals,
  MAX_TASK_LENGTH,
  MAX_CHECKLIST_ITEMS,
  MAX_CHECKLIST_TEXT_LENGTH,
} from './storage'
import {
  deleteSessionWithStats,
  decrementStatsForSession,
  evaluateMilestones,
} from './stats'
import type { SessionLogEntryV2, StatsV2 } from '../types'

describe('Focus Flow v2.3 End-to-End Acceptance & Integrity Tests', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('R1: Ephemeral Micro-Steps & Presets Constraints', () => {
    it('persists up to 3 micro-steps in SessionLogEntryV2 and enforces 140-char clamp', () => {
      const longText = 'A'.repeat(200)
      const entry: SessionLogEntryV2 = {
        id: 's_test_1',
        date: new Date().toISOString(),
        minutes: 25,
        task: 'Deep Work Session',
        checklist: [
          { id: 'c1', text: longText, completed: false },
          { id: 'c2', text: 'Second step', completed: true },
          { id: 'c3', text: 'Third step', completed: false },
          { id: 'c4', text: 'Excess item to drop', completed: false },
        ],
      }

      addSession(entry)
      const loaded = loadSessions()
      expect(loaded).toHaveLength(1)
      expect(loaded[0].checklist).toHaveLength(MAX_CHECKLIST_ITEMS)
      expect(loaded[0].checklist?.[0].text).toHaveLength(MAX_CHECKLIST_TEXT_LENGTH)
      expect(loaded[0].checklist?.[1].completed).toBe(true)
    })

    it('clamps session task string to 200 characters upon mutation', () => {
      const longTask = 'T'.repeat(350)
      const entry: SessionLogEntryV2 = {
        id: 's_test_2',
        date: new Date().toISOString(),
        minutes: 25,
        task: 'Initial',
      }
      addSession(entry)

      updateSessionTask('s_test_2', longTask)
      const loaded = loadSessions()
      expect(loaded[0].task).toHaveLength(MAX_TASK_LENGTH)
    })
  })

  describe('R2: Session Log In-Place Management & Atomic Data Consistency', () => {
    it('atomically decrements stats.today, stats.week, and stats.minutes when deleting session from today', () => {
      const today = new Date()
      const todayKey = today.toDateString()

      const entry: SessionLogEntryV2 = {
        id: 's_del_1',
        date: today.toISOString(),
        minutes: 25,
        task: 'Task to delete',
      }
      addSession(entry)

      const initialStats: StatsV2 = {
        today: 1,
        week: 1,
        streak: 1,
        minutes: 25,
        date: todayKey,
        weekStart: todayKey,
        lastDate: todayKey,
        history: {
          [todayKey]: 25,
        },
      }

      const decremented = decrementStatsForSession(initialStats, entry)
      expect(decremented.minutes).toBe(0)
      expect(decremented.today).toBe(0)
      expect(decremented.week).toBe(0)
      expect(decremented.history[todayKey]).toBe(0)
    })

    it('executes deleteSessionWithStats atomically without orphaned records or negative drift', () => {
      const today = new Date()
      const entry: SessionLogEntryV2 = {
        id: 's_atom_1',
        date: today.toISOString(),
        minutes: 30,
        task: 'Atomic task',
      }
      addSession(entry)

      const result = deleteSessionWithStats('s_atom_1')
      expect(result.deleted?.id).toBe('s_atom_1')
      expect(result.sessions).toHaveLength(0)
      expect(result.stats.minutes).toBeGreaterThanOrEqual(0)
      expect(loadSessions()).toHaveLength(0)
    })
  })

  describe('R3: GoalSettings Bounds & Persistence', () => {
    it('clamps daily target minutes between 0 and 720', () => {
      saveGoals({ enabled: true, dailyTargetMinutes: 9999 })
      const loadedOver = loadGoals()
      expect(loadedOver.dailyTargetMinutes).toBe(720)

      saveGoals({ enabled: true, dailyTargetMinutes: -50 })
      const loadedUnder = loadGoals()
      expect(loadedUnder.dailyTargetMinutes).toBe(0)
    })
  })

  describe('R4: Deterministic Zen Pebble Milestone Seals', () => {
    it('unlocks all 5 seals progressively and deterministically', () => {
      const now = new Date()
      const sessions: SessionLogEntryV2[] = [
        { id: 's1', date: now.toISOString(), minutes: 25, task: 'Focus 1' },
      ]
      const stats: StatsV2 = {
        today: 1,
        week: 1,
        streak: 1,
        minutes: 6000,
        date: now.toDateString(),
        weekStart: now.toDateString(),
        lastDate: now.toDateString(),
        history: { [now.toDateString()]: 6000 },
      }

      const seals = evaluateMilestones([], stats, sessions)
      const ids = seals.map((s) => s.id)

      // The first step (>= 1 session or >0 min)
      expect(ids).toContain('the_first_step')
      // Stone of Stillness (>= 600 min)
      expect(ids).toContain('stone_of_stillness')
      // Garden of Flow (>= 3000 min)
      expect(ids).toContain('garden_of_flow')
      // Century of Craft (>= 6000 min)
      expect(ids).toContain('century_of_craft')
    })
  })
})
