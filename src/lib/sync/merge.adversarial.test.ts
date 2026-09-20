import { describe, expect, it } from 'vitest'
import type { SessionLogEntryV2 } from '../../types'
import { MAX_SESSIONS, MAX_TASK_LENGTH } from '../storage'
import { mergeSessions } from './merge'

/**
 * Factory helper for creating valid SessionLogEntryV2 objects.
 */
function makeSession(overrides: Partial<SessionLogEntryV2> = {}): SessionLogEntryV2 {
  return {
    id: overrides.id ?? 'sess-default',
    date: overrides.date ?? '2026-09-11T10:00:00.000Z',
    minutes: overrides.minutes ?? 25,
    task: overrides.task !== undefined ? overrides.task : 'Adversarial Task',
    ...(overrides.checklist ? { checklist: overrides.checklist } : {}),
  }
}

describe('Empirical Adversarial Stress Testing — mergeSessions (src/lib/sync/merge.ts)', () => {

  describe('1. Prototype Pollution Attacks & Schema Integrity', () => {
    it('prevents __proto__, constructor, and prototype pollution from injected objects', () => {
      const maliciousLocal = JSON.parse(
        '{"id":"p1","date":"2026-09-11T10:00:00.000Z","minutes":25,"task":"Task 1","__proto__":{"pollutedKey":"hacked"},"constructor":{"prototype":{"injectedKey":"hacked"}}}',
      )

      const maliciousRemote = {
        id: 'p2',
        date: '2026-09-11T11:00:00.000Z',
        minutes: 30,
        task: 'Task 2',
        checklist: [
          JSON.parse('{"id":"c1","text":"chk","completed":false,"__proto__":{"checkPolluted":true}}'),
        ],
      }

      const result = mergeSessions([maliciousLocal], [maliciousRemote])

      expect(result).toHaveLength(2)

      // Object.prototype must remain unpolluted
      const testObj = {} as Record<string, unknown>
      expect(testObj.pollutedKey).toBeUndefined()
      expect(testObj.injectedKey).toBeUndefined()
      expect(testObj.checkPolluted).toBeUndefined()

      // Returned session objects must not own prototype pollution properties
      for (const entry of result) {
        expect(Object.prototype.hasOwnProperty.call(entry, '__proto__')).toBe(false)
        expect(Object.prototype.hasOwnProperty.call(entry, 'constructor')).toBe(false)
        expect(Object.prototype.hasOwnProperty.call(entry, 'prototype')).toBe(false)
      }
    })

    it('gracefully handles non-array and unexpected types without throwing runtime exceptions', () => {
      expect(() => mergeSessions(null, null)).not.toThrow()
      expect(() => mergeSessions(undefined, undefined)).not.toThrow()
      expect(() => mergeSessions('invalid' as unknown as SessionLogEntryV2[], null)).not.toThrow()
      expect(() => mergeSessions(12345 as unknown as SessionLogEntryV2[], {} as unknown as SessionLogEntryV2[])).not.toThrow()
      expect(mergeSessions(null, null)).toEqual([])
      expect(mergeSessions('bad' as unknown as SessionLogEntryV2[], [])).toEqual([])
    })

    it('filters out corrupted elements (primitives, null, empty objects, arrays)', () => {
      const dirty = [
        null,
        undefined,
        42,
        'not a session',
        true,
        [],
        {},
        { id: '', date: '2026-09-11T10:00:00.000Z', minutes: 25 },
        makeSession({ id: 'valid-clean', date: '2026-09-11T10:00:00.000Z', minutes: 25 }),
      ]

      const result = mergeSessions(dirty, [])
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('valid-clean')
    })
  })


  describe('2. Numerical Boundaries & Extreme Values', () => {
    it('handles 0 minutes correctly as a valid session duration', () => {
      const sess0 = makeSession({ id: 's0', minutes: 0 })
      const result = mergeSessions([sess0], [])
      expect(result).toHaveLength(1)
      expect(result[0].minutes).toBe(0)
    })

    it('handles large minutes values (100,000 min, MAX_SAFE_INTEGER)', () => {
      const sess100k = makeSession({ id: 's100k', minutes: 100000 })
      const sessSafe = makeSession({ id: 'sSafe', minutes: Number.MAX_SAFE_INTEGER })

      const result = mergeSessions([sess100k, sessSafe], [])
      expect(result).toHaveLength(2)
      expect(result.find((s) => s.id === 's100k')?.minutes).toBe(100000)
      expect(result.find((s) => s.id === 'sSafe')?.minutes).toBe(Number.MAX_SAFE_INTEGER)
    })

    it('strictly filters out negative durations and negative infinity', () => {
      const bad = [
        makeSession({ id: 'neg-1', minutes: -1 }),
        makeSession({ id: 'neg-999', minutes: -999 }),
        makeSession({ id: 'neg-inf', minutes: Number.NEGATIVE_INFINITY }),
      ]
      const result = mergeSessions(bad, [])
      expect(result).toHaveLength(0)
    })

    it('strictly filters out NaN and Positive Infinity', () => {
      const bad = [
        makeSession({ id: 'nan', minutes: Number.NaN }),
        makeSession({ id: 'inf', minutes: Number.POSITIVE_INFINITY }),
      ]
      const result = mergeSessions(bad, [])
      expect(result).toHaveLength(0)
    })

    it('normalizes float minutes via Math.round', () => {
      const floats = [
        makeSession({ id: 'fl-1', date: '2026-09-11T10:00:00.000Z', minutes: 24.4 }),
        makeSession({ id: 'fl-2', date: '2026-09-11T11:00:00.000Z', minutes: 24.6 }),
        makeSession({ id: 'fl-3', date: '2026-09-11T12:00:00.000Z', minutes: 0.1 }),
      ]
      const result = mergeSessions(floats, [])
      expect(result).toHaveLength(3)
      expect(result.find((s) => s.id === 'fl-1')?.minutes).toBe(24)
      expect(result.find((s) => s.id === 'fl-2')?.minutes).toBe(25)
      expect(result.find((s) => s.id === 'fl-3')?.minutes).toBe(0)
    })

    it('normalizes valid numeric strings and rejects invalid non-numeric strings', () => {
      const entries = [
        { id: 'str-num', date: '2026-09-11T10:00:00.000Z', minutes: '45' },
        { id: 'str-zero', date: '2026-09-11T11:00:00.000Z', minutes: '0' },
        { id: 'str-neg', date: '2026-09-11T12:00:00.000Z', minutes: '-10' },
        { id: 'str-bad', date: '2026-09-11T13:00:00.000Z', minutes: '25px' },
        { id: 'str-hex', date: '2026-09-11T14:00:00.000Z', minutes: '0x10' },
      ]
      const result = mergeSessions(entries, [])
      expect(result.find((s) => s.id === 'str-num')?.minutes).toBe(45)
      expect(result.find((s) => s.id === 'str-zero')?.minutes).toBe(0)
      expect(result.find((s) => s.id === 'str-neg')).toBeUndefined()
      expect(result.find((s) => s.id === 'str-bad')).toBeUndefined()
      expect(result.find((s) => s.id === 'str-hex')?.minutes).toBe(16)
    })
  })


  describe('3. Timestamp, Date & Timezone Extremes', () => {
    it('handles Unix epoch 0 (1970-01-01T00:00:00.000Z)', () => {
      const epochSess = makeSession({ id: 'epoch', date: '1970-01-01T00:00:00.000Z' })
      const result = mergeSessions([epochSess], [])
      expect(result).toHaveLength(1)
      expect(result[0].date).toBe('1970-01-01T00:00:00.000Z')
    })

    it('handles pre-epoch dates (1969-12-31)', () => {
      const preEpoch = makeSession({ id: 'pre', date: '1969-12-31T23:59:59.000Z' })
      const result = mergeSessions([preEpoch], [])
      expect(result).toHaveLength(1)
      expect(result[0].date).toBe('1969-12-31T23:59:59.000Z')
    })

    it('handles distant future dates (year 9999)', () => {
      const future = makeSession({ id: 'y9999', date: '9999-12-31T23:59:59.000Z' })
      const result = mergeSessions([future], [])
      expect(result).toHaveLength(1)
      expect(result[0].date).toBe('9999-12-31T23:59:59.000Z')
    })

    it('rejects invalid or unparseable date strings', () => {
      const invalid = [
        { id: 'inv-1', date: 'not-a-date', minutes: 25 },
        { id: 'inv-2', date: '2026-13-45T99:99:99Z', minutes: 25 },
        { id: 'inv-3', date: '', minutes: 25 },
        { id: 'inv-4', date: '   ', minutes: 25 },
      ]
      const result = mergeSessions(invalid, [])
      expect(result).toHaveLength(0)
    })

    it('correctly sorts timestamps across disparate timezone offsets (+05:45, -07:00, Z)', () => {
      const sKathmandu = makeSession({ id: 'ktm', date: '2026-09-11T17:45:00.000+05:45', minutes: 20 }) // 12:00 UTC
      const sUtc = makeSession({ id: 'utc', date: '2026-09-11T12:01:00.000Z', minutes: 20 }) // 12:01 UTC
      const sPacific = makeSession({ id: 'pdt', date: '2026-09-11T04:59:00.000-07:00', minutes: 20 }) // 11:59 UTC

      const result = mergeSessions([sKathmandu, sPacific], [sUtc])
      expect(result.map((s) => s.id)).toEqual(['utc', 'ktm', 'pdt'])
    })
  })


  describe('4. Unicode, RTL & String Edge Cases', () => {
    it('handles zero-width spaces, RTL overrides, and multi-codepoint emojis safely', () => {
      const zwsp = 'Task\u200BWith\u200CZero\u200DWidth'
      const rtl = '\u202ETesla \u202Dمرحبا'
      const emoji = 'Focus 🚀 👨‍👩‍👧‍👦 🧘‍♂️ 🇵🇱'

      const sessions = [
        makeSession({ id: 's-zwsp', task: zwsp, date: '2026-09-11T12:00:00.000Z' }),
        makeSession({ id: 's-rtl', task: rtl, date: '2026-09-11T11:00:00.000Z' }),
        makeSession({ id: 's-emoji', task: emoji, date: '2026-09-11T10:00:00.000Z' }),
      ]

      const result = mergeSessions(sessions, [])
      expect(result).toHaveLength(3)
      expect(result.find((s) => s.id === 's-zwsp')?.task).toBe(zwsp)
      expect(result.find((s) => s.id === 's-rtl')?.task).toBe(rtl)
      expect(result.find((s) => s.id === 's-emoji')?.task).toBe(emoji)
    })

    it('safely clamps 5,000 char task strings to MAX_TASK_LENGTH (200) without memory issues', () => {
      const hugeTask = 'Focus '.repeat(1000)
      const hugeSession = makeSession({ id: 's-huge', task: hugeTask })

      const result = mergeSessions([hugeSession], [])
      expect(result).toHaveLength(1)
      expect(result[0].task).toHaveLength(MAX_TASK_LENGTH)
    })

    it('preserves SQL and HTML strings as inert text', () => {
      const injections = [
        makeSession({ id: 'sql', date: '2026-09-11T10:00:00.000Z', task: "'); DROP TABLE sessions;--" }),
        makeSession({ id: 'xss', date: '2026-09-11T11:00:00.000Z', task: '<script>alert("xss")</script>' }),
        makeSession({ id: 'ctrl', date: '2026-09-11T12:00:00.000Z', task: 'Line1\nLine2\r\nLine3\t' }),
      ]

      const result = mergeSessions(injections, [])
      expect(result).toHaveLength(3)
      expect(result.find((s) => s.id === 'sql')?.task).toBe("'); DROP TABLE sessions;--")
      expect(result.find((s) => s.id === 'xss')?.task).toBe('<script>alert("xss")</script>')
    })
  })


  describe('5. High Volume Scalability & Capping (5,000 Sessions)', () => {
    it('processes 5,000 sessions efficiently and caps at MAX_SESSIONS (1,000)', () => {
      const localBatch: SessionLogEntryV2[] = []
      const remoteBatch: SessionLogEntryV2[] = []

      for (let i = 0; i < 2500; i++) {
        const dateL = new Date(1700000000000 - i * 60000).toISOString()
        const dateR = new Date(1700000000000 - i * 60000 - 30000).toISOString()

        localBatch.push(makeSession({ id: `loc-vol-${i}`, date: dateL, minutes: 25, task: `Local ${i}` }))
        remoteBatch.push(makeSession({ id: `rem-vol-${i}`, date: dateR, minutes: 30, task: `Remote ${i}` }))
      }

      const t0 = performance.now()
      const merged = mergeSessions(localBatch, remoteBatch)
      const duration = performance.now() - t0

      expect(merged).toHaveLength(MAX_SESSIONS)

      // Strictly sorted newest first
      for (let i = 0; i < merged.length - 1; i++) {
        const tA = Date.parse(merged[i].date)
        const tB = Date.parse(merged[i + 1].date)
        expect(tA).toBeGreaterThanOrEqual(tB)
      }

      expect(duration).toBeLessThan(250)
    })
  })


  describe('6. Empirical Invariant Challenges (Remediated Commutativity & Zero Data Loss)', () => {
    it('verifies symmetrical commutativity mergeSessions(A, B) === mergeSessions(B, A) with overlapping timestamps', () => {
      // S1: Device 1 has session X at 10:00 (25 min)
      const S1: SessionLogEntryV2 = {
        id: 'sess-X',
        date: '2026-09-11T10:00:00.000Z',
        minutes: 25,
        task: 'Task X',
      }
      // S2: Device 1 also has session Y at 12:00 (50 min)
      const S2: SessionLogEntryV2 = {
        id: 'sess-Y',
        date: '2026-09-11T12:00:00.000Z',
        minutes: 50,
        task: 'Task Y',
      }
      // S3: Device 2 updated session X to 12:00 (50 min)
      const S3: SessionLogEntryV2 = {
        id: 'sess-X',
        date: '2026-09-11T12:00:00.000Z',
        minutes: 50,
        task: 'Task X Updated on Dev2',
      }

      const dev1 = [S1, S2]
      const dev2 = [S3]

      const merge12 = mergeSessions(dev1, dev2)
      const merge21 = mergeSessions(dev2, dev1)

      // Expected CRDT Invariant: merge12 MUST equal merge21
      expect(merge12).toEqual(merge21)
      expect(merge12).toHaveLength(2)
    })

    it('verifies that merge(A, B) and merge(B, A) preserve all distinct sessions without data loss', () => {
      const S1 = makeSession({ id: 'sess-X', date: '2026-09-11T10:00:00.000Z', minutes: 25, task: 'Task X' })
      const S2 = makeSession({ id: 'sess-Y', date: '2026-09-11T12:00:00.000Z', minutes: 50, task: 'Task Y' })
      const S3 = makeSession({ id: 'sess-X', date: '2026-09-11T12:00:00.000Z', minutes: 50, task: 'Task X Updated on Dev2' })

      const merge12 = mergeSessions([S1, S2], [S3])
      const merge21 = mergeSessions([S3], [S1, S2])

      // Both preserve all distinct sessions (length 2)
      expect(merge12).toHaveLength(2)
      expect(merge21).toHaveLength(2)
      expect(merge12).toEqual(merge21)
    })

    it('verifies distinct IDs are never merged across sessions with different IDs', () => {
      const entry1 = makeSession({ id: 'id1', date: '2026-09-11T10:00:00.000Z', minutes: 25, task: 'Task 1' })
      const entry2 = makeSession({ id: 'id1', date: '2026-09-11T12:00:00.000Z', minutes: 50, task: 'Task 2' })
      const entry3 = makeSession({ id: 'id3', date: '2026-09-11T10:00:00.000Z', minutes: 25, task: 'Task 3' })

      const resAB = mergeSessions([entry1, entry2], [entry3])
      const resBA = mergeSessions([entry3], [entry1, entry2])

      expect(resAB).toEqual(resBA)
      expect(resAB).toHaveLength(2)
    })

    it('empirically verifies 0% commutativity violations across 100 randomized permutations', () => {
      let seed = 42
      function rand() {
        seed = (seed * 16807) % 2147483647
        return (seed - 1) / 2147483646
      }

      let violations = 0
      for (let trial = 0; trial < 100; trial++) {
        const countA = Math.floor(rand() * 10) + 2
        const countB = Math.floor(rand() * 10) + 2

        const listA: SessionLogEntryV2[] = []
        const listB: SessionLogEntryV2[] = []

        for (let i = 0; i < countA; i++) {
          const idNum = Math.floor(rand() * 8)
          const dateOffset = Math.floor(rand() * 5) * 3600000
          const minutes = (Math.floor(rand() * 4) + 1) * 15
          const date = new Date(1700000000000 + dateOffset).toISOString()
          listA.push(makeSession({
            id: `sess-${idNum}`,
            date,
            minutes,
            task: rand() > 0.5 ? `Task A ${idNum}` : null,
          }))
        }

        for (let j = 0; j < countB; j++) {
          const idNum = Math.floor(rand() * 8)
          const dateOffset = Math.floor(rand() * 5) * 3600000
          const minutes = (Math.floor(rand() * 4) + 1) * 15
          const date = new Date(1700000000000 + dateOffset).toISOString()
          listB.push(makeSession({
            id: `sess-${idNum}`,
            date,
            minutes,
            task: rand() > 0.5 ? `Task B ${idNum}` : null,
          }))
        }

        const resAB = mergeSessions(listA, listB)
        const resBA = mergeSessions(listB, listA)

        if (JSON.stringify(resAB) !== JSON.stringify(resBA)) {
          violations++
        }
      }

      expect(violations).toBe(0)
    })
  })
})
