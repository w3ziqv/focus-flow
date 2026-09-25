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
  DEFAULT_SETTINGS,
  DEFAULT_SOUND_PREFERENCES,
  loadCloudSyncState,
  loadInterface,
  loadLastSyncedUid,
  loadSessions,
  loadSettings,
  loadSoundPreferences,
  loadStats,
  loadTombstones,
  saveCloudSyncState,
  saveInterface,
  saveLastSyncedUid,
  saveSessions,
  saveSettings,
  saveSoundPreferences,
  saveStats,
  saveTombstones,
} from '../storage'
import { initFirebase, type FirebaseContext } from './firebase'
import { mergeSessions } from './merge'
import type {
  AccountSwitchChoice,
  AccountSwitchEvent,
  AuthState,
  CloudInterfaceDocument,
  CloudSessionDocument,
  CloudSettingsDocument,
  CloudSoundPrefsDocument,
  CloudStatsDocument,
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

  private firebaseCtx: FirebaseContext | null = null
  private unsubscribeAuth: (() => void) | null = null
  private unsubscribeSessions: (() => void) | null = null

  constructor() {
    // Restore cached sync state if available, but DO NOT fetch firebase yet (cold-boot invariant)
    const cached = loadCloudSyncState()
    if (cached?.uid) {
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
    }
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
      uid: user?.uid ?? null,
      email: user?.email ?? null,
      displayName: user?.displayName ?? null,
      photoURL: user?.photoURL ?? null,
      lastSyncedAt: this.lastSyncedAt,
      error: this.syncError,
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

  private setSyncStatus(status: SyncStatus, error: string | null = null): void {
    this.syncStatus = status
    this.syncError = error
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
      this.firebaseCtx = await initFirebase()
    }
    return this.firebaseCtx
  }

  // --- Authentication Flows ---

  async signInWithGoogle(
    consentResolver?: (event: AccountSwitchEvent) => Promise<AccountSwitchChoice>,
  ): Promise<CloudUser> {
    this.setAuthState({ status: 'authenticating' })
    this.setSyncStatus('syncing')

    try {
      const { auth, googleProvider, modules } = await this.getFirebase()
      const result = await modules.signInWithPopup(auth, googleProvider)
      const user = result.user

      const previousUid = loadLastSyncedUid()
      if (previousUid && previousUid !== user.uid && loadSessions().length > 0) {
        let choice: AccountSwitchChoice = 'merge'
        if (consentResolver) {
          choice = await consentResolver({ previousUid, newUid: user.uid })
        }
        if (choice === 'replace-local') {
          saveSessions([])
          saveTombstones([])
        }
      }
      saveLastSyncedUid(user.uid)

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
      console.error('[Focus Flow Sync Error]', err)
      const message = err instanceof Error ? err.message : 'Google authentication failed'
      this.setAuthState({ status: 'error', error: message })
      this.setSyncStatus('error', message)
      throw err
    }
  }

  async signOut(): Promise<void> {
    try {
      if (this.firebaseCtx) {
        await this.firebaseCtx.modules.signOut(this.firebaseCtx.auth)
      }
    } catch {
      // Disconnect locally regardless of remote failure
    } finally {
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
    const snapshot = await modules.getDocs(q)

    const remoteSessions: SessionLogEntryV2[] = []
    snapshot.forEach((docSnap) => {
      // SAFETY: docSnap.data() conforms to CloudSessionDocument schema
      const data = docSnap.data() as unknown as CloudSessionDocument
      if (data && typeof data.id === 'string' && typeof data.date === 'string' && typeof data.minutes === 'number') {
        remoteSessions.push({
          id: data.id,
          date: data.date,
          minutes: data.minutes,
          task: data.task ?? null,
          checklist: data.checklist,
        })
      }
    })

    return remoteSessions
  }

  async pushSessions(sessions: SessionLogEntryV2[]): Promise<void> {
    const user = this.ensureAuthenticatedUser()
    const { db, modules } = await this.getFirebase()
    const prefs = loadInterface()
    const maskTask = prefs.maskTaskTitlesInCloud === true

    const batch = modules.writeBatch(db)
    const nowIso = new Date().toISOString()

    for (const session of sessions.slice(0, MAX_SYNC_SESSIONS)) {
      const docRef = modules.doc(db, 'users', user.uid, 'sessions', session.id)
      const rawDoc: Record<string, unknown> = {
        id: session.id,
        date: session.date,
        minutes: session.minutes,
        task: maskTask ? null : session.task ?? null,
        updatedLocallyAt: nowIso,
        schemaVersion: SCHEMA_VERSION,
      }
      if (!maskTask && Array.isArray(session.checklist) && session.checklist.length > 0) {
        rawDoc.checklist = session.checklist
      }
      batch.set(docRef, sanitizeFirestorePayload(rawDoc), { merge: true })
    }

    await batch.commit()
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
      updatedLocallyAt: new Date().toISOString(),
      schemaVersion: SCHEMA_VERSION,
    }
    if (!maskTask && Array.isArray(session.checklist) && session.checklist.length > 0) {
      rawDoc.checklist = session.checklist
    }

    await modules.setDoc(docRef, sanitizeFirestorePayload(rawDoc), { merge: true })
  }

  async deleteRemoteSession(sessionId: string): Promise<void> {
    const user = this.ensureAuthenticatedUser()
    const { db, modules } = await this.getFirebase()
    const docRef = modules.doc(db, 'users', user.uid, 'sessions', sessionId)
    await modules.deleteDoc(docRef)
  }

  // --- Tombstones (30-day resurrection prevention) ---

  async pullTombstones(): Promise<SessionTombstone[]> {
    const user = this.ensureAuthenticatedUser()
    const { db, modules } = await this.getFirebase()

    const col = modules.collection(db, 'users', user.uid, 'tombstones')
    const snapshot = await modules.getDocs(col)

    const remoteTombstones: SessionTombstone[] = []
    snapshot.forEach((snap) => {
      // SAFETY: data matches SessionTombstone
      const data = snap.data() as unknown as SessionTombstone
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
    await modules.setDoc(docRef, tombstone)
  }

  // --- Singleton Subcollections: Settings, Stats, Sound, Interface, Metadata ---

  async pullSettings(): Promise<Settings | null> {
    const user = this.ensureAuthenticatedUser()
    const { db, modules } = await this.getFirebase()
    const docRef = modules.doc(db, 'users', user.uid, 'settings', 'current')
    const snap = await modules.getDoc(docRef)
    if (!snap.exists()) return null

    // SAFETY: Document conforms to CloudSettingsDocument
    const d = snap.data() as unknown as CloudSettingsDocument
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
      updatedLocallyAt: new Date().toISOString(),
      schemaVersion: SCHEMA_VERSION,
    }
    await modules.setDoc(docRef, cloudDoc)
  }

  async pullStats(): Promise<StatsV2 | null> {
    const user = this.ensureAuthenticatedUser()
    const { db, modules } = await this.getFirebase()
    const docRef = modules.doc(db, 'users', user.uid, 'stats', 'summary')
    const snap = await modules.getDoc(docRef)
    if (!snap.exists()) return null

    // SAFETY: Document conforms to CloudStatsDocument
    const d = snap.data() as unknown as CloudStatsDocument
    return {
      minutes: d.minutes,
      today: d.today,
      week: d.week,
      streak: d.streak,
      date: d.date,
      weekStart: d.weekStart,
      lastDate: d.lastDate ?? null,
      history: d.history ?? {},
      milestones: d.milestones ?? [],
      goals: d.goals,
    }
  }

  async pushStats(stats: StatsV2): Promise<void> {
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
      history: stats.history ?? {},
      milestones: stats.milestones ?? [],
      updatedLocallyAt: new Date().toISOString(),
      schemaVersion: SCHEMA_VERSION,
    }
    if (stats.goals !== undefined) {
      rawDoc.goals = stats.goals
    }
    await modules.setDoc(docRef, sanitizeFirestorePayload(rawDoc))
  }

  async pullSoundPrefs(): Promise<SoundPreferences | null> {
    const user = this.ensureAuthenticatedUser()
    const { db, modules } = await this.getFirebase()
    const docRef = modules.doc(db, 'users', user.uid, 'sound_prefs', 'current')
    const snap = await modules.getDoc(docRef)
    if (!snap.exists()) return null

    // SAFETY: Document conforms to CloudSoundPrefsDocument
    const d = snap.data() as unknown as CloudSoundPrefsDocument
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
      updatedLocallyAt: new Date().toISOString(),
    }
    await modules.setDoc(docRef, cloudDoc)
  }

  async pullInterface(): Promise<Partial<InterfacePrefs> | null> {
    const user = this.ensureAuthenticatedUser()
    const { db, modules } = await this.getFirebase()
    const docRef = modules.doc(db, 'users', user.uid, 'interface', 'current')
    const snap = await modules.getDoc(docRef)
    if (!snap.exists()) return null

    // SAFETY: Document conforms to CloudInterfaceDocument
    const d = snap.data() as unknown as CloudInterfaceDocument
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
      updatedLocallyAt: new Date().toISOString(),
    }
    await modules.setDoc(docRef, cloudDoc)
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
    await modules.setDoc(docRef, cloudDoc)
  }

  // --- Reconciliation & Full Sync ---

  async reconcileSessions(localSessions: SessionLogEntryV2[]): Promise<SessionLogEntryV2[]> {
    const [remoteSessions, remoteTombstones] = await Promise.all([
      this.pullSessions(),
      this.pullTombstones(),
    ])

    const localTombstones = loadTombstones()
    // Unify tombstones
    const tombstoneMap = new Map<string, SessionTombstone>()
    for (const t of [...localTombstones, ...remoteTombstones]) {
      tombstoneMap.set(t.id, t)
    }
    const allTombstones = Array.from(tombstoneMap.values())
    saveTombstones(allTombstones)

    // Push local tombstones not yet in remote
    for (const t of localTombstones) {
      if (!remoteTombstones.some((rt) => rt.id === t.id)) {
        await this.pushTombstone(t)
      }
    }

    // Merge sessions deterministically with tombstone filtration
    const merged = mergeSessions(localSessions, remoteSessions, allTombstones)

    // Save unified sessions locally
    saveSessions(merged)

    // Push local-only sessions to remote
    const remoteIdSet = new Set(remoteSessions.map((s) => s.id))
    const sessionsToPush = merged.filter((s) => !remoteIdSet.has(s.id))
    if (sessionsToPush.length > 0) {
      await this.pushSessions(sessionsToPush)
    }

    // Recompute stats to avoid counter drift
    this.recalculateStatsFromSessions(merged)

    return merged
  }

  async syncAll(): Promise<void> {
    this.setSyncStatus('syncing')
    try {
      const localSessions = loadSessions()
      await this.reconcileSessions(localSessions)

      // Sync settings
      const localSettings = loadSettings()
      const remoteSettings = await this.pullSettings()
      if (!remoteSettings) {
        await this.pushSettings(localSettings)
      } else {
        saveSettings(remoteSettings)
      }

      // Sync sound preferences
      const localSound = loadSoundPreferences()
      const remoteSound = await this.pullSoundPrefs()
      if (!remoteSound) {
        await this.pushSoundPrefs(localSound)
      } else {
        saveSoundPreferences(remoteSound)
      }

      // Sync interface preferences (e.g. maskTaskTitlesInCloud)
      const localInterface = loadInterface()
      const remoteInterface = await this.pullInterface()
      if (remoteInterface?.maskTaskTitlesInCloud !== undefined) {
        saveInterface({ ...localInterface, maskTaskTitlesInCloud: remoteInterface.maskTaskTitlesInCloud })
      } else {
        await this.pushInterface(localInterface)
      }

      // Update sync metadata
      await this.pushSyncMetadata()

      this.lastSyncedAt = new Date().toISOString()
      this.setSyncStatus('synced')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sync failed'
      this.setSyncStatus('error', msg)
      throw err
    }
  }

  // --- GDPR Art. 17 Complete Erasure ---

  async purgeCloudData(): Promise<void> {
    const user = this.ensureAuthenticatedUser()
    const { db, auth, modules } = await this.getFirebase()

    this.setSyncStatus('syncing')

    try {
      const subcollections = ['sessions', 'tombstones', 'settings', 'stats', 'sound_prefs', 'interface', 'metadata']

      for (const sub of subcollections) {
        const colRef = modules.collection(db, 'users', user.uid, sub)
        const snap = await modules.getDocs(colRef)
        const batch = modules.writeBatch(db)
        snap.forEach((docSnap) => {
          batch.delete(docSnap.ref)
        })
        await batch.commit()
      }

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
      await this.signOut()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Purge cloud data failed'
      this.setSyncStatus('error', msg)
      throw err
    }
  }

  // --- Internal Helpers ---

  private ensureAuthenticatedUser(): CloudUser {
    if (this.authState.status !== 'authenticated' || !this.authState.user) {
      throw new Error('Operation requires authenticated user')
    }
    return this.authState.user
  }

  private recalculateStatsFromSessions(sessions: SessionLogEntryV2[]): void {
    const currentStats = loadStats()
    const todayStr = new Date().toDateString()

    let allMinutes = 0
    let todayMinutes = 0
    const historyMap: Record<string, number> = {}

    for (const s of sessions) {
      const sessionDate = new Date(s.date)
      const dayKey = !Number.isNaN(sessionDate.getTime()) ? sessionDate.toDateString() : s.date
      const mins = s.minutes

      allMinutes += mins
      historyMap[dayKey] = (historyMap[dayKey] ?? 0) + mins

      if (dayKey === todayStr) {
        todayMinutes += mins
      }
    }

    const updatedStats: StatsV2 = {
      ...currentStats,
      minutes: allMinutes,
      today: todayMinutes,
      history: historyMap,
    }

    saveStats(updatedStats)
    // Async push recomputed stats
    this.pushStats(updatedStats).catch(() => {
      // Background non-fatal
    })
  }

  dispose(): void {
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
