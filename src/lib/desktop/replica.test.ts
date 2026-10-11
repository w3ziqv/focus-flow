import { beforeEach, describe, expect, it } from 'vitest'
import { LocalReplica, validateReplica } from './replica'
import { addSession, deleteSession, loadSessions, pruneTombstones, saveSettings, THIRTY_DAYS_MS, updateSessionTask } from '../storage'
import { canonical } from './crdt'
const session = { id: 'session-one', date: new Date().toISOString(), minutes: 25, task: 'Original' }
beforeEach(() => localStorage.clear())
describe('replica domain boundary', () => {
  it('never transfers credentials, active timers or sound data', () => {
    localStorage.setItem('ff2_cloud_sync', JSON.stringify({token:'secret'}))
    localStorage.setItem('ff2_session', JSON.stringify({running:true, task:'private'}))
    localStorage.setItem('ff2_custom_sounds', '["audio"]')
    addSession(session)
    saveSettings({focus:25,short:5,long:15,rounds:4,autoStart:false})
    const replica = new LocalReplica().capture()
    expect(Object.keys(replica.records).sort()).toEqual(['session:session-one','settings'])
    expect(canonical(replica)).not.toContain('secret')
  })
  it('retains a disconnected deletion after cloud tombstones expire', () => {
    addSession(session)
    const replica = new LocalReplica()
    const old = replica.capture()
    deleteSession(session.id)
    pruneTombstones(Date.now()+THIRTY_DAYS_MS+1)
    replica.merge(old)
    expect(loadSessions()).toEqual([])
    expect(replica.capture().records[`session:${session.id}`].deleted).toBe(true)
  })
  it('persists deliberate null task edits across replica recreation', () => {
    addSession(session)
    const old = new LocalReplica().capture()
    updateSessionTask(session.id, null)
    const next = new LocalReplica()
    next.merge(old)
    expect(loadSessions()[0].task).toBeNull()
  })
  it('rejects mismatched identities and forged revisions before writing', () => {
    addSession(session)
    const document = new LocalReplica().capture()
    const row = document.records[`session:${session.id}`]
    expect(() => validateReplica({...document,records:{'session:other':row}})).toThrow('identity')
    expect(() => validateReplica({...document,records:{[`session:${session.id}`]:{...row,dot:{device:'device_forged',counter:1}}}})).toThrow('revision')
  })
})
