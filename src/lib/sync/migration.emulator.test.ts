import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { CloudSyncAdapterImpl } from './adapter'
import * as firebase from './firebase'
import { historyDays } from './history'
import { isStats, loadSessions, loadStats, saveCloudSyncState } from '../storage'
import { exportData, importData } from '../dataPort'

type FirestoreValue = {
  integerValue?: string; doubleValue?: number; stringValue?: string; booleanValue?: boolean
  nullValue?: unknown; mapValue?: { fields?: Record<string, FirestoreValue> }
  arrayValue?: { values?: FirestoreValue[] }
}

function decode(value: FirestoreValue): unknown {
  if ('integerValue' in value) return Number(value.integerValue)
  if ('doubleValue' in value) return value.doubleValue
  if ('stringValue' in value) return value.stringValue
  if ('booleanValue' in value) return value.booleanValue
  if (value.mapValue) return Object.fromEntries(Object.entries(value.mapValue.fields ?? {}).map(([key, item]) => [key, decode(item)]))
  if (value.arrayValue) return (value.arrayValue.values ?? []).map(decode)
  if ('nullValue' in value) return null
  throw Error('Unsupported snapshot value; review before migration')
}

const address = process.env.FIRESTORE_EMULATOR_HOST
const snapshotPath = process.env.FOCUS_FLOW_MIGRATION_SNAPSHOT

describe('private production snapshot migration (loopback only)', () => {
  it.skipIf(!address || !snapshotPath)('preserves real older totals, sessions, source backup and export/restore across migration and restart', async () => {
    if (!address || !/^(127\.0\.0\.1|localhost):\d+$/.test(address) || !snapshotPath) throw Error('Loopback emulator and private snapshot required')
    const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf8')) as {
      documents: { name: string; fields: Record<string, FirestoreValue> }[]
    }
    const documents = snapshot.documents.map(item => {
      const path = item.name.split('/documents/')[1]
      if (!path || !/^users\/[^/]+\/[a-z_]+\/[^/]+$/.test(path)) throw Error('Unexpected snapshot document path')
      return { path, data: decode({ mapValue: { fields: item.fields } }) as Record<string, unknown> }
    })
    const summaries = documents.filter(item => item.path.endsWith('/stats/summary'))
    expect(summaries.length).toBeGreaterThan(0)
    const [host, port] = address.split(':')
    const env = await initializeTestEnvironment({
      projectId: 'demo-focus-flow-migration',
      firestore: { host, port: Number(port), rules: readFileSync('src/lib/sync/firestore.rules', 'utf8') },
    })
    const adapters: CloudSyncAdapterImpl[] = []
    try {
      await env.clearFirestore()
      await env.withSecurityRulesDisabled(async context => {
        for (const item of documents) await setDoc(doc(context.firestore(), item.path), item.data)
      })
      const modules = await firebase.loadFirebaseModules()
      for (const summary of summaries) {
        const uid = summary.path.split('/')[1]
        const original = isStats(summary.data)
        expect(original).not.toBeNull()
        if (!original) throw Error('Older summary does not satisfy the application schema')
        const db = env.authenticatedContext(uid).firestore()
        vi.spyOn(firebase, 'initFirebase').mockResolvedValue({ db, auth: { currentUser: { uid } }, modules } as unknown as firebase.FirebaseContext)
        const expectedIds = documents.filter(item => item.path.startsWith(`users/${uid}/sessions/`)).map(item => item.data.id).sort()
        const expectedDays = historyDays(original.history)
        expect(expectedDays.reduce((total, day) => total + day.minutes, 0)).toBe(Object.values(original.history).reduce((a, b) => a + b, 0))
        for (let restart = 0; restart < 2; restart++) {
          localStorage.clear()
          saveCloudSyncState({ status: 'synced', uid, email: null, displayName: null, photoURL: null, lastSyncedAt: null, error: null })
          const adapter = new CloudSyncAdapterImpl()
          adapters.push(adapter)
          await adapter.syncAll()
          expect(loadStats().minutes).toBe(original.minutes)
          expect(loadStats().history).toMatchObject(original.history)
          expect(loadSessions().map(item => item.id).sort()).toEqual(expectedIds)
          if (restart === 0 && summary.data.history) {
            expect(JSON.parse(localStorage.getItem(`ff3_history_source_${uid}`) ?? 'null')).toEqual(summary.data)
          }
          const migrated = await getDoc(doc(db, summary.path))
          expect(migrated.data()?.schemaVersion).toBe(3)
          expect(migrated.data()?.history).toBeUndefined()
          for (const day of expectedDays) expect((await getDoc(doc(db, `users/${uid}/daily_history/${day.date}`))).data()).toEqual(day)
          adapter.dispose()
        }
        const backup = await exportData()
        const before = { stats: loadStats(), sessions: loadSessions() }
        localStorage.clear()
        const result = await importData(JSON.stringify(backup))
        expect(result.success).toBe(true)
        expect(loadStats()).toEqual(before.stats)
        expect(loadSessions()).toEqual(before.sessions)
      }
    } finally {
      adapters.forEach(adapter => adapter.dispose())
      vi.restoreAllMocks()
      await env.cleanup()
    }
  }, 120000)
})
