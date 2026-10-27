import { describe, expect, it } from 'vitest'
import { applyRemote, isRemoteWrite, readOutbox } from './outbox'
import { DEFAULT_SETTINGS, saveSessions, saveSettings } from '../storage'

describe('outbox trust boundary', () => {
  it('retains imported session IDs that coincide with object prototype properties', () => {
    saveSessions(['__proto__', 'constructor', 'ordinary'].map(id => ({ id, date: new Date().toISOString(), minutes: 25, task: null })))
    expect(Object.keys(readOutbox().sessions).sort()).toEqual(['__proto__', 'constructor', 'ordinary'].sort())
    expect(Object.hasOwn(readOutbox().sessions, '__proto__')).toBe(true)
    saveSettings({ ...DEFAULT_SETTINGS, focus: 45 })
    expect(Object.hasOwn(readOutbox().sessions, '__proto__')).toBe(true)
  })

  it('keeps the outer remote-write boundary active after a nested scope or error', () => {
    applyRemote(() => {
      try { applyRemote(() => { throw Error('TEST nested failure') }) } catch { /* Outer scope continues. */ }
      expect(isRemoteWrite()).toBe(true)
      saveSettings({ ...DEFAULT_SETTINGS, focus: 45 })
    })
    expect(isRemoteWrite()).toBe(false)
    expect(readOutbox().changed).toEqual({})
  })
})
