import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SyncStatusIndicator } from './SyncStatusIndicator'
import { resetCloudSyncAdapter } from '../lib/sync/adapter'
import { saveCloudSyncState } from '../lib/storage'

describe('SyncStatusIndicator (Tier 1 Ambient Component)', () => {
  beforeEach(() => {
    localStorage.clear()
    resetCloudSyncAdapter()
    vi.restoreAllMocks()
  })

  it('renders "Local Only" in default disconnected state', () => {
    const handleClick = vi.fn()
    render(<SyncStatusIndicator onClick={handleClick} />)

    expect(screen.getByText('Local Only')).toBeDefined()
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('renders "Synced" with username when authenticated and connected', () => {
    saveCloudSyncState({
      status: 'synced',
      uid: 'user-789',
      email: 'anna@example.com',
      displayName: 'Anna Smith',
      photoURL: null,
      lastSyncedAt: new Date().toISOString(),
      error: null,
    })

    render(<SyncStatusIndicator onClick={vi.fn()} />)
    expect(screen.getByText(/Synced ·/)).toBeDefined()
    expect(screen.getByText('Anna')).toBeDefined()
  })

  it('renders "Offline (Saved locally)" when in error / offline state', () => {
    saveCloudSyncState({
      status: 'error',
      uid: 'user-789',
      email: 'anna@example.com',
      displayName: 'Anna Smith',
      photoURL: null,
      lastSyncedAt: null,
      error: 'Network connection lost',
    })

    render(<SyncStatusIndicator onClick={vi.fn()} />)
    expect(screen.getByText('Offline (Saved locally)')).toBeDefined()
  })
})
