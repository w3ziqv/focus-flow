import { describe, expect, it, vi, afterEach } from 'vitest'
import { validateClock, joinClocks } from './desktop/crdt'
import { validateReplica } from './desktop/replica'
import { isStats, loadCustomSounds } from './storage'
import { exportData, importData } from './dataPort'
import { isValidWebhookUrl, testWebhook } from './webhook'

afterEach(() => vi.unstubAllGlobals())
describe('Security boundary regressions', () => {
  it.each(['__proto__', 'constructor', 'prototype'])('rejects reserved replica device %s', id => {
    expect(() => validateClock(JSON.parse(`{"${id}":1}`))).toThrow()
  })
  it('merges vector clocks without an inherited prototype', () => {
    expect(Object.getPrototypeOf(joinClocks({ 'device-a': 1 }, { 'device-b': 2 }))).toBeNull()
  })
  it('rejects peer sessions that could overflow aggregate statistics', () => {
    expect(() => validateReplica({ version: 3, records: { 'session:abc': {
      deleted: false, clock: { 'device-a': 1 }, dot: { device: 'device-a', counter: 1 },
      value: { id: 'abc', date: '2026-10-03T12:00:00Z', minutes: 1e308, task: null },
    } } })).toThrow('duration')
  })
  it('rejects non-finite imported statistics', () => {
    expect(isStats({ minutes: 'Infinity', streak: -1 })?.minutes).toBe(0)
    expect(isStats({ minutes: 'Infinity', streak: -1 })?.streak).toBe(0)
  })
  it('rejects webhook credentials', () => {
    expect(isValidWebhookUrl('https://alice:password@example.com/hook')).toBe(false)
  })
  it('counts backup size in UTF-8 bytes', async () => {
    const raw = '{"x":"é"}'
    expect(await importData(raw, raw.length)).toEqual(expect.objectContaining({
      success: false, error: expect.stringContaining('maximum allowed size'),
    }))
  })
  it('does not restore external URLs as imported audio', async () => {
    const backup = await exportData()
    backup.data.sounds = [{ id: 'remote-audio', name: 'audio.mp3', audio: 'https://example.com/private.mp3' }]
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    expect((await importData(JSON.stringify(backup))).success).toBe(true)
    expect(fetch).not.toHaveBeenCalled()
    expect(loadCustomSounds()).toEqual([])
  })
  it('does not leak cookies or forward webhook payloads through redirects', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 })
    vi.stubGlobal('fetch', fetch)
    await testWebhook('https://example.com/hook')
    expect(fetch).toHaveBeenCalledWith('https://example.com/hook', expect.objectContaining({
      credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer',
    }))
  })
})
