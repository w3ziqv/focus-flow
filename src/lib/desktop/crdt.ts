export type VectorClock = Record<string, number>
export interface ReplicaRecord { clock: VectorClock; dot: { device: string; counter: number }; value: unknown; deleted: boolean }
export interface ReplicaDocument { version: 3; records: Record<string, ReplicaRecord> }
const DEVICE = /^[a-zA-Z0-9_-]{8,64}$/
export function validateClock(value: unknown): VectorClock {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Invalid vector clock')
  const entries = Object.entries(value)
  if (!entries.length || entries.length > 64) throw Error('Invalid vector clock size')
  const clock: VectorClock = Object.create(null) as VectorClock
  for (const [id, count] of entries) {
    if (!DEVICE.test(id) || ['__proto__', 'constructor', 'prototype'].includes(id) || typeof count !== 'number' || !Number.isSafeInteger(count) || count < 1 || count > 1e12) throw Error('Invalid vector clock entry')
    clock[id] = count
  }
  return clock
}
export function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(',')}}`
}
export function joinClocks(a: VectorClock, b: VectorClock): VectorClock {
  const result: VectorClock = Object.assign(Object.create(null) as VectorClock, a)
  for (const [id, count] of Object.entries(b)) result[id] = Math.max(result[id] ?? 0, count)
  if (Object.keys(result).length > 64) throw Error('Too many paired replicas')
  return result
}
export function mergeRecord(a: ReplicaRecord, b: ReplicaRecord): ReplicaRecord {
  const clock = joinClocks(a.clock, b.clock)
  // Session deletion is permanent, including after the cloud tombstone TTL.
  const winner = a.deleted !== b.deleted ? (a.deleted ? a : b)
    : a.dot.counter !== b.dot.counter ? (a.dot.counter > b.dot.counter ? a : b)
      : a.dot.device !== b.dot.device ? (a.dot.device > b.dot.device ? a : b)
        : canonical(a.value) >= canonical(b.value) ? a : b
  return { clock, dot: winner.dot, value: winner.deleted ? null : winner.value, deleted: winner.deleted }
}
export function mergeDocuments(a: ReplicaDocument, b: ReplicaDocument): ReplicaDocument {
  const records = { ...a.records }
  for (const [key, item] of Object.entries(b.records)) records[key] = records[key] ? mergeRecord(records[key], item) : item
  if (Object.keys(records).length > 10_000) throw Error('Replica record limit reached')
  return { version: 3, records }
}
export function setReplicaValue(document: ReplicaDocument, key: string, value: unknown, deviceId: string, deleted = false): ReplicaDocument {
  const current = document.records[key]
  if (current?.deleted && !deleted) return document
  if (current && current.deleted === deleted && canonical(current.value) === canonical(value)) return document
  const counter = Math.max(0, ...Object.values(current?.clock ?? {})) + 1
  const clock = { ...current?.clock, [deviceId]: counter }
  validateClock(clock)
  return { version: 3, records: { ...document.records, [key]: { clock, dot: { device: deviceId, counter }, value: deleted ? null : value, deleted } } }
}
