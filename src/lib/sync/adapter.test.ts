import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionLogEntryV2, Settings, SoundPreferences } from '../../types'
import {
  DEFAULT_INTERFACE,
  loadCloudSyncState,
  loadStats,
  saveStats,
  loadSessions,
  saveCloudSyncState,
  saveInterface,
  saveLastSyncedUid,
  saveSessions,
  saveSession,
  loadSession,
  saveTombstones,
  loadLastSyncedUid,
} from '../storage'
import { MAX_SESSION_BATCH_WRITES, CloudSyncAdapterImpl, resetCloudSyncAdapter } from './adapter'
import type { FirebaseContext, FirebaseModules } from './firebase'
import * as firebaseMod from './firebase'

describe('CloudSyncAdapter & Reconciler (src/lib/sync/adapter.ts)', () => {
  let mockFirebaseContext: FirebaseContext
  let mockDocStore: Map<string, Record<string, unknown>>
  let mockCollectionStore: Map<string, Map<string, Record<string, unknown>>>

  beforeEach(() => {
    localStorage.clear()
    resetCloudSyncAdapter()
    vi.restoreAllMocks()

    mockDocStore = new Map()
    mockCollectionStore = new Map()

    const getCol = (path: string) => {
      if (!mockCollectionStore.has(path)) {
        mockCollectionStore.set(path, new Map())
      }
      return mockCollectionStore.get(path)!
    }

    const mockModules: Partial<FirebaseModules> = {
      signInWithPopup: vi.fn().mockResolvedValue({
        user: {
          uid: 'user-123',
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: 'https://example.com/photo.jpg',
        },
      }),
      signOut: vi.fn().mockResolvedValue(undefined),
      onAuthStateChanged: vi.fn().mockReturnValue(() => {}),
      deleteUser: vi.fn().mockResolvedValue(undefined),
      doc: vi.fn((_db, ...pathSegments) => ({
        path: pathSegments.join('/'),
        id: pathSegments[pathSegments.length - 1],
      })) as unknown as FirebaseModules['doc'],
      collection: vi.fn((_db, ...pathSegments) => ({
        path: pathSegments.join('/'),
      })) as unknown as FirebaseModules['collection'],
      query: vi.fn((col, ...constraints) => ({...col, constraints})) as unknown as FirebaseModules['query'],
      documentId: vi.fn(() => '__name__') as unknown as FirebaseModules['documentId'],
      startAfter: vi.fn((snapshot) => ({kind: 'cursor', path: snapshot.ref.path})) as unknown as FirebaseModules['startAfter'],
      orderBy: vi.fn((field, direction) => ({kind: 'order', field, direction})) as unknown as FirebaseModules['orderBy'],
      limit: vi.fn((count) => ({kind: 'limit', count})) as unknown as FirebaseModules['limit'],
      getDoc: vi.fn((docRef) => {
        const data = mockDocStore.get(docRef.path)
        return Promise.resolve({
          exists: () => data !== undefined,
          data: () => data,
        })
      }) as unknown as FirebaseModules['getDoc'],
      setDoc: vi.fn((docRef, data) => {
        mockDocStore.set(docRef.path, data as Record<string, unknown>)
        return Promise.resolve()
      }) as unknown as FirebaseModules['setDoc'],
      deleteDoc: vi.fn((docRef) => {
        mockDocStore.delete(docRef.path)
        return Promise.resolve()
      }) as unknown as FirebaseModules['deleteDoc'],
      getDocs: vi.fn((colRef) => {
        const col = getCol(colRef.path)
        let docs = Array.from(col.entries()).map(([id, data]) => ({
          id,
          data: () => data,
          ref: { path: `${colRef.path}/${id}` },
        }))
        const constraints = colRef.constraints ?? []
        const cursor = constraints.find((item: {kind: string}) => item.kind === 'cursor')
        const max = constraints.find((item: {kind: string}) => item.kind === 'limit')
        const order = constraints.find((item: {kind: string}) => item.kind === 'order')
        docs.sort((a, b) => order?.field === '__name__' ? a.id.localeCompare(b.id) : String(b.data().date).localeCompare(String(a.data().date)))
        if (cursor) docs = docs.filter(doc => doc.ref.path > cursor.path)
        if (max) docs = docs.slice(0, max.count)
        return Promise.resolve({
          forEach: (cb: (doc: unknown) => void) => docs.forEach(cb),
          docs,
        })
      }) as unknown as FirebaseModules['getDocs'],
      writeBatch: vi.fn(() => {
        const pendingOps: Array<() => void> = []
        return {
          set: (docRef: { path: string }, data: unknown) => {
            pendingOps.push(() => {
              mockDocStore.set(docRef.path, data as Record<string, unknown>)
              const segments = docRef.path.split('/')
              const colPath = segments.slice(0, -1).join('/')
              const docId = segments[segments.length - 1]
              getCol(colPath).set(docId, data as Record<string, unknown>)
            })
          },
          delete: (docRef: { path: string }) => {
            pendingOps.push(() => {
              mockDocStore.delete(docRef.path)
              const segments = docRef.path.split('/')
              const colPath = segments.slice(0, -1).join('/')
              const docId = segments[segments.length - 1]
              getCol(colPath).delete(docId)
            })
          },
          commit: vi.fn().mockImplementation(() => {
            pendingOps.forEach((op) => op())
            return Promise.resolve()
          }),
        }
      }) as unknown as FirebaseModules['writeBatch'],
    }

    mockFirebaseContext = {
      app: {} as unknown as FirebaseContext['app'],
      auth: { currentUser: { uid: 'user-123' } } as unknown as FirebaseContext['auth'],
      db: {} as unknown as FirebaseContext['db'],
      googleProvider: { setCustomParameters: vi.fn() } as unknown as FirebaseContext['googleProvider'],
      modules: mockModules as FirebaseModules,
    }

    vi.spyOn(firebaseMod, 'initFirebase').mockResolvedValue(mockFirebaseContext)
  })

  it('100% Opt-In Invariant: starts completely offline with zero Firebase initialization', () => {
    const adapter = new CloudSyncAdapterImpl()
    expect(adapter.getAuthState().status).toBe('unauthenticated')
    expect(adapter.getSyncStatus()).toBe('offline')
    expect(firebaseMod.initFirebase).not.toHaveBeenCalled()
  })

  it('restores previous authenticated state from localStorage cache without network calls', () => {
    saveCloudSyncState({
      status: 'synced',
      uid: 'cached-user-456',
      email: 'cached@example.com',
      displayName: 'Cached User',
      photoURL: null,
      lastSyncedAt: '2026-09-20T10:00:00.000Z',
      error: null,
    })

    const adapter = new CloudSyncAdapterImpl()
    expect(adapter.getAuthState().status).toBe('authenticated')
    expect(adapter.getAuthState().user?.uid).toBe('cached-user-456')
    expect(adapter.getSyncStatus()).toBe('synced')
    expect(firebaseMod.initFirebase).not.toHaveBeenCalled()
  })

  it('completes Google sign-in and notifies subscribers', async () => {
    const adapter = new CloudSyncAdapterImpl()
    const syncStatusSpy = vi.fn()
    const authStateSpy = vi.fn()

    adapter.onSyncStatusChange(syncStatusSpy)
    adapter.onAuthStateChange(authStateSpy)

    const user = await adapter.signInWithGoogle()

    expect(user.uid).toBe('user-123')
    expect(adapter.getAuthState().status).toBe('authenticated')
    expect(adapter.getSyncStatus()).toBe('synced')
    expect(syncStatusSpy).toHaveBeenCalledWith('syncing')
    expect(syncStatusSpy).toHaveBeenCalledWith('synced')
    expect(loadCloudSyncState()?.uid).toBe('user-123')
  })

  it('signs out cleanly and preserves 100% of local sessions', async () => {
    const adapter = new CloudSyncAdapterImpl()
    await adapter.signInWithGoogle()

    saveSessions([
      { id: 'session-local-1', date: '2026-09-20T12:00:00.000Z', minutes: 25, task: 'Preserved Task' },
    ])

    await adapter.signOut()

    expect(adapter.getAuthState().status).toBe('unauthenticated')
    expect(adapter.getSyncStatus()).toBe('offline')
    expect(loadCloudSyncState()).toBeNull()
    expect(loadSessions()).toHaveLength(1)
    expect(loadSessions()[0].task).toBe('Preserved Task')
  })

  it('masks task titles and omits checklists in cloud when maskTaskTitlesInCloud is enabled', async () => {
    saveInterface({
      ...DEFAULT_INTERFACE,
      maskTaskTitlesInCloud: true,
    })

    const adapter = new CloudSyncAdapterImpl()
    await adapter.signInWithGoogle()

    const session: SessionLogEntryV2 = {
      id: 'private-session-1',
      date: '2026-09-20T12:00:00.000Z',
      minutes: 25,
      task: 'Confidential Client Proposal',
      checklist: [{ id: 'c1', text: 'Financials', completed: true }],
    }

    await adapter.pushSession(session)

    const cloudDoc = mockDocStore.get('users/user-123/sessions/private-session-1')
    expect(cloudDoc).toBeDefined()
    expect(cloudDoc?.task).toBeNull()
    expect(cloudDoc?.checklist).toEqual([])
    expect(cloudDoc?.minutes).toBe(25)
  })

  it('preserves task titles and checklists in cloud when maskTaskTitlesInCloud is disabled', async () => {
    saveInterface({
      ...DEFAULT_INTERFACE,
      maskTaskTitlesInCloud: false,
    })

    const adapter = new CloudSyncAdapterImpl()
    await adapter.signInWithGoogle()

    const session: SessionLogEntryV2 = {
      id: 'public-session-1',
      date: '2026-09-20T12:00:00.000Z',
      minutes: 25,
      task: 'Open Source Contribution',
      checklist: [{ id: 'c1', text: 'Write tests', completed: true }],
    }

    await adapter.pushSession(session)

    const cloudDoc = mockDocStore.get('users/user-123/sessions/public-session-1')
    expect(cloudDoc).toBeDefined()
    expect(cloudDoc?.task).toBe('Open Source Contribution')
    expect(cloudDoc?.checklist).toEqual([{ id: 'c1', text: 'Write tests', completed: true }])
  })

  it('prevents zombie session resurrection via 30-day deletion tombstones', async () => {
    const adapter = new CloudSyncAdapterImpl()
    await adapter.signInWithGoogle()

    // Remote has an old session
    const remoteSessionsCol = mockCollectionStore.get('users/user-123/sessions')!
    remoteSessionsCol.set('zombie-session-1', {
      id: 'zombie-session-1',
      date: '2026-09-18T10:00:00.000Z',
      minutes: 25,
      task: 'Should be deleted',
    })

    // Local device deleted it on 2026-09-19 and recorded tombstone
    saveTombstones([{ id: 'zombie-session-1', deletedAt: '2026-09-19T10:00:00.000Z' }])
    saveSessions([])

    const reconciled = await adapter.reconcileSessions([])

    // Zombie session should NOT be resurrected
    expect(reconciled.some((s) => s.id === 'zombie-session-1')).toBe(false)
    expect(loadSessions().some((s) => s.id === 'zombie-session-1')).toBe(false)
  })

  it('synchronizes settings, stats, and sound preferences bidirectionally', async () => {
    const adapter = new CloudSyncAdapterImpl()
    await adapter.signInWithGoogle()

    const customSettings: Settings = {
      focus: 50,
      short: 10,
      long: 20,
      rounds: 5,
      autoStart: true,
    }
    await adapter.pushSettings(customSettings)

    const pulledSettings = await adapter.pullSettings()
    expect(pulledSettings?.focus).toBe(50)
    expect(pulledSettings?.rounds).toBe(5)

    const customSound: SoundPreferences = {
      baseTexture: 'brown',
      binauralMode: 'theta',
      toneWarmthCutoff: 650,
      volume: 0.75,
    }
    await adapter.pushSoundPrefs(customSound)

    const pulledSound = await adapter.pullSoundPrefs()
    expect(pulledSound?.baseTexture).toBe('brown')
    expect(pulledSound?.binauralMode).toBe('theta')
  })

  it('executes full GDPR Article 17 cloud data erasure', async () => {
    const adapter = new CloudSyncAdapterImpl()
    await adapter.signInWithGoogle()

    await adapter.pushSession({
      id: 'session-to-erase',
      date: '2026-09-20T12:00:00.000Z',
      minutes: 25,
      task: 'Erase Me',
    })

    await adapter.purgeCloudData()

    expect(adapter.getAuthState().status).toBe('unauthenticated')
    expect(adapter.getSyncStatus()).toBe('offline')
    expect(mockFirebaseContext.modules.deleteUser).toHaveBeenCalled()
    expect(loadLastSyncedUid()).toBeNull()
  })

  describe('Multi-Account Consent Guard', () => {
    it('prompts consent resolver when signing into a different Google account and local sessions exist', async () => {
      saveLastSyncedUid('previous-user-999')
      saveStats({...loadStats(), milestones: [{id: 'first_session', unlockedAt: '2026-01-01T12:00:00Z', seen: true}]})
      saveSessions([
        { id: 'user-a-session', date: '2026-09-20T10:00:00.000Z', minutes: 25, task: 'Confidential Session A' },
      ])

      const adapter = new CloudSyncAdapterImpl()
      const consentResolver = vi.fn().mockResolvedValue('replace-local')

      await adapter.signInWithGoogle(consentResolver)

      expect(consentResolver).toHaveBeenCalledWith({
        previousUid: 'previous-user-999',
        newUid: 'user-123',
      })
      // If user chose replace-local, user-a-session should NOT be in remote doc store for user-123
      expect(mockDocStore.has('users/user-123/sessions/user-a-session')).toBe(false)
      expect(loadStats().milestones).toEqual([])
      expect(localStorage.getItem('ff3_account_backup_previous-user-999')).toContain('first_session')
      expect(loadLastSyncedUid()).toBe('user-123')
    })

    it('merges local sessions into new account when user consents to merge', async () => {
      saveLastSyncedUid('previous-user-999')
      saveSessions([
        { id: 'user-a-session-to-keep', date: '2026-09-20T10:00:00.000Z', minutes: 25, task: 'Preserved Work' },
      ])

      const adapter = new CloudSyncAdapterImpl()
      const consentResolver = vi.fn().mockResolvedValue('merge')

      await adapter.signInWithGoogle(consentResolver)

      expect(consentResolver).toHaveBeenCalledWith({
        previousUid: 'previous-user-999',
        newUid: 'user-123',
      })
      // If user chose merge, session is linked to user-123's remote storage
      expect(mockDocStore.has('users/user-123/sessions/user-a-session-to-keep')).toBe(true)
      expect(loadLastSyncedUid()).toBe('user-123')
    })
  })
  it('retries a partially committed 805-session upload in batches <=400 without duplicate IDs', async () => {
    const adapter = new CloudSyncAdapterImpl()
    await adapter.signInWithGoogle()
    const factory = vi.mocked(mockFirebaseContext.modules.writeBatch).getMockImplementation()!
    const sizes: number[] = []
    let failSecond = true
    vi.spyOn(mockFirebaseContext.modules, 'writeBatch').mockImplementation(((db: unknown) => {
      const batch = factory(db as Parameters<typeof factory>[0])
      let size = 0
      return {
        set: (...args: Parameters<typeof batch.set>) => {size++; return batch.set(...args)},
        commit: async () => {
          sizes.push(size)
          if (failSecond && sizes.length === 2) throw new Error('temporary failure')
          await batch.commit()
        },
      }
    }) as unknown as FirebaseModules['writeBatch'])
    const entries = Array.from({length: 805}, (_, i) => ({id: `batch-${i}`, date: '2026-10-01T12:00:00Z', minutes: 1, task: null}))
    await expect(adapter.pushSessions(entries)).rejects.toThrow('temporary failure')
    expect(mockCollectionStore.get('users/user-123/sessions')?.size).toBe(MAX_SESSION_BATCH_WRITES)
    failSecond = false
    await adapter.pushSessions(entries)
    expect(sizes.every(size => size <= 400)).toBe(true)
    expect(sizes.slice(2).reduce((sum, size) => sum + size, 0)).toBe(805)
    expect(mockCollectionStore.get('users/user-123/sessions')?.size).toBe(805)
  })

  it('erases old task/checklist content outside the 1000-session visible window', async () => {
    const adapter = new CloudSyncAdapterImpl()
    await adapter.signInWithGoogle()
    const entries = Array.from({length: 1105}, (_, i) => ({id: `private-${String(i).padStart(4, '0')}`, date: '2026-10-01T12:00:00Z', minutes: 1, task: 'private title', checklist: [{id: 'step', text: 'secret', completed: false}]}))
    await adapter.pushSessions(entries)
    saveInterface({...DEFAULT_INTERFACE, maskTaskTitlesInCloud: true})
    await adapter.applyPrivacy(true)
    const documents = [...mockCollectionStore.get('users/user-123/sessions')!.values()]
    expect(documents).toHaveLength(1105)
    expect(documents.every(doc => doc.task === null && Array.isArray(doc.checklist) && doc.checklist.length === 0)).toBe(true)
  })

  it('keeps a versioned source copy and daily history when migration repeats', async () => {
    const adapter = new CloudSyncAdapterImpl()
    await adapter.signInWithGoogle()
    const source = {minutes: 250, today: 0, week: 0, streak: 1, history: {'Thu Jan 01 2015': 250}, schemaVersion: 2}
    mockDocStore.set('users/user-123/stats/summary', source)
    const stats = (await adapter.pullStats())!
    await adapter.pushStats(stats)
    // Repeated migration must not overwrite the original recovery source.
    mockDocStore.set('users/user-123/stats/summary', {...source, minutes: 500})
    await adapter.pushStats(stats)
    expect(JSON.parse(localStorage.getItem('ff3_history_source_user-123')!)).toEqual(source)
    expect(mockDocStore.get('users/user-123/daily_history/2015-01-01')?.minutes).toBe(250)
    expect(mockDocStore.get('users/user-123/stats/summary')?.history).toBeUndefined()
    expect(mockDocStore.get('users/user-123/stats/summary')?.schemaVersion).toBe(3)
  })

  it('requires account consent even when only settings and old history remain', async () => {
    saveLastSyncedUid('previous-user')
    const adapter = new CloudSyncAdapterImpl()
    await expect(adapter.signInWithGoogle()).rejects.toThrow('account-switch-consent-required')
    expect(loadLastSyncedUid()).toBe('previous-user')
    expect(mockDocStore.size).toBe(0)
  })

  it('does not apply a previous account response after signing out during a sync', async () => {
    const adapter = new CloudSyncAdapterImpl()
    await adapter.signInWithGoogle()
    let resolve!: (value: unknown) => void
    const pending = new Promise(r => {resolve = r})
    let started!: () => void
    const entered = new Promise<void>(r => {started = r})
    vi.spyOn(mockFirebaseContext.modules, 'getDocs').mockImplementationOnce(() => {started(); return pending as ReturnType<FirebaseModules['getDocs']>})
    const sync = adapter.syncAll()
    const rejected = expect(sync).rejects.toThrow('cloud-account-changed')
    await entered
    await adapter.signOut()
    saveTombstones([{id: 'new-profile', deletedAt: '2026-10-03T12:00:00Z'}])
    resolve({docs: [], forEach: () => {}})
    await rejected
    expect(localStorage.getItem('ff2_session_tombstones')).toContain('new-profile')
    expect(adapter.getAuthState().status).toBe('unauthenticated')
  })

  it('does not resend unchanged private content when its cloud projection is already masked', async () => {
    const adapter = new CloudSyncAdapterImpl()
    await adapter.signInWithGoogle()
    saveInterface({...DEFAULT_INTERFACE, maskTaskTitlesInCloud: true})
    const entries = [{id: 'already-masked', date: '2026-10-01T12:00:00Z', minutes: 25, task: 'Local secret', checklist: [{id: 'step', text: 'Local detail', completed: false}]}]
    saveSessions(entries)
    await adapter.pushSessions(entries)
    const upload = vi.spyOn(adapter, 'pushSessions')
    await adapter.reconcileSessions(entries)
    expect(upload).not.toHaveBeenCalled()
    expect(loadSessions()[0].task).toBe('Local secret')
  })

  it('reconstructs consecutive days and last activity from synchronized history', async () => {
    const adapter = new CloudSyncAdapterImpl()
    await adapter.signInWithGoogle()
    const entries = Array.from({length: 3}, (_, i) => {
      const date = new Date(); date.setDate(date.getDate() - i); date.setHours(12, 0, 0, 0)
      return {id: `streak-${i}`, date: date.toISOString(), minutes: 25, task: null}
    })
    await adapter.pushSessions(entries)
    await adapter.reconcileSessions([])
    expect(loadStats().streak).toBe(3)
    expect(loadStats().lastDate).toBe(new Date().toDateString())
  })

  it('times out stalled transport while retaining unsent local sessions', async () => {
    const adapter = new CloudSyncAdapterImpl()
    await adapter.signInWithGoogle()
    vi.useFakeTimers()
    let resolve!: (value: unknown) => void
    try {
      const pending = new Promise(r => {resolve = r})
      vi.spyOn(mockFirebaseContext.modules, 'getDocs').mockImplementationOnce(() => pending as ReturnType<FirebaseModules['getDocs']>)
      saveSessions([{id: 'pending-timeout', date: '2026-10-03T12:00:00Z', minutes: 25, task: 'Keep locally'}])
      const rejected = expect(adapter.syncAll()).rejects.toThrow('cloud-timeout')
      await vi.advanceTimersByTimeAsync(60_001)
      await rejected
      expect(adapter.getSyncStatus()).toBe('error')
      expect(localStorage.getItem('ff3_cloud_outbox')).toContain('pending-timeout')
      expect(loadSessions()[0].id).toBe('pending-timeout')
    } finally {resolve?.({docs: [], forEach: () => {}}); vi.useRealTimers()}
  })

  it('keeps synchronizing beyond a minute while requests continue making progress', async () => {
    const adapter = new CloudSyncAdapterImpl()
    await adapter.signInWithGoogle()
    vi.useFakeTimers()
    try {
      const read = vi.mocked(mockFirebaseContext.modules.getDoc).getMockImplementation()!
      vi.spyOn(mockFirebaseContext.modules, 'getDoc').mockImplementation(ref => new Promise(resolve => {
        setTimeout(() => {void read(ref).then(resolve)}, 45_000)
      }))
      const start = Date.now()
      saveSessions([{id: 'slow-progress', date: new Date().toISOString(), minutes: 25, task: null}])
      const success = expect(adapter.syncAll()).resolves.toBeUndefined()
      await vi.runAllTimersAsync()
      await success
      expect(Date.now() - start).toBeGreaterThan(60_000)
      expect(adapter.getSyncStatus()).toBe('synced')
      expect(localStorage.getItem('ff3_cloud_outbox')).toBeNull()
    } finally {vi.useRealTimers()}
  })

  it('removes the previous account active task on replacement without stopping its device timer', async () => {
    saveLastSyncedUid('previous-user')
    const endTs = Date.now() + 25 * 60_000
    saveSession({mode: 'focus', round: 0, running: true, endTs, remainingMs: 25 * 60_000, task: 'Old private task', taskDone: false, checklist: [{id: 'step', text: 'Private detail', completed: false}]})
    const adapter = new CloudSyncAdapterImpl()
    await adapter.signInWithGoogle(async () => 'replace-local')
    expect(loadSession()?.task).toBe('')
    expect(loadSession()?.checklist ?? []).toEqual([])
    expect(loadSession()?.running).toBe(true)
    expect(loadSession()?.endTs).toBe(endTs)
    expect(localStorage.getItem('ff3_account_backup_previous-user')).toContain('Old private task')
  })

})
