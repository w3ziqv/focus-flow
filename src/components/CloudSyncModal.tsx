/**
 * Focus Flow — Tier 2 Elevated Cloud Sync Modal (Stage 6 / Milestone v2.6)
 *
 * ADR-005 (Local-First Data Sovereignty) & ADR-009 (Opt-in Cloud Sync)
 *
 * Allows signing in with Google, reviewing sync health, toggling private task masking,
 * manual sync reconciliation, signing out (retaining local data), or purging cloud documents.
 */

import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Check,
  LogOut,
  RefreshCw,
  Shield,
  Trash2,
} from 'lucide-react'
import { loadInterface, saveInterface } from '../lib/storage'
import { getCloudSyncAdapter } from '../lib/sync/adapter'
import type { AccountSwitchChoice, AccountSwitchEvent, CloudSyncState } from '../lib/sync/types'
import { Modal } from './Modal'
import { PillButton } from './PillButton'
import { Switch } from './Switch'

interface CloudSyncModalProps {
  open: boolean
  onClose: () => void
  onSyncComplete?: (message: string) => void
}

function CloudSyncModalContent({
  onClose,
  onSyncComplete,
}: {
  onClose: () => void
  onSyncComplete?: (message: string) => void
}): React.JSX.Element {
  const adapter = getCloudSyncAdapter()
  const [syncState, setSyncState] = useState<CloudSyncState>(() => adapter.getDetailedSyncState())
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [confirmPurge, setConfirmPurge] = useState<boolean>(false)

  // Account switch consent state
  const [pendingAccountSwitch, setPendingAccountSwitch] = useState<{
    event: AccountSwitchEvent
    resolve: (choice: AccountSwitchChoice) => void
  } | null>(null)

  const [maskTaskTitles, setMaskTaskTitles] = useState<boolean>(
    () => loadInterface().maskTaskTitlesInCloud ?? false,
  )

  useEffect(() => {
    return adapter.onStateChange((state) => {
      setSyncState(state)
    })
  }, [adapter])

  const handleSignIn = async () => {
    setLoading(true)
    setErrorMessage(null)
    try {
      await adapter.signInWithGoogle(async (event) => {
        return new Promise<AccountSwitchChoice>((resolve) => {
          setPendingAccountSwitch({ event, resolve })
        })
      })
      onSyncComplete?.('Successfully connected Google account and synced sessions.')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed'
      // Ignore user-aborted popup close
      if (!msg.includes('popup-closed-by-user') && !msg.includes('cancelled-popup-request')) {
        let userFriendly = msg
        if (msg.includes('auth/internal-error')) {
          userFriendly =
            'Błąd wewnętrzny logowania (auth/internal-error): Upewnij się, że zrestartowałeś serwer (npm run dev) po utworzeniu .env.local oraz że Google jest włączony w Firebase Console (Authentication → Sign-in method).'
        } else if (msg.includes('auth/operation-not-allowed') || msg.includes('auth/configuration-not-found')) {
          userFriendly =
            'Logowanie Google nie jest włączone w Firebase Console. Przejdź do Authentication → Sign-in method i włącz dostawcę Google.'
        } else if (msg.includes('auth/unauthorized-domain')) {
          userFriendly =
            'Nieautoryzowana domena: Wejdź na http://localhost:5173 (zamiast 127.0.0.1) lub dodaj domenę w Firebase Console (Authentication → Settings → Authorized domains).'
        }
        setErrorMessage(userFriendly)
      }
    } finally {
      setLoading(false)
      setPendingAccountSwitch(null)
    }
  }

  const handleSignOut = async () => {
    setLoading(true)
    try {
      await adapter.signOut()
      onSyncComplete?.('Signed out. Your local session history remains 100% intact.')
    } catch {
      // Disconnected locally regardless
    } finally {
      setLoading(false)
    }
  }

  const handleManualSync = async () => {
    setLoading(true)
    setErrorMessage(null)
    try {
      await adapter.syncAll()
      onSyncComplete?.('All timer settings and sessions synchronized with your cloud library.')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sync failed'
      setErrorMessage(msg)
    } finally {
      setLoading(false)
    }
  }

  const handlePurgeCloud = async () => {
    setLoading(true)
    setErrorMessage(null)
    try {
      await adapter.purgeCloudData()
      setConfirmPurge(false)
      onSyncComplete?.('All cloud records permanently erased. Local history preserved.')
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not purge cloud data'
      setErrorMessage(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleMaskTaskTitles = (checked: boolean) => {
    setMaskTaskTitles(checked)
    const current = loadInterface()
    saveInterface({ ...current, maskTaskTitlesInCloud: checked })
    // If authenticated, push preference to cloud
    if (adapter.getAuthState().status === 'authenticated') {
      adapter.pushInterface({ ...current, maskTaskTitlesInCloud: checked }).catch(() => {})
    }
  }

  const isConnected = syncState.status !== 'disconnected' && syncState.uid !== null

  return (
    <div className="space-y-5 text-sm text-ink-2">
      {/* Multi-Account Consent Dialog */}
      {pendingAccountSwitch && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-ink">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <h3 className="font-medium text-ink">Different Account Detected</h3>
              <p className="mt-1 text-xs text-ink-2">
                This device was previously linked to another Google account. How would you like to handle your local
                session history?
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <PillButton
                  onClick={() => pendingAccountSwitch.resolve('merge')}
                  variant="primary"
                  className="!px-4 !py-2 text-xs"
                >
                  Link & Merge Local Sessions
                </PillButton>
                <PillButton
                  onClick={() => pendingAccountSwitch.resolve('replace-local')}
                  variant="secondary"
                  className="!px-4 !py-2 text-xs"
                >
                  Start Fresh with Cloud Sessions
                </PillButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
          {errorMessage}
        </div>
      )}

      {/* State A: Disconnected State */}
      {!isConnected && !pendingAccountSwitch && (
        <div className="space-y-4">
          <p className="text-xs leading-relaxed text-ink-2">
            Connect your Google account to synchronize timer settings, daily targets, and focus history across your
            devices. Focus Flow remains 100% functional offline, and your data is stored in your private cloud
            partition.
          </p>

          <div className="rounded-xl border border-line bg-surface/40 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-ink-2" />
                <div>
                  <div className="text-xs font-medium text-ink">Mask task titles in cloud</div>
                  <div className="text-[11px] text-ink-3">
                    Sync focus minutes and streaks while keeping task names strictly on this device.
                  </div>
                </div>
              </div>
              <Switch
                checked={maskTaskTitles}
                onChange={handleToggleMaskTaskTitles}
                label=""
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleSignIn}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-full border border-line bg-surface px-4 py-2.5 font-sans text-sm font-medium text-ink shadow-sm transition-all hover:bg-elevated hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin text-ink-2" />
                  <span>Connecting…</span>
                </>
              ) : (
                <>
                  <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* State B: Connected State */}
      {isConnected && (
        <div className="space-y-4">
          {/* Identity Card */}
          <div className="flex items-center justify-between rounded-xl border border-line bg-surface/50 p-3">
            <div className="flex items-center gap-3">
              {syncState.photoURL ? (
                <img
                  src={syncState.photoURL}
                  alt={syncState.displayName || 'Google Profile'}
                  className="size-9 rounded-full border border-line"
                />
              ) : (
                <div className="flex size-9 items-center justify-center rounded-full bg-[var(--accent-break)] text-xs font-semibold text-white">
                  {(syncState.displayName || syncState.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div>
                <div className="font-medium text-ink">{syncState.displayName || 'Google User'}</div>
                <div className="text-xs text-ink-3">{syncState.email}</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 rounded-full bg-[var(--accent-break)]/15 px-2.5 py-1 text-[11px] font-medium text-[var(--accent-break)]">
              <Check size={12} />
              <span>Connected</span>
            </div>
          </div>

          {/* Sync Metadata */}
          <div className="flex items-center justify-between text-xs text-ink-3">
            <span>Last synchronized:</span>
            <span className="font-mono text-ink-2">
              {syncState.lastSyncedAt
                ? new Date(syncState.lastSyncedAt).toLocaleString([], {
                    dateStyle: 'short',
                    timeStyle: 'medium',
                  })
                : 'Pending'}
            </span>
          </div>

          {/* Privacy Toggle */}
          <div className="rounded-xl border border-line bg-surface/40 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-ink-2" />
                <div>
                  <div className="text-xs font-medium text-ink">Mask task titles in cloud</div>
                  <div className="text-[11px] text-ink-3">
                    Sync focus minutes and streaks while keeping task names strictly on this device.
                  </div>
                </div>
              </div>
              <Switch
                checked={maskTaskTitles}
                onChange={handleToggleMaskTaskTitles}
                label=""
              />
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2 pt-2">
            <PillButton
              onClick={handleManualSync}
              disabled={loading}
              variant="primary"
              className="flex-1 !px-4 !py-2 text-xs"
            >
              {loading ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              <span>Sync Now</span>
            </PillButton>

            <PillButton
              onClick={handleSignOut}
              disabled={loading}
              variant="secondary"
              className="flex-1 !px-4 !py-2 text-xs"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </PillButton>
          </div>

          {/* Danger Zone: GDPR Complete Cloud Purge */}
          <div className="border-t border-line/60 pt-3">
            {!confirmPurge ? (
              <button
                type="button"
                onClick={() => setConfirmPurge(true)}
                className="flex items-center gap-1.5 text-xs text-red-600 transition-colors hover:text-red-700 dark:text-red-400"
              >
                <Trash2 size={13} />
                <span>Delete cloud data and disconnect</span>
              </button>
            ) : (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs">
                <p className="font-medium text-red-700 dark:text-red-300">
                  Permanently delete all cloud data?
                </p>
                <p className="mt-1 text-[11px] text-red-600/90 dark:text-red-400/90">
                  This permanently erases all settings, stats, and session records stored in your cloud partition
                  (GDPR Art. 17). Local data on this device is preserved.
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePurgeCloud}
                    disabled={loading}
                    className="rounded-full bg-red-600 px-3 py-1 font-sans text-xs font-medium text-white transition hover:bg-red-700"
                  >
                    {loading ? 'Deleting…' : 'Yes, Delete Cloud Data'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmPurge(false)}
                    className="rounded-full border border-line bg-surface px-3 py-1 font-sans text-xs text-ink-2 hover:bg-elevated"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function CloudSyncModal({ open, onClose, onSyncComplete }: CloudSyncModalProps): React.JSX.Element | null {
  if (!open) return null
  return (
    <Modal open={open} title="Cloud Synchronization" onClose={onClose}>
      <CloudSyncModalContent onClose={onClose} onSyncComplete={onSyncComplete} />
    </Modal>
  )
}
