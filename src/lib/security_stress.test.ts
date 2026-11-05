import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { exportData, importData } from './dataPort'
import { loadSessions } from './storage'
import { canonical, mergeDocuments, type ReplicaDocument } from './desktop/crdt'
import { NativePersistence } from './desktop/persistence'

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('bounded security stress scenarios', () => {
  it('rejects 1000 malformed envelopes without side effects or thrown coercions', async () => {
    const backup = await exportData()
    const before = Object.fromEntries(Object.entries(localStorage))
    const invalid: unknown[] = [null, [], {}, { toString: null }, true, 7, '', 'unexpected']
    for (let i = 0; i < 1000; i++) {
      const field = i % 3 === 0 ? 'app' : i % 3 === 1 ? 'version' : 'data'
      const value = { ...backup, [field]: invalid[i % invalid.length] }
      const result = await importData(JSON.stringify(value))
      expect(result.success).toBe(false)
    }
    expect(Object.fromEntries(Object.entries(localStorage))).toEqual(before)
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  }, 15000)

  it('sanitizes object-valued counters without invoking untrusted conversion methods', async () => {
    const backup = await exportData()
    const value = JSON.parse(JSON.stringify(backup))
    value.data.stats.minutes = { toString: null, valueOf: null }
    expect((await importData(JSON.stringify(value))).success).toBe(true)
  })

  it('round-trips 1000 sessions with Unicode and formula-like titles 20 times', async () => {
    const backup = await exportData()
    backup.data.sessions = Array.from({ length: 1000 }, (_, i) => ({ id: `stress-${i}`, date: '2026-11-04T12:00:00Z', minutes: 1, task: i % 2 ? '=SUM(1,2)' : '中文 Zażółć 👨‍👩‍👧‍👦 "quoted"' }))
    backup.data.stats.minutes = 1000
    for (let i = 0; i < 20; i++) {
      expect((await importData(JSON.stringify(backup))).success).toBe(true)
      expect(loadSessions()).toHaveLength(1000)
      expect((await exportData()).data.sessions).toEqual(loadSessions())
    }
  }, 20000)

  it('converges through 40,000 record comparisons and keeps deletions permanent', () => {
    const make = (device: string, divisor: number): ReplicaDocument => ({ version: 3, records: Object.fromEntries(Array.from({ length: 1000 }, (_, i) => {
      const deleted = i % divisor === 0
      return [`session:${i}`, { clock: { [device]: i + 1 }, dot: { device, counter: i + 1 }, value: deleted ? null : { task: `Unicode 中文 ${i}` }, deleted }]
    })) })
    const a = make('device-a', 7), b = make('device-b', 11)
    let merged = mergeDocuments(a, b)
    expect(canonical(merged)).toBe(canonical(mergeDocuments(b, a)))
    for (let i = 0; i < 20; i++) {
      const next = mergeDocuments(mergeDocuments(merged, a), b)
      expect(canonical(next)).toBe(canonical(merged))
      merged = next
    }
    for (let i = 0; i < 1000; i++) if (i % 7 === 0 || i % 11 === 0) expect(merged.records[`session:${i}`].deleted).toBe(true)
  }, 15000)

  it('coalesces 5000 native writes and retries a failed durable writer', async () => {
    let attempts = 0, durable = ''
    const store = new NativePersistence({ version: 3, values: {} }, async snapshot => {
      if (++attempts === 1) throw Error('Synthetic disk failure')
      durable = snapshot.values.ff2_stress
    })
    for (let i = 0; i < 5000; i++) store.setItem('ff2_stress', String(i))
    await expect(store.flush()).rejects.toThrow('Synthetic disk failure')
    await store.flush()
    expect(durable).toBe('4999')
    expect(store.error).toBeNull()
    expect(attempts).toBe(2)
  })
})
