import { describe, expect, it } from 'vitest'
import { canonical, mergeDocuments, setReplicaValue, validateClock, type ReplicaDocument } from './crdt'
const empty = (): ReplicaDocument => ({version: 3, records: {}})
const a = 'device_alpha', b = 'device_bravo', c = 'device_charlie'
describe('local P2P convergence', () => {
  it('preserves intentional clearing of task titles in a causal edit', () => {
    const first = setReplicaValue(empty(), 'session:one', {task: 'Write'}, a)
    const later = setReplicaValue(first, 'session:one', {task: null}, a)
    expect(mergeDocuments(later, first).records['session:one'].value).toEqual({task: null})
  })
  it('converges concurrent edits independent of merge order and repeated delivery', () => {
    const first = setReplicaValue(empty(), 'session:one', {task: 'A'}, a)
    const second = setReplicaValue(empty(), 'session:one', {task: 'B'}, b)
    const merged = mergeDocuments(first, second)
    expect(canonical(merged)).toBe(canonical(mergeDocuments(second, first)))
    expect(canonical(mergeDocuments(merged, first))).toBe(canonical(merged))
    const third = setReplicaValue(empty(), 'session:two', {task: 'C'}, c)
    expect(canonical(mergeDocuments(merged, third))).toBe(canonical(mergeDocuments(first, mergeDocuments(second, third))))
  })
  it('never resurrects a deleted session when an old offline device returns', () => {
    const original = setReplicaValue(empty(), 'session:one', {task: 'Old'}, a)
    const removed = setReplicaValue(original, 'session:one', null, a, true)
    const offlineEdit = setReplicaValue(original, 'session:one', {task: 'Offline'}, b)
    expect(mergeDocuments(removed, offlineEdit).records['session:one'].deleted).toBe(true)
    expect(mergeDocuments(offlineEdit, removed).records['session:one'].value).toBeNull()
  })
  it('compares canonical nested data rather than property insertion order', () => {
    expect(canonical({b: 2, a: {d: 4, c: 3}})).toBe(canonical({a: {c: 3, d: 4}, b: 2}))
  })
  it('rejects forged, overlong, negative and unbounded clocks', () => {
    for (const clock of [null, {}, {bad: 1}, {[a]: -1}, {[a]: Infinity}, {[a]: 1e13}, Object.fromEntries(Array.from({length: 65}, (_, i) => [`device_${String(i).padStart(8,'0')}`, 1]))]) expect(() => validateClock(clock)).toThrow()
  })
})

describe('CRDT merge algebra under mixed histories', () => {
  it('is commutative, associative and idempotent with edits and multiple tombstones', () => {
    const seed = setReplicaValue(empty(), 'session:one', {task:'seed'}, a)
    const versions = [seed,
      setReplicaValue(seed,'session:one',{task:'edited'},a),
      setReplicaValue(seed,'session:one',{task:null},b),
      setReplicaValue(seed,'session:one',null,b,true),
      setReplicaValue(seed,'session:one',null,c,true),
    ]
    for (const x of versions) for (const y of versions) for (const z of versions) {
      expect(canonical(mergeDocuments(x,y))).toBe(canonical(mergeDocuments(y,x)))
      expect(canonical(mergeDocuments(x,x))).toBe(canonical(x))
      expect(canonical(mergeDocuments(mergeDocuments(x,y),z))).toBe(canonical(mergeDocuments(x,mergeDocuments(y,z))))
    }
  })
})
