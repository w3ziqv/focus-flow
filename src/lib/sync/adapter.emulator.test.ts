import {readFileSync} from 'node:fs'
import {describe, expect, it, vi} from 'vitest'
import {initializeTestEnvironment} from '@firebase/rules-unit-testing'
import {doc, setDoc, getDoc, getDocs, collection, query, limit} from 'firebase/firestore'
import {CloudSyncAdapterImpl} from './adapter'
import * as firebase from './firebase'
import {DEFAULT_INTERFACE, saveCloudSyncState, loadSessions, loadStats, saveSessions, saveStats, saveInterface, addTombstone, saveSettings, loadSettings} from '../storage'
import {applyRemote} from './outbox'
import type {SessionLogEntryV2} from '../../types'

const address = process.env.FIRESTORE_EMULATOR_HOST

describe('real Firestore adapter integration (requires loopback emulator)', () => {
  it.skipIf(!address)('two devices migrate, exchange >500 sessions, recover offline, preserve totals, delete and mask all pages', async () => {
    if (!address || !/^(127\.0\.0\.1|localhost):\d+$/.test(address)) throw Error('Loopback emulator required')
    const [host, port] = address.split(':')
    const env = await initializeTestEnvironment({projectId: 'demo-focus-flow-security', firestore: {host, port: Number(port), rules: readFileSync('src/lib/sync/firestore.rules', 'utf8')}})
    const modules = await firebase.loadFirebaseModules()
    const profiles: Record<string, Record<string, string>> = {}
    const select = (name: string) => {
      localStorage.clear()
      for (const [key, value] of Object.entries(profiles[name] ?? {})) localStorage.setItem(key, value)
      saveCloudSyncState({status: 'synced', uid: 'alice', email: null, displayName: null, photoURL: null, lastSyncedAt: null, error: null})
    }
    const store = (name: string) => {profiles[name] = Object.fromEntries(Array.from({length: localStorage.length}, (_, i) => localStorage.key(i)!).map(key => [key, localStorage.getItem(key)!]))}
    const create = (db: unknown) => {
      vi.spyOn(firebase, 'initFirebase').mockResolvedValue({db, auth: {currentUser: {uid: 'alice'}}, modules} as unknown as firebase.FirebaseContext)
      return new CloudSyncAdapterImpl()
    }
    const firstDb = env.authenticatedContext('alice', {email: 'first@example.com'}).firestore()
    const secondDb = env.authenticatedContext('alice', {email: 'second@example.com'}).firestore()
    try {
      await env.clearFirestore()
      const legacyDay = 'Thu Jan 01 2015'
      await env.withSecurityRulesDisabled(async context => {
        await setDoc(doc(context.firestore(), 'users/alice/stats/summary'), {minutes: 250, today: 0, week: 0, streak: 1, history: {[legacyDay]: 250}, schemaVersion: 2})
      })
      const entries: SessionLogEntryV2[] = Array.from({length: 1105}, (_, i) => ({id: `session-${String(i).padStart(4, '0')}`, date: new Date(Date.UTC(2020, 0, 1) + i * 86400000).toISOString(), minutes: 1, task: 'Private work', checklist: [{id: 'step', text: 'Private checklist', completed: false}]}))
      select('first')
      const first = create(firstDb)
      saveSessions(entries)
      saveStats({...loadStats(), minutes: 1355, history: {...Object.fromEntries(entries.map(entry => [new Date(entry.date).toDateString(), 1])), [legacyDay]: 250}})
      await first.syncAll()
      expect(loadSessions()).toHaveLength(1000)
      expect(loadStats().minutes).toBe(1355)
      expect(localStorage.getItem('ff3_history_source_alice')).toContain(legacyDay)
      store('first')
      select('second')
      const second = create(secondDb)
      await second.syncAll()
      expect(loadStats().minutes).toBe(1355)
      saveSettings({...loadSettings(), focus: 40})
      await second.syncAll()
      store('second')
      select('first')
      await first.syncAll()
      expect(loadSettings().focus).toBe(40)
      // Both devices edit an existing record while holding different local copies.
      saveSessions(loadSessions().map(entry => entry.id === 'session-1000' ? {...entry, task: 'First long edit', updatedLocallyAt: '2026-10-02T12:00:00Z'} : entry))
      await first.syncAll()
      store('first')
      select('second')
      saveSessions(loadSessions().map(entry => entry.id === 'session-1000' ? {...entry, task: 'Short', updatedLocallyAt: '2026-10-03T12:00:00Z'} : entry))
      await second.syncAll()
      store('second')
      select('first')
      await first.syncAll()
      expect(loadSessions().find(entry => entry.id === 'session-1000')?.task).toBe('Short')
      // A failed transport must retain the local edit and queue; reconnect retries it.
      const offline = vi.spyOn(modules, 'getDocs').mockRejectedValue(new Error('offline'))
      const extra = {id: 'offline-new', date: '2026-09-30T12:00:00Z', minutes: 25, task: 'Offline'}
      saveSessions([extra, ...loadSessions()])
      saveStats({...loadStats(), minutes: 1380, history: {...loadStats().history, [new Date(extra.date).toDateString()]: 25}})
      await expect(first.syncAll()).rejects.toThrow('offline')
      expect(loadSessions().some(entry => entry.id === extra.id)).toBe(true)
      offline.mockRestore()
      await first.syncAll()
      expect(loadStats().minutes).toBe(1380)
      await first.syncAll()
      expect(loadStats().minutes).toBe(1380)
      addTombstone(extra.id, '2020-01-01T12:00:00Z')
      applyRemote(() => {saveSessions(loadSessions().filter(entry => entry.id !== extra.id)); saveStats({...loadStats(), minutes: 1355, history: {...loadStats().history, [new Date(extra.date).toDateString()]: 0}})})
      await first.syncAll()
      expect((await getDoc(doc(firstDb, `users/alice/sessions/${extra.id}`))).exists()).toBe(false)
      saveInterface({...DEFAULT_INTERFACE, maskTaskTitlesInCloud: true})
      await first.syncAll()
      const recent = await getDocs(query(collection(firstDb, 'users/alice/sessions'), limit(1000)))
      expect(recent.size).toBe(1000)
      for (const entry of recent.docs) {expect(entry.data().task).toBeNull(); expect(entry.data().checklist).toEqual([])}
      const older = await getDoc(doc(firstDb, 'users/alice/sessions/session-0000'))
      expect(older.data()?.task).toBeNull()
      expect(older.data()?.checklist).toEqual([])
      store('first')
      select('second')
      await second.syncAll()
      expect(loadStats().minutes).toBe(1355)
      expect(loadSessions().some(entry => entry.id === extra.id)).toBe(false)
      expect((await getDoc(doc(secondDb, 'users/alice/stats/summary'))).data()?.history).toBeUndefined()
      first.dispose(); second.dispose()
    } finally {vi.restoreAllMocks(); await env.cleanup()}
  }, 120000)
})
