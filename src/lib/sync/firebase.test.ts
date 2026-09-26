import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getFirebaseConfig, initFirebase, loadFirebaseModules, resetFirebaseContext } from './firebase'

describe('Firebase Dynamic Module Loader', () => {
  beforeEach(() => {
    resetFirebaseContext()
    vi.restoreAllMocks()
  })

  it('provides configuration from environment or fallback', () => {
    const config = getFirebaseConfig()
    expect(config.apiKey).toBeDefined()
    expect(typeof config.projectId).toBe('string')
    expect(config.projectId.length).toBeGreaterThan(0)
    expect(config.authDomain).toContain('firebaseapp.com')
  })

  it('asynchronously loads required Firebase modules without static bundling', async () => {
    const modules = await loadFirebaseModules()
    expect(modules.initializeApp).toBeTypeOf('function')
    expect(modules.getAuth).toBeTypeOf('function')
    expect(modules.GoogleAuthProvider).toBeTypeOf('function')
    expect(modules.signInWithPopup).toBeTypeOf('function')
    expect(modules.initializeFirestore).toBeTypeOf('function')
    expect(modules.doc).toBeTypeOf('function')
    expect(modules.setDoc).toBeTypeOf('function')
    expect(modules.getDoc).toBeTypeOf('function')
  })

  it('initializes Firebase context and returns the singleton instance', async () => {
    const context1 = await initFirebase({
      apiKey: 'test-api-key',
      appId: 'test-app-id',
    })
    expect(context1.app).toBeDefined()
    expect(context1.auth).toBeDefined()
    expect(context1.db).toBeDefined()
    expect(context1.googleProvider).toBeDefined()

    const context2 = await initFirebase()
    expect(context1).toBe(context2)
  })
})
