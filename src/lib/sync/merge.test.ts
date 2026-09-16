import { describe, expect, it } from 'vitest'
import type { ChecklistItem, SessionLogEntryV2 } from '../../types'
import {
  MAX_CHECKLIST_ID_LENGTH,
  MAX_CHECKLIST_ITEMS,
  MAX_CHECKLIST_TEXT_LENGTH,
  MAX_SESSIONS,
  MAX_TASK_LENGTH,
} from '../storage'
import {
  mergeChecklists,
  mergeSessions,
  reconcileSessionConflict,
  sanitizeChecklistItem,
} from './merge'

/**
 * Factory helper for creating valid SessionLogEntryV2 objects for test scenarios.
 */
function makeSession(overrides: Partial<SessionLogEntryV2> = {}): SessionLogEntryV2 {
  return {
    id: overrides.id ?? 'sess-1',
    date: overrides.date ?? '2026-09-11T10:00:00.000Z',
    minutes: overrides.minutes ?? 25,
    task: overrides.task !== undefined ? overrides.task : 'Deep Work',
    ...(overrides.checklist ? { checklist: overrides.checklist } : {}),
  }
}

/**
 * Helper to generate ISO timestamp relative to a base date.
 */
function makeIsoDate(offsetHours: number, baseDate = '2026-09-11T12:00:00.000Z'): string {
  const d = new Date(baseDate)
  d.setHours(d.getHours() + offsetHours)
  return d.toISOString()
}

describe('Deterministic Merge Engine (src/lib/sync/merge.ts)', () => {
  describe('1. First-Login Reconciliation & Data Loss Prevention (ADR-009 / R3)', () => {
    it('preserves 100% of local sessions when remote is an empty array', () => {
      const local: SessionLogEntryV2[] = [
        makeSession({ id: 'loc-1', date: makeIsoDate(-2), minutes: 25, task: 'Local Task 1' }),
        makeSession({ id: 'loc-2', date: makeIsoDate(-1), minutes: 50, task: 'Local Task 2' }),
      ]
      const remote: SessionLogEntryV2[] = []

      const result = mergeSessions(local, remote)

      expect(result).toHaveLength(2)
      expect(result.map((s) => s.id)).toEqual(['loc-2', 'loc-1'])
      expect(result).toEqual([local[1], local[0]])
    })

    it('preserves 100% of local sessions when remote is null or undefined', () => {
      const local: SessionLogEntryV2[] = [
        makeSession({ id: 'loc-1', date: makeIsoDate(-1), minutes: 25, task: 'Local Task 1' }),
      ]

      const withNull = mergeSessions(local, null)
      expect(withNull).toHaveLength(1)
      expect(withNull[0]).toEqual(local[0])

      const withUndefined = mergeSessions(local, undefined)
      expect(withUndefined).toHaveLength(1)
      expect(withUndefined[0]).toEqual(local[0])
    })

    it('adopts 100% of remote sessions when local is an empty array (fresh device login)', () => {
      const local: SessionLogEntryV2[] = []
      const remote: SessionLogEntryV2[] = [
        makeSession({ id: 'rem-1', date: makeIsoDate(-3), minutes: 30, task: 'Remote Task 1' }),
        makeSession({ id: 'rem-2', date: makeIsoDate(-1), minutes: 45, task: 'Remote Task 2' }),
      ]

      const result = mergeSessions(local, remote)

      expect(result).toHaveLength(2)
      expect(result.map((s) => s.id)).toEqual(['rem-2', 'rem-1'])
      expect(result[0]).toEqual(remote[1])
      expect(result[1]).toEqual(remote[0])
    })

    it('adopts 100% of remote sessions when local is null or undefined', () => {
      const remote: SessionLogEntryV2[] = [
        makeSession({ id: 'rem-1', date: makeIsoDate(-1), minutes: 30 }),
      ]

      const withNull = mergeSessions(null, remote)
      expect(withNull).toHaveLength(1)
      expect(withNull[0]).toEqual(remote[0])

      const withUndefined = mergeSessions(undefined, remote)
      expect(withUndefined).toHaveLength(1)
      expect(withUndefined[0]).toEqual(remote[0])
    })

    it('returns empty array when both local and remote are empty, null, or undefined', () => {
      expect(mergeSessions([], [])).toEqual([])
      expect(mergeSessions(null, null)).toEqual([])
      expect(mergeSessions(undefined, undefined)).toEqual([])
      expect(mergeSessions(null, [])).toEqual([])
      expect(mergeSessions([], undefined)).toEqual([])
    })

    it('handles single-item inputs symmetrically without mutation', () => {
      const item = makeSession({ id: 's1', date: makeIsoDate(0) })
      const originalCopy = { ...item }

      const resA = mergeSessions([item], [])
      const resB = mergeSessions([], [item])

      expect(resA).toEqual([originalCopy])
      expect(resB).toEqual([originalCopy])
      expect(item).toEqual(originalCopy)
    })
  })

  describe('2. Algebraic Invariants (CRDT Properties)', () => {
    it('satisfies Commutativity: mergeSessions(A, B) deep-equals mergeSessions(B, A)', () => {
      const setA: SessionLogEntryV2[] = [
        makeSession({ id: 's1', date: makeIsoDate(-5), minutes: 25, task: 'Writing' }),
        makeSession({ id: 's2', date: makeIsoDate(-3), minutes: 50, task: 'Code Review' }),
        makeSession({
          id: 's3',
          date: makeIsoDate(-1),
          minutes: 30,
          task: 'Short Task',
          checklist: [{ id: 'c1', text: 'Step A', completed: false }],
        }),
      ]

      const setB: SessionLogEntryV2[] = [
        makeSession({ id: 's2', date: makeIsoDate(-3), minutes: 60, task: 'Code Review & Merge' }),
        makeSession({
          id: 's3',
          date: makeIsoDate(-1),
          minutes: 30,
          task: 'Longer Task Name',
          checklist: [
            { id: 'c1', text: 'Step A completed', completed: true },
            { id: 'c2', text: 'Step B', completed: false },
          ],
        }),
        makeSession({ id: 's4', date: makeIsoDate(0), minutes: 40, task: 'Planning' }),
      ]

      const ab = mergeSessions(setA, setB)
      const ba = mergeSessions(setB, setA)

      expect(ab).toEqual(ba)
    })

    it('satisfies Commutativity across randomized and out-of-order session batches', () => {
      const sessionsA: SessionLogEntryV2[] = []
      const sessionsB: SessionLogEntryV2[] = []

      for (let i = 0; i < 20; i++) {
        const id = `sess-${i % 12}`
        const date = makeIsoDate(-i)
        const sA = makeSession({
          id,
          date,
          minutes: 15 + (i * 5) % 45,
          task: i % 2 === 0 ? `Task ${i}` : null,
          checklist: i % 3 === 0 ? [{ id: `c-${i}`, text: `Check ${i}`, completed: false }] : undefined,
        })
        const sB = makeSession({
          id,
          date,
          minutes: 20 + (i * 3) % 45,
          task: `Task Variant ${i}`,
          checklist: i % 3 === 0 ? [{ id: `c-${i}`, text: `Check ${i} updated`, completed: true }] : undefined,
        })

        if (i % 2 === 0) sessionsA.push(sA)
        if (i % 3 !== 0) sessionsB.push(sB)
      }

      const resAB = mergeSessions(sessionsA, sessionsB)
      const resBA = mergeSessions(sessionsB, sessionsA)

      expect(resAB).toEqual(resBA)
    })

    it('satisfies Idempotency: mergeSessions(A, A) deep-equals canonical sorted A', () => {
      const setA: SessionLogEntryV2[] = [
        makeSession({ id: 's1', date: makeIsoDate(-10), minutes: 25 }),
        makeSession({ id: 's2', date: makeIsoDate(-2), minutes: 45 }),
        makeSession({ id: 's3', date: makeIsoDate(-5), minutes: 30 }),
      ]

      const canonicalA = mergeSessions(setA, [])
      const mergedSelf = mergeSessions(setA, setA)

      expect(mergedSelf).toEqual(canonicalA)
      expect(mergeSessions(canonicalA, canonicalA)).toEqual(canonicalA)
    })

    it('satisfies Multi-Step Convergence: merge(merge(A, B), B) deep-equals merge(A, B)', () => {
      const setA: SessionLogEntryV2[] = [
        makeSession({ id: 's1', date: makeIsoDate(-4), minutes: 25, task: 'Alpha' }),
        makeSession({ id: 's2', date: makeIsoDate(-2), minutes: 30, task: 'Beta' }),
      ]
      const setB: SessionLogEntryV2[] = [
        makeSession({ id: 's2', date: makeIsoDate(-2), minutes: 45, task: 'Beta Extended' }),
        makeSession({ id: 's3', date: makeIsoDate(-1), minutes: 50, task: 'Gamma' }),
      ]

      const singleMerge = mergeSessions(setA, setB)
      const doubleMergeB = mergeSessions(singleMerge, setB)
      const doubleMergeA = mergeSessions(singleMerge, setA)

      expect(doubleMergeB).toEqual(singleMerge)
      expect(doubleMergeA).toEqual(singleMerge)
    })

    it('satisfies 3-Way Associativity: merge(merge(A, B), C) deep-equals merge(A, merge(B, C))', () => {
      const dev1: SessionLogEntryV2[] = [
        makeSession({ id: 's1', date: makeIsoDate(-3), minutes: 25, task: 'Init' }),
        makeSession({ id: 's2', date: makeIsoDate(-2), minutes: 30, task: 'Mid Dev 1' }),
      ]
      const dev2: SessionLogEntryV2[] = [
        makeSession({ id: 's2', date: makeIsoDate(-2), minutes: 45, task: 'Mid Dev 2 Longer' }),
        makeSession({ id: 's3', date: makeIsoDate(-1), minutes: 20, task: 'Late' }),
      ]
      const dev3: SessionLogEntryV2[] = [
        makeSession({ id: 's1', date: makeIsoDate(-3), minutes: 35, task: 'Init Extended' }),
        makeSession({ id: 's4', date: makeIsoDate(0), minutes: 50, task: 'Final' }),
      ]

      const leftGrouped = mergeSessions(mergeSessions(dev1, dev2), dev3)
      const rightGrouped = mergeSessions(dev1, mergeSessions(dev2, dev3))

      expect(leftGrouped).toEqual(rightGrouped)
    })
  })

  describe('3. Deduplication & Conflict Resolution', () => {
    describe('Duration (minutes) conflict', () => {
      it('chooses the maximum duration when session IDs collide', () => {
        const local = [makeSession({ id: 'c1', minutes: 25 })]
        const remote = [makeSession({ id: 'c1', minutes: 50 })]

        const mergedA = mergeSessions(local, remote)
        expect(mergedA).toHaveLength(1)
        expect(mergedA[0].minutes).toBe(50)

        const mergedB = mergeSessions(remote, local)
        expect(mergedB).toHaveLength(1)
        expect(mergedB[0].minutes).toBe(50)
      })

      it('preserves duration when conflicting minutes are identical', () => {
        const local = [makeSession({ id: 'c1', minutes: 45 })]
        const remote = [makeSession({ id: 'c1', minutes: 45 })]

        const merged = mergeSessions(local, remote)
        expect(merged).toHaveLength(1)
        expect(merged[0].minutes).toBe(45)
      })
    })

    describe('Task string conflict', () => {
      it('prefers non-null task over null task', () => {
        const localWithTask = [makeSession({ id: 't1', task: 'Writing Documentation' })]
        const remoteNullTask = [makeSession({ id: 't1', task: null })]

        const merged1 = mergeSessions(localWithTask, remoteNullTask)
        expect(merged1[0].task).toBe('Writing Documentation')

        const merged2 = mergeSessions(remoteNullTask, localWithTask)
        expect(merged2[0].task).toBe('Writing Documentation')
      })

      it('prefers longer task string over shorter task string', () => {
        const shortTask = [makeSession({ id: 't1', task: 'Writing' })]
        const longTask = [makeSession({ id: 't1', task: 'Writing Stage 7 Roadmap' })]

        const merged1 = mergeSessions(shortTask, longTask)
        expect(merged1[0].task).toBe('Writing Stage 7 Roadmap')

        const merged2 = mergeSessions(longTask, shortTask)
        expect(merged2[0].task).toBe('Writing Stage 7 Roadmap')
      })

      it('tie-breaks alphabetically using localeCompare when task strings have identical length', () => {
        const taskA = [makeSession({ id: 't1', task: 'Task Alpha' })] // length 10
        const taskB = [makeSession({ id: 't1', task: 'Task Zebra' })] // length 10

        const merged1 = mergeSessions(taskA, taskB)
        expect(merged1[0].task).toBe('Task Zebra')

        const merged2 = mergeSessions(taskB, taskA)
        expect(merged2[0].task).toBe('Task Zebra')
      })

      it('treats whitespace-only task as null and clamps to MAX_TASK_LENGTH', () => {
        const whitespace = [makeSession({ id: 't1', task: '    ' })]
        const valid = [makeSession({ id: 't1', task: 'Valid Task' })]

        const merged = mergeSessions(whitespace, valid)
        expect(merged[0].task).toBe('Valid Task')

        const whitespaceAgainstNull = mergeSessions(whitespace, [makeSession({ id: 't1', task: null })])
        expect(whitespaceAgainstNull[0].task).toBeNull()

        const overlongTask = 'A'.repeat(MAX_TASK_LENGTH + 50)
        const clampedSession = [makeSession({ id: 't2', task: overlongTask })]
        const clampedResult = mergeSessions(clampedSession, [])
        expect(clampedResult[0].task).toHaveLength(MAX_TASK_LENGTH)
        expect(clampedResult[0].task).toBe('A'.repeat(MAX_TASK_LENGTH))
      })
    })

    describe('Date timestamp conflict on identical ID', () => {
      it('preserves the earliest valid timestamp when same session ID has differing dates', () => {
        const earlierDate = '2026-09-10T08:00:00.000Z'
        const laterDate = '2026-09-11T08:00:00.000Z'

        const sessEarlier = makeSession({ id: 'same-id', date: earlierDate, minutes: 25 })
        const sessLater = makeSession({ id: 'same-id', date: laterDate, minutes: 30 })

        const mergedAB = mergeSessions([sessEarlier], [sessLater])
        expect(mergedAB).toHaveLength(1)
        expect(mergedAB[0].date).toBe(earlierDate)
        expect(mergedAB[0].minutes).toBe(30)

        const mergedBA = mergeSessions([sessLater], [sessEarlier])
        expect(mergedBA).toHaveLength(1)
        expect(mergedBA[0].date).toBe(earlierDate)
        expect(mergedBA[0].minutes).toBe(30)
      })
    })

    describe('Checklist conflict & monotonic completion', () => {
      it('enforces monotonic completion: completed=true wins over completed=false for same item ID', () => {
        const itemUncompleted: ChecklistItem = { id: 'chk-1', text: 'Draft spec', completed: false }
        const itemCompleted: ChecklistItem = { id: 'chk-1', text: 'Draft spec', completed: true }

        const local = [makeSession({ id: 's1', checklist: [itemUncompleted] })]
        const remote = [makeSession({ id: 's1', checklist: [itemCompleted] })]

        const resA = mergeSessions(local, remote)
        expect(resA[0].checklist).toEqual([itemCompleted])

        const resB = mergeSessions(remote, local)
        expect(resB[0].checklist).toEqual([itemCompleted])
      })

      it('supports done=true as alias for completed=true', () => {
        const rawLocal = [
          {
            id: 's1',
            date: '2026-09-11T10:00:00.000Z',
            minutes: 25,
            task: 'Task',
            checklist: [{ id: 'chk-1', text: 'Step 1', done: true }],
          },
        ]
        const rawRemote = [
          {
            id: 's1',
            date: '2026-09-11T10:00:00.000Z',
            minutes: 25,
            task: 'Task',
            checklist: [{ id: 'chk-1', text: 'Step 1', completed: false }],
          },
        ]

        const result = mergeSessions(rawLocal, rawRemote)
        expect(result[0].checklist).toBeDefined()
        expect(result[0].checklist![0].completed).toBe(true)
      })

      it('deduplicates checklist items by item ID and performs union of disjoint items', () => {
        const item1: ChecklistItem = { id: 'c1', text: 'Item 1', completed: false }
        const item2: ChecklistItem = { id: 'c2', text: 'Item 2', completed: true }
        const item3: ChecklistItem = { id: 'c3', text: 'Item 3', completed: false }

        const local = [makeSession({ id: 's1', checklist: [item1, item2] })]
        const remote = [makeSession({ id: 's1', checklist: [item2, item3] })]

        const merged = mergeSessions(local, remote)
        expect(merged[0].checklist).toHaveLength(3)
        const ids = merged[0].checklist!.map((i) => i.id)
        expect(ids).toContain('c1')
        expect(ids).toContain('c2')
        expect(ids).toContain('c3')
      })

      it('clamps merged checklist to MAX_CHECKLIST_ITEMS (3 items)', () => {
        const localItems: ChecklistItem[] = [
          { id: 'c1', text: 'Item 1', completed: false },
          { id: 'c2', text: 'Item 2', completed: false },
        ]
        const remoteItems: ChecklistItem[] = [
          { id: 'c3', text: 'Item 3', completed: false },
          { id: 'c4', text: 'Item 4', completed: false },
        ]

        const local = [makeSession({ id: 's1', checklist: localItems })]
        const remote = [makeSession({ id: 's1', checklist: remoteItems })]

        const merged = mergeSessions(local, remote)
        expect(merged[0].checklist).toBeDefined()
        expect(merged[0].checklist!.length).toBe(MAX_CHECKLIST_ITEMS)
      })

      it('clamps checklist item text to MAX_CHECKLIST_TEXT_LENGTH (140 chars)', () => {
        const longText = 'B'.repeat(MAX_CHECKLIST_TEXT_LENGTH + 30)
        const local = [
          makeSession({
            id: 's1',
            checklist: [{ id: 'c1', text: longText, completed: false }],
          }),
        ]

        const result = mergeSessions(local, [])
        expect(result[0].checklist![0].text).toHaveLength(MAX_CHECKLIST_TEXT_LENGTH)
        expect(result[0].checklist![0].text).toBe('B'.repeat(MAX_CHECKLIST_TEXT_LENGTH))
      })

      it('tie-breaks conflicting text on same item ID preferring longer text or localeCompare', () => {
        const listA: ChecklistItem[] = [{ id: 'c1', text: 'Short', completed: false }]
        const listB: ChecklistItem[] = [{ id: 'c1', text: 'Longer description', completed: false }]

        const merged = mergeChecklists(listA, listB)
        expect(merged![0].text).toBe('Longer description')

        const listSameLenA: ChecklistItem[] = [{ id: 'c1', text: 'Alpha text', completed: false }]
        const listSameLenB: ChecklistItem[] = [{ id: 'c1', text: 'Zebra text', completed: false }]

        const mergedSameLen = mergeChecklists(listSameLenA, listSameLenB)
        expect(mergedSameLen![0].text).toBe('Zebra text')
      })
    })

    describe('Distinct session preservation (differing IDs with identical timestamps)', () => {
      it('preserves both distinct sessions when IDs differ even if date and duration match', () => {
        const local = [
          makeSession({
            id: 'uuid-local-1',
            date: '2026-09-11T09:00:00.000Z',
            minutes: 25,
            task: 'Local Title',
          }),
        ]
        const remote = [
          makeSession({
            id: 'uuid-remote-2',
            date: '2026-09-11T09:00:00.000Z',
            minutes: 25,
            task: 'Remote Title Longer',
          }),
        ]

        const merged = mergeSessions(local, remote)
        expect(merged).toHaveLength(2)
        expect(merged.map((s) => s.id)).toContain('uuid-local-1')
        expect(merged.map((s) => s.id)).toContain('uuid-remote-2')
      })

      it('does NOT collapse sessions with identical date if durations differ', () => {
        const s1 = makeSession({ id: 's-1', date: '2026-09-11T09:00:00.000Z', minutes: 25 })
        const s2 = makeSession({ id: 's-2', date: '2026-09-11T09:00:00.000Z', minutes: 50 })

        const merged = mergeSessions([s1], [s2])
        expect(merged).toHaveLength(2)
      })
    })
  })

  describe('4. Chronological Ordering & Tie-Breaking', () => {
    it('sorts sessions descending chronologically by date (newest first)', () => {
      const s1 = makeSession({ id: 's1', date: '2026-09-01T10:00:00.000Z', minutes: 25 })
      const s2 = makeSession({ id: 's2', date: '2026-09-05T10:00:00.000Z', minutes: 25 })
      const s3 = makeSession({ id: 's3', date: '2026-09-03T10:00:00.000Z', minutes: 25 })

      const result = mergeSessions([s1, s2], [s3])

      expect(result.map((s) => s.id)).toEqual(['s2', 's3', 's1'])
    })

    it('secondary tie-breaks sessions with identical timestamps descending by id', () => {
      const sameDate = '2026-09-11T12:00:00.000Z'
      const sAlpha = makeSession({ id: 'alpha-sess', date: sameDate, minutes: 20 })
      const sZebra = makeSession({ id: 'zebra-sess', date: sameDate, minutes: 40 })

      const result = mergeSessions([sAlpha], [sZebra])

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('zebra-sess')
      expect(result[1].id).toBe('alpha-sess')
    })

    it('correctly compares ISO timestamps across differing time zones and offsets', () => {
      const utc = makeSession({ id: 'utc', date: '2026-09-11T12:00:00.000Z', minutes: 25 })
      const plusTwo = makeSession({ id: 'plusTwo', date: '2026-09-11T14:30:00.000+02:00', minutes: 25 }) // 12:30 UTC
      const minusFour = makeSession({ id: 'minusFour', date: '2026-09-11T07:00:00.000-04:00', minutes: 25 }) // 11:00 UTC

      const result = mergeSessions([utc, minusFour], [plusTwo])

      expect(result.map((s) => s.id)).toEqual(['plusTwo', 'utc', 'minusFour'])
    })
  })

  describe('5. Boundary Capping & Limit Enforcement', () => {
    it('enforces MAX_SESSIONS (1,000 items) limit when merging 600 local + 600 remote sessions', () => {
      const local: SessionLogEntryV2[] = []
      const remote: SessionLogEntryV2[] = []

      // Generate 1200 distinct sessions spanning 1200 hours in the past
      for (let i = 0; i < 600; i++) {
        local.push(
          makeSession({
            id: `loc-${i}`,
            date: makeIsoDate(-i * 2),
            minutes: 25,
            task: `Local ${i}`,
          }),
        )
      }

      for (let i = 0; i < 600; i++) {
        remote.push(
          makeSession({
            id: `rem-${i}`,
            date: makeIsoDate(-(i * 2 + 1)),
            minutes: 25,
            task: `Remote ${i}`,
          }),
        )
      }

      const merged = mergeSessions(local, remote)

      expect(merged).toHaveLength(MAX_SESSIONS)
      // Verify all items are strictly in descending chronological order
      for (let i = 0; i < merged.length - 1; i++) {
        const curTime = Date.parse(merged[i].date)
        const nextTime = Date.parse(merged[i + 1].date)
        expect(curTime).toBeGreaterThanOrEqual(nextTime)
      }

      // Verify that the oldest 200 items out of 1200 were pruned
      const newestTime = Date.parse(merged[0].date)
      const oldestKeptTime = Date.parse(merged[MAX_SESSIONS - 1].date)
      expect(newestTime).toBeGreaterThan(oldestKeptTime)
    })

    it('caps single local array exceeding 1,000 sessions to exactly 1,000', () => {
      const largeList: SessionLogEntryV2[] = []
      for (let i = 0; i < 1150; i++) {
        largeList.push(
          makeSession({
            id: `large-${i}`,
            date: makeIsoDate(-i),
            minutes: 25,
          }),
        )
      }

      const result = mergeSessions(largeList, [])
      expect(result).toHaveLength(MAX_SESSIONS)
      expect(result[0].id).toBe('large-0')
      expect(result[MAX_SESSIONS - 1].id).toBe(`large-${MAX_SESSIONS - 1}`)
    })

    it('clamps session ID to 64 chars and trims whitespace', () => {
      const longId = 'id-prefix-'.padEnd(100, 'x')
      const sessionWithLongId = [
        makeSession({
          id: `   ${longId}   `,
          date: makeIsoDate(0),
          minutes: 25,
        }),
      ]

      const result = mergeSessions(sessionWithLongId, [])
      expect(result).toHaveLength(1)
      expect(result[0].id).toHaveLength(64)
      expect(result[0].id).toBe(longId.slice(0, 64))
    })
  })

  describe('6. Prototype Pollution Resistance & Field Sanitization', () => {
    it('strips __proto__ and constructor prototype pollution payloads safely', () => {
      const maliciousPayload = JSON.parse(
        '{"id":"mal-1","date":"2026-09-11T10:00:00.000Z","minutes":25,"task":"Clean Task","__proto__":{"polluted":"yes"},"constructor":{"prototype":{"injected":true}}}',
      )

      const result = mergeSessions([maliciousPayload], [])

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('mal-1')
      expect(result[0].task).toBe('Clean Task')

      // Assert prototype was not polluted
      const plainObj = {} as Record<string, unknown>
      expect(plainObj.polluted).toBeUndefined()
      expect(plainObj.injected).toBeUndefined()
    })

    it('strips arbitrary unknown properties outside the session schema', () => {
      const dirtyObj = {
        id: 's-dirty',
        date: '2026-09-11T10:00:00.000Z',
        minutes: 25,
        task: 'Safe Task',
        extraSecretToken: 'SUPER_SECRET',
        metadata: { client: 'evil' },
        internalFlag: true,
      }

      const result = mergeSessions([dirtyObj], [])
      expect(result).toHaveLength(1)
      const cleaned = result[0] as unknown as Record<string, unknown>

      expect(cleaned.id).toBe('s-dirty')
      expect(cleaned.date).toBe('2026-09-11T10:00:00.000Z')
      expect(cleaned.minutes).toBe(25)
      expect(cleaned.task).toBe('Safe Task')
      expect(cleaned.extraSecretToken).toBeUndefined()
      expect(cleaned.metadata).toBeUndefined()
      expect(cleaned.internalFlag).toBeUndefined()
    })
  })

  describe('7. Fault Tolerance & Malformed Input Handling', () => {
    it('gracefully handles non-array and primitive arguments without throwing', () => {
      expect(mergeSessions('corrupt' as unknown as SessionLogEntryV2[], null)).toEqual([])
      expect(mergeSessions(12345 as unknown as SessionLogEntryV2[], undefined)).toEqual([])
      expect(mergeSessions({} as unknown as SessionLogEntryV2[], [] as SessionLogEntryV2[])).toEqual([])
      expect(mergeSessions(true as unknown as SessionLogEntryV2[], false as unknown as SessionLogEntryV2[])).toEqual([])
    })

    it('filters out corrupt elements inside arrays (null, primitives, non-objects)', () => {
      const corruptedInput = [
        null,
        undefined,
        42,
        'string-instead-of-session',
        true,
        [],
        makeSession({ id: 'valid-1', date: makeIsoDate(0), minutes: 25 }),
      ]

      const result = mergeSessions(corruptedInput, [])
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('valid-1')
    })

    it('filters out entries with invalid date representations', () => {
      const invalidDates = [
        { id: 'bad-1', date: 'not-a-valid-date', minutes: 25 },
        { id: 'bad-2', date: '', minutes: 25 },
        { id: 'bad-3', date: null, minutes: 25 },
        { id: 'bad-4', date: 123456789, minutes: 25 },
      ]

      const result = mergeSessions(invalidDates, [])
      expect(result).toHaveLength(0)
    })

    it('normalizes Date objects and legacy startTime fields into ISO strings', () => {
      const nativeDate = new Date('2026-09-11T08:30:00.000Z')
      const legacyDateObj = {
        id: 'date-obj-1',
        date: nativeDate,
        minutes: 25,
      }
      const legacyStartTime = {
        id: 'legacy-start-1',
        startTime: '2026-09-11T09:30:00.000Z',
        minutes: 25,
      }

      const result = mergeSessions([legacyDateObj, legacyStartTime], [])
      expect(result).toHaveLength(2)
      expect(result.find((s) => s.id === 'date-obj-1')?.date).toBe('2026-09-11T08:30:00.000Z')
      expect(result.find((s) => s.id === 'legacy-start-1')?.date).toBe('2026-09-11T09:30:00.000Z')
    })

    it('filters out entries with negative, NaN, or non-finite minutes', () => {
      const invalidMinutes = [
        { id: 'inv-1', date: makeIsoDate(0), minutes: -5 },
        { id: 'inv-2', date: makeIsoDate(0), minutes: Number.NaN },
        { id: 'inv-3', date: makeIsoDate(0), minutes: Number.POSITIVE_INFINITY },
        { id: 'inv-4', date: makeIsoDate(0), minutes: 'invalid-number' },
      ]

      const result = mergeSessions(invalidMinutes, [])
      expect(result).toHaveLength(0)
    })

    it('normalizes numeric string minutes, float minutes, and legacy durationMinutes', () => {
      const candidates = [
        { id: 'm-1', date: makeIsoDate(-1), minutes: '25' },
        { id: 'm-2', date: makeIsoDate(-2), minutes: 24.7 },
        { id: 'm-3', date: makeIsoDate(-3), durationMinutes: 30 },
      ]

      const result = mergeSessions(candidates, [])
      expect(result).toHaveLength(3)
      expect(result.find((s) => s.id === 'm-1')?.minutes).toBe(25)
      expect(result.find((s) => s.id === 'm-2')?.minutes).toBe(25)
      expect(result.find((s) => s.id === 'm-3')?.minutes).toBe(30)
    })

    it('handles corrupted checklist fields gracefully', () => {
      const entryWithCorruptChecklist = {
        id: 's-chk-bad',
        date: makeIsoDate(0),
        minutes: 25,
        checklist: 'not-an-array',
      }

      const result = mergeSessions([entryWithCorruptChecklist], [])
      expect(result).toHaveLength(1)
      expect(result[0].checklist).toBeUndefined()

      const entryWithInvalidChecklistItems = {
        id: 's-chk-bad-items',
        date: makeIsoDate(0),
        minutes: 25,
        checklist: [null, 123, { id: '' }, { text: '' }, { id: 'c1', text: 'Valid Item', completed: true }],
      }

      const result2 = mergeSessions([entryWithInvalidChecklistItems], [])
      expect(result2[0].checklist).toEqual([{ id: 'c1', text: 'Valid Item', completed: true }])

      // Checklist with empty array does not attach an empty checklist property
      const entryWithEmptyChecklist = {
        id: 's-chk-empty',
        date: makeIsoDate(0),
        minutes: 25,
        checklist: [],
      }

      const result3 = mergeSessions([entryWithEmptyChecklist], [])
      expect(result3[0].checklist).toBeUndefined()
    })

    it('efficiently merges a stress payload of 2,000 sessions in under 150ms', () => {
      const batchA: SessionLogEntryV2[] = []
      const batchB: SessionLogEntryV2[] = []

      for (let i = 0; i < 1000; i++) {
        batchA.push(
          makeSession({
            id: `stress-a-${i}`,
            date: makeIsoDate(-i),
            minutes: 25,
            task: `Stress Task A ${i}`,
          }),
        )
        batchB.push(
          makeSession({
            id: `stress-b-${i}`,
            date: makeIsoDate(-i - 0.5),
            minutes: 30,
            task: `Stress Task B ${i}`,
          }),
        )
      }

      const startTime = performance.now()
      const merged = mergeSessions(batchA, batchB)
      const duration = performance.now() - startTime

      expect(merged).toHaveLength(MAX_SESSIONS)
      expect(duration).toBeLessThan(150)
    })
  })

  describe('8. Direct Unit Testing of Exported Engine Helpers', () => {
    describe('sanitizeChecklistItem', () => {
      it('sanitizes valid checklist item and tolerates done: true', () => {
        const item1 = sanitizeChecklistItem({ id: 'c1', text: 'Clean room', completed: true })
        expect(item1).toEqual({ id: 'c1', text: 'Clean room', completed: true })

        const item2 = sanitizeChecklistItem({ id: 'c2', text: 'Wash dishes', done: true })
        expect(item2).toEqual({ id: 'c2', text: 'Wash dishes', completed: true })
      })

      it('returns null for non-object, missing id, or missing text', () => {
        expect(sanitizeChecklistItem(null)).toBeNull()
        expect(sanitizeChecklistItem([])).toBeNull()
        expect(sanitizeChecklistItem('string')).toBeNull()
        expect(sanitizeChecklistItem({ id: '  ', text: 'Valid' })).toBeNull()
        expect(sanitizeChecklistItem({ id: 'c1', text: '   ' })).toBeNull()
        expect(sanitizeChecklistItem({ id: 123, text: 'Valid' })).toBeNull()
      })

      it('clamps checklist item id and text lengths', () => {
        const longId = 'id-'.repeat(30)
        const longText = 'text-'.repeat(50)

        const sanitized = sanitizeChecklistItem({ id: longId, text: longText, completed: false })
        expect(sanitized).not.toBeNull()
        expect(sanitized!.id.length).toBeLessThanOrEqual(MAX_CHECKLIST_ID_LENGTH)
        expect(sanitized!.text.length).toBeLessThanOrEqual(MAX_CHECKLIST_TEXT_LENGTH)
      })
    })

    describe('mergeChecklists', () => {
      it('returns undefined if both checklists are empty or null', () => {
        expect(mergeChecklists(null, null)).toBeUndefined()
        expect(mergeChecklists([], [])).toBeUndefined()
        expect(mergeChecklists(undefined, [])).toBeUndefined()
      })

      it('returns sanitized single checklist when other is null or empty', () => {
        const list: ChecklistItem[] = [{ id: 'c1', text: 'Task 1', completed: false }]
        expect(mergeChecklists(list, null)).toEqual(list)
        expect(mergeChecklists(null, list)).toEqual(list)
      })

      it('is strictly commutative for arbitrary lists', () => {
        const listA: ChecklistItem[] = [
          { id: 'c1', text: 'Item 1', completed: false },
          { id: 'c2', text: 'Item 2', completed: true },
        ]
        const listB: ChecklistItem[] = [
          { id: 'c1', text: 'Item 1 updated', completed: true },
          { id: 'c3', text: 'Item 3', completed: false },
        ]

        expect(mergeChecklists(listA, listB)).toEqual(mergeChecklists(listB, listA))
      })
    })

    describe('reconcileSessionConflict', () => {
      it('reconciles two conflicting sessions deterministically and commutatively', () => {
        const entryA: SessionLogEntryV2 = {
          id: 'sess-a',
          date: '2026-09-11T10:00:00.000Z',
          minutes: 25,
          task: 'Writing Code',
          checklist: [{ id: 'c1', text: 'Step 1', completed: false }],
        }
        const entryB: SessionLogEntryV2 = {
          id: 'sess-b',
          date: '2026-09-11T09:00:00.000Z',
          minutes: 50,
          task: 'Writing Code & Tests',
          checklist: [{ id: 'c1', text: 'Step 1 Done', completed: true }],
        }

        const reconciledAB = reconcileSessionConflict(entryA, entryB)
        const reconciledBA = reconcileSessionConflict(entryB, entryA)

        expect(reconciledAB).toEqual(reconciledBA)
        expect(reconciledAB.minutes).toBe(50)
        expect(reconciledAB.task).toBe('Writing Code & Tests')
        expect(reconciledAB.date).toBe('2026-09-11T09:00:00.000Z') // Earliest timestamp
        expect(reconciledAB.id).toBe('sess-b') // 'sess-b' >= 'sess-a'
        expect(reconciledAB.checklist![0].completed).toBe(true)
      })
    })
  })
})
