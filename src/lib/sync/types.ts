import type {
  ChecklistItem,
  GoalSettings,
  InterfacePrefs,
  MilestoneRecord,
  SessionLogEntryV2,
  Settings,
  SoundPreferences,
  StatsV2,
} from '../../types'

export type SyncStatus = 'offline' | 'syncing' | 'synced' | 'error'
export type SyncConnectionStatus = SyncStatus

export const DEFAULT_SYNC_STATUS: SyncStatus = 'offline'

export interface CloudUser {
  readonly uid: string
  readonly email: string | null
  readonly displayName: string | null
  readonly photoURL: string | null
}

export type AuthUser = CloudUser

export type AuthStatus = 'unauthenticated' | 'authenticating' | 'authenticated' | 'error'

export interface UnauthenticatedAuthState {
  readonly status: 'unauthenticated'
  readonly user?: null
  readonly error?: null
}

export interface AuthenticatingAuthState {
  readonly status: 'authenticating'
  readonly user?: null
  readonly error?: null
}

export interface AuthenticatedAuthState {
  readonly status: 'authenticated'
  readonly user: CloudUser
  readonly error?: null
}

export interface ErrorAuthState {
  readonly status: 'error'
  readonly user?: null
  readonly error: string
}

export type AuthState =
  | UnauthenticatedAuthState
  | AuthenticatingAuthState
  | AuthenticatedAuthState
  | ErrorAuthState

export type UnauthenticatedState = UnauthenticatedAuthState
export type AuthenticatingState = AuthenticatingAuthState
export type AuthenticatedState = AuthenticatedAuthState
export type AuthErrorState = ErrorAuthState

export interface SyncState {
  readonly status: SyncStatus
  readonly lastSyncedAt: string | null
  readonly pendingMutations?: number
  readonly pendingChanges?: number
  readonly errorMessage?: string | null
  readonly error?: string | null
}

export interface CloudDocumentMetadata {
  readonly schemaVersion?: number
  readonly updatedAt?: string
  readonly deviceId?: string
}

export interface CloudSettingsDocument extends CloudDocumentMetadata {
  readonly focus: number
  readonly short: number
  readonly shortBreak?: number
  readonly long: number
  readonly longBreak?: number
  readonly rounds: number
  readonly autoStart: boolean
  readonly soundPreferences?: SoundPreferences
  readonly interface?: InterfacePrefs
  readonly goals?: GoalSettings
  readonly updatedLocallyAt?: string
}

export type FirestoreUserSettings = CloudSettingsDocument

export interface CloudStatsDocument extends CloudDocumentMetadata {
  readonly minutes: number
  readonly today: number
  readonly week: number
  readonly streak: number
  readonly date: string
  readonly weekStart: string
  readonly lastDate: string | null
  readonly history: Record<string, number>
  readonly milestones?: MilestoneRecord[]
  readonly goals?: GoalSettings
  readonly updatedLocallyAt?: string
}

export type FirestoreUserStats = CloudStatsDocument

export interface CloudSessionDocument extends SessionLogEntryV2, CloudDocumentMetadata {
  readonly updatedLocallyAt?: string
  readonly deleted?: boolean
}

export type FirestoreSessionRecord = CloudSessionDocument

export interface SessionMergeResult {
  readonly mergedSessions: SessionLogEntryV2[]
  readonly localAddedCount?: number
  readonly remoteAddedCount?: number
  readonly conflictResolvedCount?: number
}

export interface SyncStorageAdapter {
  getAuthState(): AuthState
  getSyncStatus(): SyncStatus
  signInWithGoogle(): Promise<CloudUser>
  signOut(): Promise<void>
  pullSessions(): Promise<SessionLogEntryV2[]>
  pushSessions(sessions: SessionLogEntryV2[]): Promise<void>
  reconcileSessions(localSessions: SessionLogEntryV2[]): Promise<SessionLogEntryV2[]>
  onSyncStatusChange(callback: (status: SyncStatus) => void): () => void
  onAuthStateChange(callback: (state: AuthState) => void): () => void

  getSyncState?(): SyncState
  pushSession?(session: SessionLogEntryV2): Promise<void>
  deleteRemoteSession?(sessionId: string): Promise<void>
  pullSettings?(): Promise<Settings | null>
  pushSettings?(settings: Settings): Promise<void>
  pullStats?(): Promise<StatsV2 | null>
  pushStats?(stats: StatsV2): Promise<void>
  dispose?(): void
}

export type CloudSyncAdapter = SyncStorageAdapter

export type {
  ChecklistItem,
  GoalSettings,
  InterfacePrefs,
  MilestoneRecord,
  SessionLogEntryV2,
  Settings,
  SoundPreferences,
  StatsV2,
}
