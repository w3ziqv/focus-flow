import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionLogEntryV2, Settings, SoundPreferences } from '../../types'
import {
  DEFAULT_INTERFACE,
  loadCloudSyncState,
  loadSessions,
  saveCloudSyncState,
  saveInterface,
  saveLastSyncedUid,
  saveSessions,
  saveTombstones,
  loadLastSyncedUid,
} from '../storage'
import { CloudSyncAdapterImpl, resetCloudSyncAdapter } from './adapter'
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
      query: vi.fn((col) => col) as unknown as FirebaseModules['query'],
      orderBy: vi.fn() as unknown as FirebaseModules['orderBy'],
      limit: vi.fn() as unknown as FirebaseModules['limit'],
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
        const docs = Array.from(col.entries()).map(([id, data]) => ({
          id,
          data: () => data,
          ref: { path: `${colRef.path}/${id}` },
        }))
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
    expect(cloudDoc?.checklist).toBeUndefined()
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
})
