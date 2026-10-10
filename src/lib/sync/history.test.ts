import {describe, expect, it} from 'vitest'
import {historyDays, mergeDailyHistory} from './history'
import {mergeSessions} from './merge'
import {applyRemote, readOutbox, acknowledgeOutbox} from './outbox'
import {saveSessions, saveSettings, DEFAULT_SETTINGS} from '../storage'

describe('3.0 history and durable synchronization regressions', () => {
  it('retains archived minutes beyond the visible window without double counting it', () => {
    const day = new Date('2020-01-01T12:00:00Z').toDateString()
    const entries = Array.from({length: 1000}, (_, i) => ({id: `s-${i}`, date: '2020-01-01T12:00:00Z', minutes: 1, task: null}))
    expect(mergeDailyHistory({[day]: 1500}, {[day]: 1500}, entries, entries)).toEqual({[day]: 500})
  })
  it('validates daily numeric values and normalizes legacy day keys', () => {
    expect(historyDays({'Wed Jan 01 2020': 25, invalid: 10, 'Thu Jan 02 2020': Infinity, 'Fri Jan 03 2020': -1})).toEqual([{date: '2020-01-01', minutes: 25, schemaVersion: 3}])
  })
  it('propagates a shorter title or an intentional clear, regardless of merge direction', () => {
    const old = {id: 'edited', date: '2020-01-01T12:00:00Z', minutes: 25, task: 'Long original title', updatedLocallyAt: '2020-01-02T12:00:00Z'}
    for (const task of ['Short', null]) {
      const updated = {...old, task, updatedLocallyAt: '2020-01-03T12:00:00Z'}
      expect(mergeSessions([old], [updated])[0].task).toBe(task)
      expect(mergeSessions([updated], [old])).toEqual(mergeSessions([old], [updated]))
    }
  })
  it('does not resurrect a deletion when the device returns after years offline', () => {
    const session = {id: 'deleted', date: '2026-01-01T12:00:00Z', minutes: 25, task: null}
    expect(mergeSessions([session], [session], [{id: session.id, deletedAt: '2020-01-01T12:00:00Z'}])).toEqual([])
  })
  it('retains more than 1000 pending sessions and refuses to acknowledge newer edits', () => {
    localStorage.clear()
    saveSessions(Array.from({length: 1105}, (_, i) => ({id: `pending-${i}`, date: '2020-01-01T12:00:00Z', minutes: 1, task: null})))
    const old = readOutbox()
    expect(Object.keys(old.sessions)).toHaveLength(1105)
    saveSettings({...DEFAULT_SETTINGS, focus: 40})
    acknowledgeOutbox(old.revision)
    expect(readOutbox().revision).toBeGreaterThan(old.revision)
    applyRemote(() => saveSettings({...DEFAULT_SETTINGS, focus: 50}))
    const current = readOutbox().revision
    acknowledgeOutbox(current)
    expect(readOutbox().changed).toEqual({})
  })
})
