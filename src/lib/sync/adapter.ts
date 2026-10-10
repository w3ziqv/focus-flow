/**
 * Focus Flow — Cloud Sync Storage Adapter & Reconciler (Stage 6 / Milestone v2.6)
 *
 * ADR-005 (Local-First Data Sovereignty) & ADR-009 (Opt-in Cloud Sync)
 *
 * Implements bi-directional, deterministic, zero-friction synchronization
 * with Google Identity & Cloud Firestore.
 */

import type {
  InterfacePrefs,
  SessionLogEntryV2,
  Settings,
  SoundPreferences,
  StatsV2,
} from '../../types'
import {
  isStats,
  sanitizeSessionEntry,
  DEFAULT_SETTINGS,
  DEFAULT_INTERFACE,
  DEFAULT_GOAL_SETTINGS,
  saveGoals,
  DEFAULT_SOUND_PREFERENCES,
  loadCloudSyncState,
  loadInterface,
  loadGoals,
  loadLastSyncedUid,
  loadLastSyncedProjectId,
  loadSessions,
  loadSession,
  loadSettings,
  loadSoundPreferences,
  loadStats,
  loadTombstones,
  saveCloudSyncState,
  saveInterface,
  saveLastSyncedUid,
  saveLastSyncedProjectId,
  saveSessions,
  saveSession,
  saveSettings,
  saveSoundPreferences,
  saveStats,
  saveTombstones,
  weekStartOf,
} from '../storage'
import { detectPlatform } from '../platform'
import { getPersistence } from '../desktop/runtime'
import { applyRemote, isRemoteWrite, readOutbox, acknowledgeOutbox, clearOutbox } from './outbox'
import { historyDays, mergeDailyHistory } from './history'
import { nativeInvoke } from '../desktop/runtime'
import { getFirebaseConfig, initFirebase, LEGACY_FIREBASE_PROJECT_ID, type FirebaseContext } from './firebase'
import { mergeSessions } from './merge'
import { syncErrorCode } from './errors'
import type {
  AccountSwitchChoice,
  AccountSwitchEvent,
  AuthState,
  CloudInterfaceDocument,
  CloudSettingsDocument,
  CloudSoundPrefsDocument,
  CloudSyncMetadataDocument,
  CloudSyncState,
  CloudUser,
  SessionTombstone,
  SyncState,
  SyncStatus,
  SyncStorageAdapter,
} from './types'

export const SCHEMA_VERSION: number = 2
export const MAX_SYNC_SESSIONS: number = 1000
// At most three rule document-access calls per session (deletion + privacy).
// Six writes fit the 20-call batch limit without assuming a shared read cache.
// Other write batches stay capped at 400.
export const MAX_SESSION_BATCH_WRITES = 6

function sanitizeFirestorePayload<T extends Record<string, unknown>>(data: T): T {
  const clean: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      clean[key] = val
    }
  }
  return clean as T
}

export class CloudSyncAdapterImpl implements SyncStorageAdapter {
  private authState: AuthState = { status: 'unauthenticated' }
  private syncStatus: SyncStatus = 'offline'
  private lastSyncedAt: string | null = null
  private syncError: string | null = null

  private readonly syncListeners = new Set<(status: SyncStatus) => void>()
  private readonly authListeners = new Set<(state: AuthState) => void>()
  private readonly stateListeners = new Set<(state: CloudSyncState) => void>()

  private authEpoch = 0
  private inFlight: Promise<void> | null = null
  private syncDeadlineTouch: (() => void) | null = null
  private backgroundCleanup: (() => void) | null = null
  private remoteRevisions: Record<string, string> = {}

  private firebaseCtx: FirebaseContext | null = null
  private unsubscribeAuth: (() => void) | null = null
  private unsubscribeSessions: (() => void) | null = null

  constructor() {
    // Restore cached sync state if available, but DO NOT fetch firebase yet (cold-boot invariant)
    const cached = loadCloudSyncState()
    if (cached?.uid) {
      if ((cached.firebaseProjectId ?? LEGACY_FIREBASE_PROJECT_ID) !== getFirebaseConfig().projectId) {
        // A Vercel backend change must not restore another project's identity/error.
        // Keep history, settings, previous owner and the upload queue for consent.
        saveCloudSyncState(null)
        this.syncStatus = 'error'
        this.syncError = 'cloud-backend-changed'
        return
      }
      this.lastSyncedAt = cached.lastSyncedAt
      this.authState = {
        status: 'authenticated',
        user: {
          uid: cached.uid,
          email: cached.email,
          displayName: cached.displayName,
          photoURL: cached.photoURL,
        },
      }
      this.syncStatus = cached.status === 'error' ? 'error' : 'synced'
      this.syncError = cached.status === 'error' ? syncErrorCode(cached.error) : null
    }
  }

  async getAvailability(): Promise<{configured: boolean; persistent: boolean}> {
    if (detectPlatform() === 'tauri') return nativeInvoke('cloud_status')
    const config = getFirebaseConfig()
    if (config.apiKey && config.appId && this.authState.status === 'authenticated') {
      const epoch = this.authEpoch
      const user = this.authState.user
      try {
        await this.validateRestoredAuth(await this.getFirebase(), epoch, user.uid)
      } catch (failure) {
        // Reconnection remains available when the cached login has expired.
        if (!['unauthenticated', 'cloud-account-mismatch', 'cloud-account-changed'].includes(syncErrorCode(failure))) throw failure
      }
    }
    return {configured: !!config.apiKey && !!config.appId, persistent: true}
  }

  // --- State Getters ---

  getAuthState(): AuthState {
    return this.authState
  }

  getSyncStatus(): SyncStatus {
    return this.syncStatus
  }

  getSyncState(): SyncState {
    return {
      status: this.syncStatus,
      lastSyncedAt: this.lastSyncedAt,
      errorMessage: this.syncError,
      error: this.syncError,
    }
  }

  getDetailedSyncState(): CloudSyncState {
    const user = this.authState.status === 'authenticated' ? this.authState.user : null
    let status: CloudSyncState['status'] = 'disconnected'
    if (this.syncStatus === 'syncing') status = 'syncing'
    else if (this.syncStatus === 'error') status = 'error'
    else if (user) status = 'synced'

    return {
      status,
      firebaseProjectId: getFirebaseConfig().projectId,
      uid: user?.uid ?? null,
      email: user?.email ?? null,
      displayName: user?.displayName ?? null,
      photoURL: user?.photoURL ?? null,
      lastSyncedAt: this.lastSyncedAt,
      error: this.syncError,
      pendingChanges: Object.keys(readOutbox().changed).length,
    }
  }

  getLastSyncedUid(): string | null {
    return loadLastSyncedUid()
  }

  // --- Subscriptions ---

  onSyncStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.syncListeners.add(callback)
    return () => this.syncListeners.delete(callback)
  }

  onAuthStateChange(callback: (state: AuthState) => void): () => void {
    this.authListeners.add(callback)
    return () => this.authListeners.delete(callback)
  }

  onStateChange(callback: (state: CloudSyncState) => void): () => void {
    this.stateListeners.add(callback)
    return () => this.stateListeners.delete(callback)
  }

  private setSyncStatus(status: SyncStatus, error: unknown = null): void {
    this.syncStatus = status
    this.syncError = error === null ? null : syncErrorCode(error)
    this.notifySyncListeners()
  }

  private setAuthState(state: AuthState): void {
    this.authState = state
    this.notifyAuthListeners()
  }

  private notifySyncListeners(): void {
    const status = this.syncStatus
    for (const listener of this.syncListeners) {
      try {
        listener(status)
      } catch {
        // Safe dispatch
      }
    }
    this.persistCurrentState()
  }

  private notifyAuthListeners(): void {
    const state = this.authState
    for (const listener of this.authListeners) {
      try {
        listener(state)
      } catch {
        // Safe dispatch
      }
    }
    this.persistCurrentState()
  }

  private persistCurrentState(): void {
    const detailed = this.getDetailedSyncState()
    saveCloudSyncState(detailed)
    for (const listener of this.stateListeners) {
      try {
        listener(detailed)
      } catch {
        // Safe dispatch
      }
    }
  }

  // --- Firebase Lazy Context ---

  private async getFirebase(): Promise<FirebaseContext> {
    if (!this.firebaseCtx) {
      this.firebaseCtx = detectPlatform() === 'tauri' ? await (await import('./nativeFirebase')).createNativeFirebaseContext() : await initFirebase()
    }
    return this.firebaseCtx
  }

  // --- Authentication Flows ---

  async signInWithGoogle(
    consentResolver?: (event: AccountSwitchEvent) => Promise<AccountSwitchChoice>,
  ): Promise<CloudUser> {
    this.authEpoch++
    if (this.inFlight) await this.inFlight.catch(() => {})
    this.setAuthState({ status: 'authenticating' })
    this.setSyncStatus('syncing')

    try {
      const { auth, googleProvider, modules } = await this.getFirebase()
      const result = await modules.signInWithPopup(auth, googleProvider)
      const user = result.user

      const previousUid = loadLastSyncedUid()
      const projectId = getFirebaseConfig().projectId
      const previousProjectId = loadLastSyncedProjectId() ?? LEGACY_FIREBASE_PROJECT_ID
      const ownerChanged = previousUid !== user.uid || previousProjectId !== projectId
      if (previousUid && ownerChanged) {
        if (!consentResolver) { await modules.signOut(auth); throw new Error('account-switch-consent-required') }
        let choice: AccountSwitchChoice = 'replace-local'
        if (consentResolver) {
          choice = await consentResolver({ previousUid, newUid: user.uid })
        }
        if (choice === 'cancel') { await modules.signOut(auth); throw new Error('account-switch-cancelled') }
        const backupOwner = previousProjectId === projectId ? previousUid : `${encodeURIComponent(previousProjectId)}_${previousUid}`
        getPersistence().setItem(`ff3_account_backup_${backupOwner}`, JSON.stringify({session: loadSession(), sessions: loadSessions(), tombstones: loadTombstones(), stats: loadStats(), settings: loadSettings(), sound: loadSoundPreferences(), interface: loadInterface(), outbox: readOutbox()}))
        if (choice === 'replace-local') {
          clearOutbox()
          applyRemote(() => {
          saveSettings(DEFAULT_SETTINGS)
          saveSoundPreferences(DEFAULT_SOUND_PREFERENCES)
          saveInterface(DEFAULT_INTERFACE)
          saveGoals(DEFAULT_GOAL_SETTINGS)
          saveSessions([])
          saveTombstones([])
          saveStats({minutes: 0, today: 0, week: 0, streak: 0, history: {}, goals: DEFAULT_GOAL_SETTINGS, milestones: [], date: new Date().toDateString(), weekStart: '', lastDate: null})
          const active = loadSession()
          if (active) saveSession({...active, task: '', taskDone: false, checklist: []})
          })
        }
      }
      if (ownerChanged) this.lastSyncedAt = null
      saveLastSyncedUid(user.uid)
      saveLastSyncedProjectId(projectId)

      const cloudUser: CloudUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      }

      this.setAuthState({ status: 'authenticated', user: cloudUser })
      this.setupAuthListener()

      // Initial reconciliation on login
      await this.syncAll()

      return cloudUser
    } catch (err) {
      const message = syncErrorCode(err)
      if (this.authState.status !== 'authenticated') this.setAuthState({ status: 'error', error: message })
      this.setSyncStatus('error', err)
      throw err
    }
  }

  async signOut(): Promise<void> {
    this.authEpoch++
    try {
      if (this.firebaseCtx) {
        await this.firebaseCtx.modules.signOut(this.firebaseCtx.auth)
      } else if (detectPlatform() === 'tauri') {
        // A restored login can be disconnected before the lazy transport loads.
        await nativeInvoke('cloud_sign_out')
      }
    } catch (failure) {
      this.setSyncStatus('error', failure)
      throw failure
    }
    {
      if (this.unsubscribeSessions) {
        this.unsubscribeSessions()
        this.unsubscribeSessions = null
      }
      this.setAuthState({ status: 'unauthenticated' })
      this.setSyncStatus('offline')
      saveCloudSyncState(null)
    }
  }

  private setupAuthListener(): void {
    if (this.unsubscribeAuth || !this.firebaseCtx) return

    const { auth, modules } = this.firebaseCtx
    this.unsubscribeAuth = modules.onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser && this.authState.status === 'authenticated') {
        this.setAuthState({ status: 'unauthenticated' })
        this.setSyncStatus('offline')
      }
    })
  }

  // --- Bounded Session Pull / Push ---

  async pullSessions(): Promise<SessionLogEntryV2[]> {
    const user = this.ensureAuthenticatedUser()
    const { db, modules } = await this.getFirebase()

    const sessionsCol = modules.collection(db, 'users', user.uid, 'sessions')
    const q = modules.query(sessionsCol, modules.orderBy('date', 'desc'), modules.limit(MAX_SYNC_SESSIONS))
    const snapshot = await this.cloudRequest(modules.getDocs(q))

    const remoteSessions: SessionLogEntryV2[] = []
    snapshot.forEach((docSnap) => {
      const validated = sanitizeSessionEntry(docSnap.data())
      if (validated && validated.id === docSnap.id && validated.minutes <= 120) remoteSessions.push(validated)
    })

    return remoteSessions
  }

  async pushSessions(sessions: SessionLogEntryV2[]): Promise<void> {
    const epoch = this.authEpoch
    const user = this.ensureAuthenticatedUser()
    const { db, modules } = await this.getFirebase()
    const prefs = loadInterface()
    const maskTask = prefs.maskTaskTitlesInCloud === true

    let batch = modules.writeBatch(db)
    let batchSize = 0

    for (const session of sessions) {
      this.assertAccount(epoch, user.uid)
      const docRef = modules.doc(db, 'users', user.uid, 'sessions', session.id)
      const rawDoc: Record<string, unknown> = {
        id: session.id,
        date: session.date,
        minutes: session.minutes,
        task: maskTask ? null : session.task ?? null,
        updatedLocallyAt: session.updatedLocallyAt ?? session.date,
        schemaVersion: SCHEMA_VERSION,
      }
      rawDoc.checklist = maskTask ? [] : session.checklist ?? []
      if (!maskTask && Array.isArray(session.checklist) && session.checklist.length > 0) {
        rawDoc.checklist = session.checklist
      }
      batch.set(docRef, sanitizeFirestorePayload(rawDoc))
      if (++batchSize === MAX_SESSION_BATCH_WRITES) { await this.cloudRequest(batch.commit()); batch = modules.writeBatch(db); batchSize = 0 }
    }

    if (batchSize > 0) {this.assertAccount(epoch, user.uid); await this.cloudRequest(batch.commit())}
  }

  async pushSession(session: SessionLogEntryV2): Promise<void> {
    const user = this.ensureAuthenticatedUser()
    const { db, modules } = await this.getFirebase()
    const prefs = loadInterface()
    const maskTask = prefs.maskTaskTitlesInCloud === true

    const docRef = modules.doc(db, 'users', user.uid, 'sessions', session.id)
    const rawDoc: Record<string, unknown> = {
      id: session.id,
      date: session.date,
      minutes: session.minutes,
      task: maskTask ? null : session.task ?? null,
      updatedLocallyAt: session.updatedLocallyAt ?? session.date,
      schemaVersion: SCHEMA_VERSION,
    }
    if (!maskTask && Array.isArray(session.checklist) && session.checklist.length > 0) {
      rawDoc.checklist = session.checklist
    }

    rawDoc.checklist = maskTask ? [] : session.checklist ?? []
    await this.cloudRequest(modules.setDoc(docRef, sanitizeFirestorePayload(rawDoc)))
  }

  private async pullCollection(name: string): Promise<Record<string, unknown>[]> {
    const epoch = this.authEpoch
    const user = this.ensureAuthenticatedUser()
    const {db, modules} = await this.getFirebase()
    const collection = modules.collection(db, 'users', user.uid, name)
    const rows: Record<string, unknown>[] = []
    let cursor: import('firebase/firestore').QueryDocumentSnapshot | undefined
    while (true) {
      const constraints: import('firebase/firestore').QueryConstraint[] = [modules.orderBy(modules.documentId()), modules.limit(400)]
      if (cursor) constraints.push(modules.startAfter(cursor))
      const page = await this.cloudRequest(modules.getDocs(modules.query(collection, ...constraints)))
      this.assertAccount(epoch, user.uid)
      rows.push(...page.docs.map(doc => ({...doc.data(), _documentId: doc.id})))
      if (page.docs.length < 400) break
      cursor = page.docs.at(-1)
    }
    return rows
  }

  async applyPrivacy(mask: boolean): Promise<void> {
    const owner = this.ensureAuthenticatedUser().uid
    const epoch = this.authEpoch
    // Full replacements erase previously uploaded checklist fields, including older sessions.
    const rows = await this.pullCollection('sessions')
    this.assertAccount(epoch, owner)
    const remote = rows.flatMap(row => { const session = sanitizeSessionEntry(row); return session ? [session] : [] })
    const local = new Map(loadSessions().map(entry => [entry.id, entry]))
    await this.pushSessions(remote.map(entry => mask ? {...entry, task: null, checklist: []} : local.get(entry.id) ?? entry))
  }

  async deleteRemoteSession(sessionId: string): Promise<void> {
    const user = this.ensureAuthenticatedUser()
    const { db, modules } = await this.getFirebase()
    const docRef = modules.doc(db, 'users', user.uid, 'sessions', sessionId)
    await this.cloudRequest(modules.deleteDoc(docRef))
  }

  // --- Permanent deletion records ---

  async pullTombstones(): Promise<SessionTombstone[]> {
    const rows = await this.pullCollection('tombstones')

    const remoteTombstones: SessionTombstone[] = []
    rows.forEach((row) => {
      const data = row as unknown as SessionTombstone
      if (data && typeof data.id === 'string' && typeof data.deletedAt === 'string') {
        remoteTombstones.push({ id: data.id, deletedAt: data.deletedAt })
      }
    })

    return remoteTombstones
  }

  async pushTombstone(tombstone: SessionTombstone): Promise<void> {
    const user = this.ensureAuthenticatedUser()
    const { db, modules } = await this.getFirebase()
    const docRef = modules.doc(db, 'users', user.uid, 'tombstones', tombstone.id)
    const batch = modules.writeBatch(db)
    batch.set(docRef, tombstone)
    batch.delete(modules.doc(db, 'users', user.uid, 'sessions', tombstone.id))
    await this.cloudRequest(batch.commit())
  }

  // --- Singleton Subcollections: Settings, Stats, Sound, Interface, Metadata ---

  async pullSettings(): Promise<Settings | null> {
    const user = this.ensureAuthenticatedUser()
    const { db, modules } = await this.getFirebase()
    const docRef = modules.doc(db, 'users', user.uid, 'settings', 'current')
    const snap = await this.cloudRequest(modules.getDoc(docRef))
    if (!snap.exists()) return null

    // SAFETY: Document conforms to CloudSettingsDocument
    const d = snap.data() as unknown as CloudSettingsDocument
    this.remoteRevisions.ff2_settings = d.updatedLocallyAt ?? ''
    return {
      focus: d.focus ?? DEFAULT_SETTINGS.focus,
      short: d.short ?? d.shortBreak ?? DEFAULT_SETTINGS.short,
      long: d.long ?? d.longBreak ?? DEFAULT_SETTINGS.long,
      rounds: d.rounds ?? DEFAULT_SETTINGS.rounds,
      autoStart: d.autoStart ?? DEFAULT_SETTINGS.autoStart,
    }
  }

  async pushSettings(settings: Settings): Promise<void> {
    const user = this.ensureAuthenticatedUser()
    const { db, modules } = await this.getFirebase()
    const docRef = modules.doc(db, 'users', user.uid, 'settings', 'current')
    const cloudDoc: CloudSettingsDocument = {
      focus: settings.focus,
      short: settings.short,
      long: settings.long,
      rounds: settings.rounds,
      autoStart: settings.autoStart,
      updatedLocallyAt: readOutbox().changed.ff2_settings ?? new Date().toISOString(),
      schemaVersion: SCHEMA_VERSION,
    }
    await this.cloudRequest(modules.setDoc(docRef, cloudDoc))
  }

  async pullStats(): Promise<StatsV2 | null> {
    const user = this.ensureAuthenticatedUser()
    const { db, modules } = await this.getFirebase()
    const docRef = modules.doc(db, 'users', user.uid, 'stats', 'summary')
    const snap = await this.cloudRequest(modules.getDoc(docRef))
    if (!snap.exists()) return null

    const stats = isStats(snap.data())
    if (!stats) return null
    const daily = await this.pullCollection('daily_history')
    const history = {...stats.history}
    daily.forEach(day => {
      const d = day as { date?: unknown; minutes?: unknown }
      if (typeof d.date === 'string' && d.date === day._documentId && typeof d.minutes === 'number' && Number.isFinite(d.minutes) && d.minutes >= 0 && d.minutes <= 10_000_000 && historyDays({[d.date]: d.minutes}).length === 1) {
        const [year, month, date] = d.date.split('-').map(Number)
        history[new Date(year, month - 1, date).toDateString()] = d.minutes
      }
    })
    return {...stats, history}
  }

  async pushStats(stats: StatsV2): Promise<void> {
    const epoch = this.authEpoch
    const user = this.ensureAuthenticatedUser()
    const { db, modules } = await this.getFirebase()
    const docRef = modules.doc(db, 'users', user.uid, 'stats', 'summary')
    const rawDoc: Record<string, unknown> = {
      minutes: stats.minutes,
      today: stats.today,
      week: stats.week,
      streak: stats.streak,
      date: stats.date,
      weekStart: stats.weekStart,
      lastDate: stats.lastDate ?? null,
      milestones: stats.milestones ?? [],
      updatedLocallyAt: new Date().toISOString(),
      schemaVersion: SCHEMA_VERSION,
    }
    if (stats.goals !== undefined) {
      rawDoc.goals = stats.goals
    }
    const original = await this.cloudRequest(modules.getDoc(docRef))
    this.assertAccount(epoch, user.uid)
    if (original.exists() && (original.data() as Record<string, unknown>).history) {
      const key = `ff3_history_source_${user.uid}`
      if (!getPersistence().getItem(key)) getPersistence().setItem(key, JSON.stringify(original.data()))
    }
    await this.pushDailyHistory(stats.history)
    rawDoc.schemaVersion = 3
    await this.cloudRequest(modules.setDoc(docRef, sanitizeFirestorePayload(rawDoc)))
  }

  private async pushDailyHistory(history: Record<string, number>): Promise<void> {
    const user = this.ensureAuthenticatedUser()
    const { db, modules } = await this.getFirebase()
    let batch = modules.writeBatch(db)
    let size = 0
    for (const day of historyDays(history)) {
      batch.set(modules.doc(db, 'users', user.uid, 'daily_history', day.date), day)
      if (++size === 400) { await this.cloudRequest(batch.commit()); batch = modules.writeBatch(db); size = 0 }
    }
    if (size) await this.cloudRequest(batch.commit())
  }

  async pullSoundPrefs(): Promise<SoundPreferences | null> {
    const user = this.ensureAuthenticatedUser()
    const { db, modules } = await this.getFirebase()
    const docRef = modules.doc(db, 'users', user.uid, 'sound_prefs', 'current')
    const snap = await this.cloudRequest(modules.getDoc(docRef))
    if (!snap.exists()) return null

    // SAFETY: Document conforms to CloudSoundPrefsDocument
    const d = snap.data() as unknown as CloudSoundPrefsDocument
    this.remoteRevisions.ff2_sound_prefs = d.updatedLocallyAt ?? ''
    return {
      baseTexture: (d.baseTexture as SoundPreferences['baseTexture']) ?? DEFAULT_SOUND_PREFERENCES.baseTexture,
      binauralMode: (d.binauralMode as SoundPreferences['binauralMode']) ?? DEFAULT_SOUND_PREFERENCES.binauralMode,
      toneWarmthCutoff: d.toneWarmthCutoff ?? DEFAULT_SOUND_PREFERENCES.toneWarmthCutoff,
      volume: d.volume ?? DEFAULT_SOUND_PREFERENCES.volume,
    }
  }

  async pushSoundPrefs(prefs: SoundPreferences): Promise<void> {
    const user = this.ensureAuthenticatedUser()
    const { db, modules } = await this.getFirebase()
    const docRef = modules.doc(db, 'users', user.uid, 'sound_prefs', 'current')
    const cloudDoc: CloudSoundPrefsDocument = {
      baseTexture: prefs.baseTexture,
      binauralMode: prefs.binauralMode,
      toneWarmthCutoff: prefs.toneWarmthCutoff,
      volume: prefs.volume,
      updatedLocallyAt: readOutbox().changed.ff2_sound_prefs ?? new Date().toISOString(),
    }
    await this.cloudRequest(modules.setDoc(docRef, cloudDoc))
  }

  async pullInterface(): Promise<Partial<InterfacePrefs> | null> {
    const user = this.ensureAuthenticatedUser()
    const { db, modules } = await this.getFirebase()
    const docRef = modules.doc(db, 'users', user.uid, 'interface', 'current')
    const snap = await this.cloudRequest(modules.getDoc(docRef))
    if (!snap.exists()) return null

    // SAFETY: Document conforms to CloudInterfaceDocument
    const d = snap.data() as unknown as CloudInterfaceDocument
    this.remoteRevisions.ff2_interface = d.updatedLocallyAt ?? ''
    return {
      maskTaskTitlesInCloud: d.maskTaskTitlesInCloud,
    }
  }

  async pushInterface(prefs: InterfacePrefs): Promise<void> {
    const user = this.ensureAuthenticatedUser()
    const { db, modules } = await this.getFirebase()
    const docRef = modules.doc(db, 'users', user.uid, 'interface', 'current')
    const cloudDoc: CloudInterfaceDocument = {
      maskTaskTitlesInCloud: prefs.maskTaskTitlesInCloud ?? false,
      updatedLocallyAt: readOutbox().changed.ff2_interface ?? new Date().toISOString(),
    }
    await this.cloudRequest(modules.setDoc(docRef, cloudDoc))
  }

  async pushSyncMetadata(): Promise<void> {
    const user = this.ensureAuthenticatedUser()
    const { db, modules } = await this.getFirebase()
    const docRef = modules.doc(db, 'users', user.uid, 'metadata', 'sync')
    const cloudDoc: CloudSyncMetadataDocument = {
      lastSyncedAt: new Date().toISOString(),
      schemaVersion: SCHEMA_VERSION,
      clientPlatform: typeof navigator !== 'undefined' ? navigator.userAgent : 'node',
    }
    await this.cloudRequest(modules.setDoc(docRef, cloudDoc))
  }

  // --- Reconciliation & Full Sync ---

  async reconcileSessions(localSessions: SessionLogEntryV2[], epoch: number = this.authEpoch): Promise<SessionLogEntryV2[]> {
    const owner = this.ensureAuthenticatedUser().uid
    const [remoteSessions, remoteTombstones] = await Promise.all([
      this.pullCollection('sessions').then(rows => rows.flatMap(row => {const session = sanitizeSessionEntry(row); return session && session.id === row._documentId && session.minutes <= 120 ? [session] : []})),
      this.pullTombstones(),
    ])

    this.assertAccount(epoch, owner)
    const localTombstones = loadTombstones()
    // Unify tombstones
    const tombstoneMap = new Map<string, SessionTombstone>()
    for (const t of [...localTombstones, ...remoteTombstones]) {
      tombstoneMap.set(t.id, t)
    }
    const allTombstones = Array.from(tombstoneMap.values())
    applyRemote(() => saveTombstones(allTombstones))

    this.assertAccount(epoch, owner)
    // Push local tombstones not yet in remote
    for (const t of localTombstones) {
      if (!remoteTombstones.some((rt) => rt.id === t.id)) {
        this.assertAccount(epoch, owner)
        await this.pushTombstone(t)
      }
    }

    const remoteStats = await this.pullStats()
    this.assertAccount(epoch, owner)
    const oldStats = loadStats()
    const effectiveLocal = mergeSessions(localSessions, mergeSessions(loadSessions(), Object.values(readOutbox().sessions), [], Infinity), [], Infinity)
    const preservedHistory = mergeDailyHistory(oldStats.history, remoteStats?.history ?? {}, effectiveLocal, remoteSessions)

    // Merge sessions deterministically with tombstone filtration
    let merged = mergeSessions(effectiveLocal, remoteSessions, allTombstones, Infinity)
    if (loadInterface().maskTaskTitlesInCloud) {
      const privateContent = new Map(effectiveLocal.map(session => [session.id, session]))
      merged = merged.map(session => {
        const local = privateContent.get(session.id)
        return local ? {...session, task: local.task, checklist: local.checklist} : session
      })
    }

    // Save unified sessions locally
    applyRemote(() => saveSessions(merged))

    // Push local-only sessions to remote
    const remoteById = new Map(remoteSessions.map(s => [s.id, s]))
    const masked = loadInterface().maskTaskTitlesInCloud === true
    const comparable = (s: SessionLogEntryV2, outgoing: boolean) => JSON.stringify([s.id, s.date, s.minutes, outgoing && masked ? null : s.task ?? null, outgoing && masked ? [] : s.checklist ?? [], s.updatedLocallyAt ?? s.date])
    const sessionsToPush = merged.filter(s => {const remote = remoteById.get(s.id); return !remote || comparable(s, true) !== comparable(remote, false)})
    if (sessionsToPush.length > 0) {
      await this.pushSessions(sessionsToPush)
    }

    this.assertAccount(epoch, owner)
    if (remoteStats?.goals && !readOutbox().changed.ff2_goals) {
      applyRemote(() => {saveStats({...loadStats(), goals: remoteStats.goals}); saveGoals(remoteStats.goals!)})
    }
    if (remoteStats?.milestones) {
      const milestones = new Map((loadStats().milestones ?? []).map(record => [record.id, record]))
      for (const record of remoteStats.milestones) {
        const local = milestones.get(record.id)
        milestones.set(record.id, local ? {...record, unlockedAt: local.unlockedAt < record.unlockedAt ? local.unlockedAt : record.unlockedAt, seen: local.seen || record.seen} : record)
      }
      applyRemote(() => saveStats({...loadStats(), milestones: [...milestones.values()]}))
    }

    // Recompute stats to avoid counter drift
    this.recalculateStatsFromSessions(merged, preservedHistory)
    await this.pushStats(loadStats())

    return merged.slice(0, MAX_SYNC_SESSIONS)
  }

  syncAll(): Promise<void> {
    if (this.inFlight) return this.inFlight
    const epoch = this.authEpoch
    let timeout: ReturnType<typeof setTimeout>
    const deadline = new Promise<never>((_, reject) => {
      this.syncDeadlineTouch = () => {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          if (this.authEpoch === epoch) {this.authEpoch++; this.setSyncStatus('error', 'cloud-timeout')}
          reject(new Error('cloud-timeout'))
        }, 60_000)
      }
      this.syncDeadlineTouch()
    })
    this.inFlight = Promise.race([this.performSyncAll(epoch), deadline]).finally(() => {clearTimeout(timeout); this.syncDeadlineTouch = null; this.inFlight = null})
    return this.inFlight
  }

  private async performSyncAll(epoch: number): Promise<void> {
    this.setSyncStatus('syncing')
    try {
      const user = this.ensureAuthenticatedUser()
      const context = await this.getFirebase()
      await this.validateRestoredAuth(context, epoch, user.uid)
      this.assertAccount(epoch, user.uid)
      if (!navigator.onLine) throw new Error('cloud-offline')
      const outbox = readOutbox()
      const settingsAtStart = loadSettings()
      const soundAtStart = loadSoundPreferences()
      const interfaceAtStart = loadInterface()
      const remoteInterface = await this.pullInterface()
      this.assertAccount(epoch, user.uid)
      if (remoteInterface?.maskTaskTitlesInCloud !== undefined && (outbox.changed.ff2_interface ?? '') <= (this.remoteRevisions.ff2_interface ?? '')) {
        interfaceAtStart.maskTaskTitlesInCloud = remoteInterface.maskTaskTitlesInCloud
        if (readOutbox().changed.ff2_interface === outbox.changed.ff2_interface) applyRemote(() => saveInterface(interfaceAtStart))
      } else {
        await this.pushInterface(interfaceAtStart)
      }
      const localSessions = mergeSessions(loadSessions(), Object.values(outbox.sessions), [], Infinity)
      await this.reconcileSessions(localSessions, epoch)
      this.assertAccount(epoch, user.uid)

      // Sync settings
      const localSettings = settingsAtStart
      const remoteSettings = await this.pullSettings()
      this.assertAccount(epoch, user.uid)
      if (!remoteSettings || (outbox.changed.ff2_settings ?? '') > (this.remoteRevisions.ff2_settings ?? '')) {
        await this.pushSettings(localSettings)
      } else {
        if (readOutbox().changed.ff2_settings === outbox.changed.ff2_settings) applyRemote(() => saveSettings(remoteSettings))
      }

      // Sync sound preferences
      const localSound = soundAtStart
      const remoteSound = await this.pullSoundPrefs()
      this.assertAccount(epoch, user.uid)
      if (!remoteSound || (outbox.changed.ff2_sound_prefs ?? '') > (this.remoteRevisions.ff2_sound_prefs ?? '')) {
        await this.pushSoundPrefs(localSound)
      } else {
        if (readOutbox().changed.ff2_sound_prefs === outbox.changed.ff2_sound_prefs) applyRemote(() => saveSoundPreferences(remoteSound))
      }

      // Update sync metadata
      if (Object.keys(outbox.changed).length || !this.lastSyncedAt) await this.pushSyncMetadata()

      const maskKey = `ff3_mask_verified_${this.ensureAuthenticatedUser().uid}`
      if (interfaceAtStart.maskTaskTitlesInCloud && (outbox.changed.ff2_interface || !getPersistence().getItem(maskKey))) {
        await this.applyPrivacy(true)
        getPersistence().setItem(maskKey, '3')
      } else if (!interfaceAtStart.maskTaskTitlesInCloud) getPersistence().removeItem(maskKey)
      this.assertAccount(epoch, user.uid)
      acknowledgeOutbox(outbox.revision)
      this.lastSyncedAt = new Date().toISOString()
      this.setSyncStatus('synced')
    } catch (err) {
      if (epoch === this.authEpoch) this.setSyncStatus('error', err)
      throw err
    }
  }

  // --- GDPR Art. 17 Complete Erasure ---

  async purgeCloudData(): Promise<void> {
    const epoch = this.authEpoch
    const user = this.ensureAuthenticatedUser()
    const { db, auth, modules } = await this.getFirebase()

    this.setSyncStatus('syncing')

    try {
      const subcollections = ['sessions', 'tombstones', 'settings', 'stats', 'sound_prefs', 'interface', 'metadata', 'daily_history']

      for (const sub of subcollections) {
        const colRef = modules.collection(db, 'users', user.uid, sub)
        // Bound reads to the security rules and writes below Firestore's 500-operation limit.
        while (true) {
          const snap = await this.cloudRequest(modules.getDocs(modules.query(colRef, modules.limit(400))))
          this.assertAccount(epoch, user.uid)
          if (snap.docs.length === 0) break
          const batch = modules.writeBatch(db)
          snap.forEach((docSnap) => { batch.delete(docSnap.ref) })
          await this.cloudRequest(batch.commit())
        }
      }

      this.assertAccount(epoch, user.uid)
      // Attempt to delete user identity if current auth matches
      if (auth.currentUser && auth.currentUser.uid === user.uid) {
        try {
          await modules.deleteUser(auth.currentUser)
        } catch {
          // If requires recent login, sign out cleanly
          await modules.signOut(auth)
        }
      }

      saveLastSyncedUid(null)
      saveLastSyncedProjectId(null)
      await this.signOut()
    } catch (err) {
      this.setSyncStatus('error', err)
      throw err
    }
  }

  // --- Internal Helpers ---

  private async validateRestoredAuth(context: FirebaseContext, epoch: number, uid: string): Promise<void> {
    if (typeof context.auth.authStateReady === 'function') await context.auth.authStateReady()
    this.assertAccount(epoch, uid)
    if (context.auth.currentUser?.uid === uid) return
    const code = context.auth.currentUser ? 'cloud-account-mismatch' : 'unauthenticated'
    // Reject the cache before issuing any Firestore request. Preserve local data.
    this.authEpoch++
    this.setAuthState({status: 'unauthenticated'})
    this.setSyncStatus('error', code)
    throw new Error(code)
  }

  private async cloudRequest<T>(operation: Promise<T>): Promise<T> {
    const epoch = this.authEpoch
    const result = await operation
    if (epoch !== this.authEpoch) throw new Error('cloud-account-changed')
    // A large history can take longer than a minute while still making progress.
    this.syncDeadlineTouch?.()
    return result
  }

  private assertAccount(epoch: number, uid: string): void {
    if (epoch !== this.authEpoch || this.authState.status !== 'authenticated' || this.authState.user.uid !== uid) throw new Error('cloud-account-changed')
  }

  private ensureAuthenticatedUser(): CloudUser {
    if (this.authState.status !== 'authenticated' || !this.authState.user) {
      throw new Error('Operation requires authenticated user')
    }
    return this.authState.user
  }

  private recalculateStatsFromSessions(sessions: SessionLogEntryV2[], archivedHistory: Record<string, number> = {}): void {
    const currentStats = loadStats()
    const todayStr = new Date().toDateString()

    let allMinutes = 0
    let todaySessions = 0
    let weekSessions = 0
    const historyMap: Record<string, number> = {...archivedHistory}

    for (const s of sessions) {
      const sessionDate = new Date(s.date)
      const dayKey = !Number.isNaN(sessionDate.getTime()) ? sessionDate.toDateString() : s.date
      const mins = s.minutes

      if (weekStartOf(sessionDate) === weekStartOf()) weekSessions += 1
      allMinutes += mins
      historyMap[dayKey] = (historyMap[dayKey] ?? 0) + mins

      if (dayKey === todayStr) {
        todaySessions += 1
      }
    }

    const activeDays = new Set(Object.entries(historyMap).filter(([, minutes]) => minutes > 0).map(([day]) => day))
    const lastDate = [...activeDays].sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null
    const day = new Date()
    if (!activeDays.has(day.toDateString())) day.setDate(day.getDate() - 1)
    let streak = 0
    while (activeDays.has(day.toDateString())) {streak++; day.setDate(day.getDate() - 1)}

    const updatedStats: StatsV2 = {
      ...currentStats,
      goals: loadGoals(),
      minutes: Math.max(allMinutes, Object.values(historyMap).reduce((sum, n) => sum + n, 0)),
      today: todaySessions,
      week: weekSessions,
      streak,
      lastDate,
      date: todayStr,
      weekStart: weekStartOf(),
      history: historyMap,
    }

    applyRemote(() => saveStats(updatedStats))

  }

  startBackground(): () => void {
    if (this.backgroundCleanup) return this.backgroundCleanup
    let timer: ReturnType<typeof setTimeout> | undefined
    const schedule = () => {
      this.persistCurrentState()
      if (this.authState.status !== 'authenticated' || !navigator.onLine) return
      clearTimeout(timer)
      timer = setTimeout(() => {void this.syncAll().then(() => {if (Object.keys(readOutbox().changed).length) schedule()}).catch(() => {})}, 750)
    }
    const changed = (event: Event) => {
      if (isRemoteWrite()) return
      if (Object.keys(readOutbox().changed).includes(String((event as CustomEvent).detail))) schedule()
    }
    window.addEventListener('focus-flow:storage', changed)
    window.addEventListener('online', schedule)
    const poll = setInterval(() => {
      if (this.authState.status !== 'authenticated' || !navigator.onLine || document.hidden || this.inFlight) return
      const user = this.authState.user
      const epoch = this.authEpoch
      void this.getFirebase().then(async (context) => {
        await this.validateRestoredAuth(context, epoch, user.uid)
        const {db, modules} = context
        const snapshot = await this.cloudRequest(modules.getDoc(modules.doc(db, 'users', user.uid, 'metadata', 'sync')))
        const timestamp = snapshot.exists() ? snapshot.data().lastSyncedAt : null
        if (typeof timestamp === 'string' && timestamp > (this.lastSyncedAt ?? '')) schedule()
      }).catch(error => {if (epoch === this.authEpoch) this.setSyncStatus('error', error)})
    }, 60_000)
    // Restore only an explicitly connected account; anonymous startup stays offline.
    if (this.authState.status === 'authenticated') schedule()
    this.backgroundCleanup = () => {
      clearTimeout(timer)
      clearInterval(poll)
      window.removeEventListener('focus-flow:storage', changed)
      window.removeEventListener('online', schedule)
      this.backgroundCleanup = null
    }
    return this.backgroundCleanup
  }

  dispose(): void {
    this.backgroundCleanup?.()
    if (this.unsubscribeAuth) {
      this.unsubscribeAuth()
      this.unsubscribeAuth = null
    }
    if (this.unsubscribeSessions) {
      this.unsubscribeSessions()
      this.unsubscribeSessions = null
    }
    this.syncListeners.clear()
    this.authListeners.clear()
    this.stateListeners.clear()
  }
}

let adapterInstance: CloudSyncAdapterImpl | null = null

export function getCloudSyncAdapter(): CloudSyncAdapterImpl {
  if (!adapterInstance) {
    adapterInstance = new CloudSyncAdapterImpl()
  }
  return adapterInstance
}

export function resetCloudSyncAdapter(): void {
  if (adapterInstance) {
    adapterInstance.dispose()
    adapterInstance = null
  }
}
