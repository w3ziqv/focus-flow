import { I18nProvider } from '../lib/i18n'
import { fireEvent, render as renderComponent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CloudSyncModal } from './CloudSyncModal'
import { CloudSyncAdapterImpl, getCloudSyncAdapter, resetCloudSyncAdapter } from '../lib/sync/adapter'
import { saveCloudSyncState } from '../lib/storage'

const render = (element: React.ReactNode) => renderComponent(<I18nProvider>{element}</I18nProvider>)

describe('CloudSyncModal (Tier 2 Elevated Dialog)', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('ff2_lang', 'en')
    resetCloudSyncAdapter()
    vi.restoreAllMocks()
    vi.spyOn(CloudSyncAdapterImpl.prototype, 'getAvailability').mockResolvedValue({configured: true, persistent: true})
  })

  it('renders nothing when closed', () => {
    const { container } = render(
      <CloudSyncModal open={false} onClose={vi.fn()} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders disconnected state with Google sign-in button and privacy toggle', () => {
    render(
      <CloudSyncModal open={true} onClose={vi.fn()} />,
    )

    expect(screen.getByText('Cloud Synchronization')).toBeDefined()
    expect(screen.getByText('Sign in with Google')).toBeDefined()
    expect(screen.getByRole('switch', {name: 'Hide task content in the cloud'})).toBeDefined()
  })

  it('invokes adapter.signInWithGoogle on sign-in click', async () => {
    const adapter = getCloudSyncAdapter()
    const signInSpy = vi.spyOn(adapter, 'signInWithGoogle').mockResolvedValue({
      uid: 'user-google-1',
      email: 'user@example.com',
      displayName: 'Google User',
      photoURL: null,
    })

    const onSyncComplete = vi.fn()
    render(
      <CloudSyncModal open={true} onClose={vi.fn()} onSyncComplete={onSyncComplete} />,
    )

    await waitFor(() => expect(screen.getByText('Sign in with Google').closest('button')!.disabled).toBe(false))
    const signInButton = screen.getByText('Sign in with Google').closest('button')!
    fireEvent.click(signInButton)

    await waitFor(() => {
      expect(signInSpy).toHaveBeenCalled()
      expect(onSyncComplete).toHaveBeenCalled()
    })
  })

  it('renders connected state with account info, sync now, and sign out buttons', async () => {
    saveCloudSyncState({
      status: 'synced',
      uid: 'user-connected-1',
      email: 'alex@example.com',
      displayName: 'Alex Rivers',
      photoURL: null,
      lastSyncedAt: '2026-09-20T14:32:00.000Z',
      error: null,
    })

    const adapter = getCloudSyncAdapter()
    const signOutSpy = vi.spyOn(adapter, 'signOut').mockResolvedValue()
    const syncAllSpy = vi.spyOn(adapter, 'syncAll').mockResolvedValue()

    render(
      <CloudSyncModal open={true} onClose={vi.fn()} />,
    )

    expect(screen.getByText('Alex Rivers')).toBeDefined()
    expect(screen.getByText('alex@example.com')).toBeDefined()
    expect(screen.getByText('Connected')).toBeDefined()

    const syncNowBtn = screen.getByText('Sync Now').closest('button')!
    fireEvent.click(syncNowBtn)
    await waitFor(() => {
      expect(syncAllSpy).toHaveBeenCalled()
    })

    const signOutBtn = screen.getByText('Sign Out').closest('button')!
    fireEvent.click(signOutBtn)
    await waitFor(() => {
      expect(signOutSpy).toHaveBeenCalled()
    })
  })

  it('shows permission diagnostics without misreporting a network failure or exposing SDK data', async () => {
    saveCloudSyncState({status: 'error', uid: 'test-user', email: null, displayName: null, photoURL: null, lastSyncedAt: null, error: 'permission-denied'})
    const adapter = getCloudSyncAdapter()
    vi.spyOn(adapter, 'syncAll').mockRejectedValue(Object.assign(new Error('Private SDK details token=secret'), {code: 'permission-denied'}))
    render(<CloudSyncModal open onClose={vi.fn()}/> )
    expect(screen.getByRole('alert').textContent).toContain('The cloud denied access')
    fireEvent.click(screen.getByRole('button', {name: 'Sync Now'}))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('permission-denied'))
    expect(screen.getByRole('alert').textContent).not.toContain('Check your connection')
    expect(screen.getByRole('alert').textContent).not.toContain('secret')
  })
})
