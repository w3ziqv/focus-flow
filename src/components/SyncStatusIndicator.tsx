/**
 * Focus Flow — Tier 1 Ambient Sync Status Indicator (Stage 6 / Milestone v2.6)
 *
 * Recessive interface affordance placed in the UI periphery.
 * 4 Calm ambient states: Local Only, Syncing, Synced, Offline / Error.
 */

import { useEffect, useState } from 'react'
import { AlertCircle, Check, CloudOff, RefreshCw } from 'lucide-react'
import { loadCloudSyncState } from '../lib/storage'
import type { CloudSyncState } from '../lib/sync/types'

interface SyncStatusIndicatorProps {
  onClick: () => void
  className?: string
}

const DEFAULT_STATE: CloudSyncState = {
  status: 'disconnected',
  uid: null,
  email: null,
  displayName: null,
  photoURL: null,
  lastSyncedAt: null,
  error: null,
}

export function SyncStatusIndicator({ onClick, className = '' }: SyncStatusIndicatorProps): React.JSX.Element {
  const [syncState, setSyncState] = useState<CloudSyncState>(() => loadCloudSyncState() ?? DEFAULT_STATE)

  useEffect(() => {
    const handleUpdate = () => {
      setSyncState(loadCloudSyncState() ?? DEFAULT_STATE)
    }

    window.addEventListener('focus-flow:sync-state', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener('focus-flow:sync-state', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

  const formatLastSynced = (iso: string | null): string => {
    if (!iso) return 'Never'
    try {
      const d = new Date(iso)
      if (Number.isNaN(d.getTime())) return 'Never'
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return 'Recently'
    }
  }

  const { status, displayName, email, lastSyncedAt } = syncState
  const userLabel = displayName ? displayName.split(' ')[0] : email ? email.split('@')[0] : 'Account'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Cloud Sync Status: ${status}. Click to open sync settings.`}
      className={`group inline-flex items-center gap-1.5 rounded-full border border-line/60 bg-surface/50 px-2.5 py-1 text-xs text-ink-2 transition-all duration-200 hover:border-line hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${className}`}
      title={lastSyncedAt ? `Last synced at ${formatLastSynced(lastSyncedAt)}` : 'Local only — click to sync'}
    >
      {status === 'disconnected' && (
        <>
          <CloudOff size={13} className="text-ink-3 transition-colors group-hover:text-ink-2" aria-hidden="true" />
          <span className="font-sans font-medium tracking-tight text-ink-3 group-hover:text-ink-2">Local Only</span>
        </>
      )}

      {status === 'syncing' && (
        <>
          <RefreshCw size={13} className="animate-spin text-[var(--accent-focus)]" aria-hidden="true" />
          <span className="font-sans font-medium tracking-tight text-ink-2 animate-pulse">Syncing…</span>
        </>
      )}

      {status === 'synced' && (
        <>
          <span className="flex size-2 items-center justify-center">
            <span className="size-1.5 rounded-full bg-[var(--accent-break)]" />
          </span>
          <span className="font-sans font-medium tracking-tight text-ink-2">
            Synced · <span className="text-ink">{userLabel}</span>
          </span>
          <Check size={11} className="text-[var(--accent-break)] opacity-70" aria-hidden="true" />
        </>
      )}

      {status === 'error' && (
        <>
          <AlertCircle size={13} className="text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <span className="font-sans font-medium tracking-tight text-amber-700 dark:text-amber-300">
            Offline (Saved locally)
          </span>
        </>
      )}
    </button>
  )
}
