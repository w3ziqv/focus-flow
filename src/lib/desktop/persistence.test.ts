import { describe, expect, it, vi } from 'vitest'
import { NativePersistence, validateNativeSnapshot } from './persistence'

describe('durable desktop persistence', () => {
  it('coalesces a domain transaction and keeps writes ordered during an in-flight write', async () => {
    let unblock: () => void = () => {}
    const writes: unknown[] = []
    const write = vi.fn(async (value: unknown) => {
      writes.push(value)
      if (writes.length === 1) await new Promise<void>(resolve => { unblock = resolve })
    })
    const store = new NativePersistence({ version: 3, values: {} }, write)
    store.setItem('ff2_sessions', '[1]')
    store.setItem('ff2_stats', '1')
    const pending = store.flush()
    store.setItem('ff2_stats', '2')
    unblock()
    await pending
    expect(writes).toEqual([
      { version: 3, values: { ff2_sessions: '[1]', ff2_stats: '1' } },
      { version: 3, values: { ff2_sessions: '[1]', ff2_stats: '2' } },
    ])
  })
  it('retains unsaved data after disk failure and retries it', async () => {
    const write = vi.fn().mockRejectedValueOnce(Error('disk full')).mockResolvedValue(undefined)
    const status = vi.fn()
    const store = new NativePersistence({ version: 3, values: {} }, write, status)
    store.setItem('ff2_theme', '"sage"')
    await expect(store.flush()).rejects.toThrow('disk full')
    expect(store.getItem('ff2_theme')).toBe('"sage"')
    await store.flush()
    expect(store.error).toBeNull()
    expect(write).toHaveBeenCalledTimes(2)
  })
  it('persists removal rather than resurrecting a disconnected cloud account', async () => {
    const write = vi.fn().mockResolvedValue(undefined)
    const store = new NativePersistence({ version: 3, values: { ff2_cloud_sync: '{}' } }, write)
    store.removeItem('ff2_cloud_sync')
    await store.flush()
    expect(write).toHaveBeenCalledWith({ version: 3, values: {} })
  })
  it('rejects unknown schemas and malformed files before overwriting anything', () => {
    for (const value of [null, [], {version: 4, values: {}}, {version: 3, values: {unrelated: 'x'}}, {version: 3, values: {ff2_theme: 1}}]) {
      expect(() => validateNativeSnapshot(value)).toThrow()
    }
    expect(validateNativeSnapshot({version: 3, values: {ff2_theme: '"dark"'}}).values.ff2_theme).toBe('"dark"')
  })
})
