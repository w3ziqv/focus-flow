/**
 * Focus Flow — Dynamic Firebase Loading Boundary (Stage 6 / Milestone v2.6)
 *
 * ADR-005 (Local-First Data Sovereignty) & ADR-009 (Opt-in Cloud Sync)
 *
 * INVARIANT: Zero Firebase code is loaded into the main bundle until explicit user gesture.
 * All Firebase dependencies are isolated behind asynchronous dynamic imports.
 */

import type { FirebaseApp } from 'firebase/app'
import type { Auth, GoogleAuthProvider } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'

export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket?: string
  messagingSenderId?: string
  appId: string
}

export interface FirebaseModules {
  initializeApp: typeof import('firebase/app').initializeApp
  getApps: typeof import('firebase/app').getApps
  getApp: typeof import('firebase/app').getApp
  getAuth: typeof import('firebase/auth').getAuth
  GoogleAuthProvider: typeof import('firebase/auth').GoogleAuthProvider
  signInWithPopup: typeof import('firebase/auth').signInWithPopup
  signOut: typeof import('firebase/auth').signOut
  onAuthStateChanged: typeof import('firebase/auth').onAuthStateChanged
  deleteUser: typeof import('firebase/auth').deleteUser
  initializeFirestore: typeof import('firebase/firestore').initializeFirestore
  getFirestore: typeof import('firebase/firestore').getFirestore
  persistentLocalCache: typeof import('firebase/firestore').persistentLocalCache
  persistentMultipleTabManager: typeof import('firebase/firestore').persistentMultipleTabManager
  doc: typeof import('firebase/firestore').doc
  getDoc: typeof import('firebase/firestore').getDoc
  setDoc: typeof import('firebase/firestore').setDoc
  deleteDoc: typeof import('firebase/firestore').deleteDoc
  collection: typeof import('firebase/firestore').collection
  getDocs: typeof import('firebase/firestore').getDocs
  writeBatch: typeof import('firebase/firestore').writeBatch
  onSnapshot: typeof import('firebase/firestore').onSnapshot
  query: typeof import('firebase/firestore').query
  orderBy: typeof import('firebase/firestore').orderBy
  limit: typeof import('firebase/firestore').limit
  where: typeof import('firebase/firestore').where
}

export interface FirebaseContext {
  app: FirebaseApp
  auth: Auth
  db: Firestore
  googleProvider: GoogleAuthProvider
  modules: FirebaseModules
}

let cachedModules: FirebaseModules | null = null
let cachedContext: FirebaseContext | null = null

/**
 * Default public demo / client config fallback for development/testing when env vars are absent.
 * Real deployment uses environment variables.
 */
export function getFirebaseConfig(): FirebaseConfig {
  // SAFETY: import.meta.env is Vite's runtime environment object containing string keys
  const env = (typeof import.meta !== 'undefined' && import.meta.env
    ? (import.meta.env as unknown as Record<string, string | undefined>)
    : {})
  return {
    apiKey: env.VITE_FIREBASE_API_KEY || 'demo-focus-flow-api-key',
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'focus-flow-demo.firebaseapp.com',
    projectId: env.VITE_FIREBASE_PROJECT_ID || 'focus-flow-demo',
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'focus-flow-demo.appspot.com',
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
    appId: env.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456',
  }
}

/**
 * Dynamically loads Firebase SDK modules.
 * This guarantees the core bundle (<300 kB) remains zero-overhead for offline/unauthenticated users.
 */
export async function loadFirebaseModules(): Promise<FirebaseModules> {
  if (cachedModules) {
    return cachedModules
  }

  const [appMod, authMod, firestoreMod] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
    import('firebase/firestore'),
  ])

  cachedModules = {
    initializeApp: appMod.initializeApp,
    getApps: appMod.getApps,
    getApp: appMod.getApp,
    getAuth: authMod.getAuth,
    GoogleAuthProvider: authMod.GoogleAuthProvider,
    signInWithPopup: authMod.signInWithPopup,
    signOut: authMod.signOut,
    onAuthStateChanged: authMod.onAuthStateChanged,
    deleteUser: authMod.deleteUser,
    initializeFirestore: firestoreMod.initializeFirestore,
    getFirestore: firestoreMod.getFirestore,
    persistentLocalCache: firestoreMod.persistentLocalCache,
    persistentMultipleTabManager: firestoreMod.persistentMultipleTabManager,
    doc: firestoreMod.doc,
    getDoc: firestoreMod.getDoc,
    setDoc: firestoreMod.setDoc,
    deleteDoc: firestoreMod.deleteDoc,
    collection: firestoreMod.collection,
    getDocs: firestoreMod.getDocs,
    writeBatch: firestoreMod.writeBatch,
    onSnapshot: firestoreMod.onSnapshot,
    query: firestoreMod.query,
    orderBy: firestoreMod.orderBy,
    limit: firestoreMod.limit,
    where: firestoreMod.where,
  }

  return cachedModules
}

/**
 * Initializes and returns the Firebase Context singleton on-demand.
 * Configures persistent offline multi-tab IndexedDB cache.
 */
export async function initFirebase(customConfig?: Partial<FirebaseConfig>): Promise<FirebaseContext> {
  if (cachedContext) {
    return cachedContext
  }

  const modules = await loadFirebaseModules()
  const config: FirebaseConfig = {
    ...getFirebaseConfig(),
    ...customConfig,
  }

  const existingApps = modules.getApps()
  const app: FirebaseApp = existingApps.length > 0 ? existingApps[0] : modules.initializeApp(config)

  const auth: Auth = modules.getAuth(app)
  const googleProvider = new modules.GoogleAuthProvider()
  googleProvider.setCustomParameters({ prompt: 'select_account' })

  let db: Firestore
  try {
    db = modules.initializeFirestore(app, {
      localCache: modules.persistentLocalCache({
        tabManager: modules.persistentMultipleTabManager(),
      }),
    })
  } catch {
    // If already initialized in this process or tab, retrieve default instance
    db = modules.getFirestore(app)
  }

  cachedContext = {
    app,
    auth,
    db,
    googleProvider,
    modules,
  }

  return cachedContext
}

/**
 * For testing and cleanup purposes.
 */
export function resetFirebaseContext(): void {
  cachedContext = null
}
