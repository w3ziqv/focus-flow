import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadSessions, loadStats, saveSessions } from '../storage'
import { CloudSyncAdapterImpl, resetCloudSyncAdapter } from './adapter'
import type { FirebaseContext, FirebaseModules } from './firebase'
import * as firebaseMod from './firebase'

describe('Adversarial & Offline Sync Simulator (src/lib/sync/sync_adversarial.test.ts)', () => {
  let mockFirebaseContext: FirebaseContext
  let mockThrowNetworkError = false
  let mockThrowAuthError = false

  beforeEach(() => {
    localStorage.clear()
    resetCloudSyncAdapter()
    vi.restoreAllMocks()

    mockThrowNetworkError = false
    mockThrowAuthError = false

    const mockModules: Partial<FirebaseModules> = {
      signInWithPopup: vi.fn().mockImplementation(() => {
        if (mockThrowNetworkError) {
          return Promise.reject(new Error('auth/network-request-failed'))
        }
        return Promise.resolve({
          user: {
            uid: 'adv-user-1',
            email: 'adv@example.com',
            displayName: 'Adversary Tester',
            photoURL: null,
          },
        })
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
      getDoc: vi.fn(() => {
        if (mockThrowNetworkError) return Promise.reject(new Error('unavailable: client is offline'))
        return Promise.resolve({ exists: () => false, data: () => null })
      }) as unknown as FirebaseModules['getDoc'],
      setDoc: vi.fn(() => {
        if (mockThrowNetworkError) return Promise.reject(new Error('unavailable: client is offline'))
        if (mockThrowAuthError) return Promise.reject(new Error('permission-denied: token expired'))
        return Promise.resolve()
      }) as unknown as FirebaseModules['setDoc'],
      getDocs: vi.fn((colRef) => {
        if (mockThrowNetworkError) return Promise.reject(new Error('unavailable: client is offline'))
        if (mockThrowAuthError) return Promise.reject(new Error('permission-denied: token expired'))

        if (colRef.path.includes('sessions')) {
          // Return simulated malformed + valid remote sessions
          const mockDocs = [
            {
              id: 'valid-s1',
              data: () => ({
                id: 'valid-s1',
                date: '2026-09-20T12:00:00.000Z',
                minutes: 25,
                task: 'Valid Task',
              }),
            },
            {
              id: 'malformed-s2',
              data: () => ({
                id: 'malformed-s2',
                date: 'not-a-valid-date',
                minutes: 'not-a-number',
              }),
            },
            {
              id: 'negative-mins-s3',
              data: () => ({
                id: 'negative-mins-s3',
                date: '2026-09-20T11:00:00.000Z',
                minutes: -50,
              }),
            },
          ]
          return Promise.resolve({
            forEach: (cb: (doc: unknown) => void) => mockDocs.forEach(cb),
            docs: mockDocs,
          })
        }

        return Promise.resolve({
          forEach: () => {},
          docs: [],
        })
      }) as unknown as FirebaseModules['getDocs'],
      writeBatch: vi.fn(() => ({
        set: vi.fn(),
        delete: vi.fn(),
        commit: vi.fn().mockImplementation(() => {
          if (mockThrowNetworkError) return Promise.reject(new Error('unavailable: client is offline'))
          if (mockThrowAuthError) return Promise.reject(new Error('permission-denied: token expired'))
          return Promise.resolve()
        }),
      })) as unknown as FirebaseModules['writeBatch'],
    }

    mockFirebaseContext = {
      app: {} as unknown as FirebaseContext['app'],
      auth: { currentUser: { uid: 'adv-user-1' } } as unknown as FirebaseContext['auth'],
      db: {} as unknown as FirebaseContext['db'],
      googleProvider: { setCustomParameters: vi.fn() } as unknown as FirebaseContext['googleProvider'],
      modules: mockModules as FirebaseModules,
    }

    vi.spyOn(firebaseMod, 'initFirebase').mockResolvedValue(mockFirebaseContext)
  })

  it('handles offline network failure during initial sign-in gracefully', async () => {
    mockThrowNetworkError = true
    const adapter = new CloudSyncAdapterImpl()

    await expect(adapter.signInWithGoogle()).rejects.toThrow('auth/network-request-failed')
    expect(adapter.getAuthState().status).toBe('error')
    expect(adapter.getSyncStatus()).toBe('error')
  })

  it('preserves local storage unmodified when remote fetch throws network offline error', async () => {
    const adapter = new CloudSyncAdapterImpl()
    // First successful sign-in
    await adapter.signInWithGoogle()

    // Now save a local session
    saveSessions([
      { id: 'local-only', date: '2026-09-20T15:00:00.000Z', minutes: 25, task: 'Keep Me Safe' },
    ])

    // Network goes down
    mockThrowNetworkError = true

    await expect(adapter.syncAll()).rejects.toThrow('unavailable: client is offline')
    expect(adapter.getSyncStatus()).toBe('error')

    // Local data must be 100% intact
    const local = loadSessions()
    expect(local).toHaveLength(1)
    expect(local[0].task).toBe('Keep Me Safe')
  })

  it('handles token expiration / permission-denied without crashing', async () => {
    const adapter = new CloudSyncAdapterImpl()
    await adapter.signInWithGoogle()

    // Token expires
    mockThrowAuthError = true

    await expect(adapter.syncAll()).rejects.toThrow('permission-denied: token expired')
    expect(adapter.getSyncStatus()).toBe('error')
    expect(adapter.getSyncState().error).toContain('permission-denied')
  })

  it('filters out malformed remote documents without corrupting local history', async () => {
    const adapter = new CloudSyncAdapterImpl()
    await adapter.signInWithGoogle()

    // Local sessions
    saveSessions([
      { id: 'local-clean', date: '2026-09-20T10:00:00.000Z', minutes: 25, task: 'Clean' },
    ])

    // Remote contains valid-s1, malformed-s2 (invalid date/minutes), negative-mins-s3
    const merged = await adapter.reconcileSessions(loadSessions())

    // Only valid-s1 and local-clean should be preserved
    expect(merged.some((s) => s.id === 'valid-s1')).toBe(true)
    expect(merged.some((s) => s.id === 'local-clean')).toBe(true)
    expect(merged.some((s) => s.id === 'malformed-s2')).toBe(false)
    expect(merged.some((s) => s.id === 'negative-mins-s3')).toBe(false)

    // Recomputed stats reflect only valid sessions
    const stats = loadStats()
    expect(stats.minutes).toBe(50) // 25 + 25
  })
})
