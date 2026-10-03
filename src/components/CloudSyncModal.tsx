import { useEffect, useState, useRef } from 'react'
import { RefreshCw, Shield, LogOut, Trash2 } from 'lucide-react'
import { getCloudSyncAdapter } from '../lib/sync/adapter'
import { loadInterface, saveInterface } from '../lib/storage'
import { useI18n } from '../lib/i18n'
import type { AccountSwitchChoice, AccountSwitchEvent } from '../lib/sync/types'
import { Modal } from './Modal'
import { PillButton } from './PillButton'
import { Switch } from './Switch'

interface Props {open: boolean; onClose: () => void; onSyncComplete?: (message: string) => void}
function Content({onSyncComplete}: Pick<Props, 'onSyncComplete'>): React.JSX.Element {
  const {t} = useI18n()
  const adapter = getCloudSyncAdapter()
  const [state, setState] = useState(() => adapter.getDetailedSyncState())
  const [availability, setAvailability] = useState<{configured: boolean; persistent: boolean} | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [purge, setPurge] = useState(false)
  const [mask, setMask] = useState(() => loadInterface().maskTaskTitlesInCloud ?? false)
  const [switchAccount, setSwitchAccount] = useState<{event: AccountSwitchEvent; resolve: (choice: AccountSwitchChoice) => void} | null>(null)
  const mounted = useRef(true)
  const consent = useRef<((choice: AccountSwitchChoice) => void) | null>(null)
  useEffect(() => adapter.onStateChange(next => {setState(next); setMask(loadInterface().maskTaskTitlesInCloud ?? false)}), [adapter])
  useEffect(() => {
    let mounted = true
    void adapter.getAvailability().then(value => {if (mounted) setAvailability(value)}).catch(() => {if (mounted) setAvailability({configured: false, persistent: false})})
    return () => {mounted = false}
  }, [adapter, state.uid])
  useEffect(() => {mounted.current = true; return () => {mounted.current = false; consent.current?.('cancel')}}, [])
  const run = async (work: () => Promise<unknown>) => {
    setBusy(true); setError(null)
    try { await work(); onSyncComplete?.(t('sync.success')) }
    catch (failure) {
      const message = String(failure)
      if (!/popup-closed|cancelled/.test(message)) setError(t(/not.configured|cloud-not-configured/.test(message) ? 'sync.error.config' : /auth\/|oauth-|sign-in|account-mismatch/.test(message) ? 'sync.error.login' : 'sync.error.network'))
    } finally { setBusy(false); setSwitchAccount(null) }
  }
  const signIn = () => run(() => adapter.signInWithGoogle(event => new Promise(resolve => {if (!mounted.current) {resolve('cancel'); return} consent.current = resolve; setSwitchAccount({event, resolve})})))
  const toggleMask = (checked: boolean) => {
    setMask(checked)
    const prefs = {...loadInterface(), maskTaskTitlesInCloud: checked}
    saveInterface(prefs)
    if (state.uid) void run(() => adapter.syncAll())
  }
  const connected = !!state.uid
  return <div className="space-y-5 text-sm text-ink-2">
    {(error || state.status === 'error') && <p role="alert" className="rounded-xl border border-line bg-sunken p-3 text-ink">{error ?? t('sync.error.network')}</p>}
    {switchAccount && <section className="rounded-xl border border-line p-4">
      <h3 className="font-medium text-ink">{t('sync.account')}</h3><p className="mt-2">{t('sync.accountDescription')}</p>
      <div className="mt-3 flex flex-col gap-2"><PillButton onClick={() => switchAccount.resolve('replace-local')}>{t('sync.replace')}</PillButton><PillButton variant="secondary" onClick={() => switchAccount.resolve('merge')}>{t('sync.merge')}</PillButton></div>
    </section>}
    {availability?.configured === false && <p role="status">{t('sync.error.config')}</p>}
    {connected && availability?.persistent === false && <p role="status">{t('sync.memory')}</p>}
    <p>{t('sync.description')}</p><p className="text-xs">{t('sync.scope')}</p>
    {connected && <section className="rounded-xl border border-line p-3">
      <p className="font-medium text-ink">{state.displayName ?? state.email}</p><p className="text-xs">{state.email}</p><p className="mt-2">{t('sync.connected')}</p>
      <p className="mt-2 text-xs">{t('sync.last')} {state.lastSyncedAt ? new Date(state.lastSyncedAt).toLocaleString() : t('sync.pending')}</p>
    </section>}
    <section className="flex items-center gap-3 rounded-xl border border-line p-3"><Shield size={18} aria-hidden="true"/><div className="flex-1"><p className="font-medium text-ink">{t('sync.mask')}</p><p className="text-xs">{t('sync.maskDescription')}</p></div><Switch hideLabel checked={mask} disabled={busy} label={t('sync.mask')} onChange={toggleMask}/></section>
    {!connected && !switchAccount && <PillButton className="w-full" disabled={busy || !availability?.configured} onClick={() => {void signIn()}}>{busy ? t('sync.connecting') : availability?.configured === false ? t('sync.unavailable') : t('sync.signIn')}</PillButton>}
    {connected && <>
      <div className="flex flex-wrap gap-2"><PillButton disabled={busy} onClick={() => {void run(() => adapter.syncAll())}}><RefreshCw size={14} aria-hidden="true"/>{t('sync.now')}</PillButton><PillButton disabled={busy} variant="secondary" onClick={() => {void run(() => adapter.signOut())}}><LogOut size={14} aria-hidden="true"/>{t('sync.signOut')}</PillButton></div>
      {!purge ? <PillButton variant="secondary" disabled={busy} onClick={() => setPurge(true)}><Trash2 size={14} aria-hidden="true"/>{t('sync.delete')}</PillButton> : <section className="rounded-xl border border-line p-3"><p className="font-medium text-ink">{t('sync.deleteConfirm')}</p><p className="my-3 text-xs">{t('sync.deleteDescription')}</p><div className="flex flex-wrap gap-2"><PillButton disabled={busy} onClick={() => {void run(() => adapter.purgeCloudData())}}>{busy ? t('sync.deleting') : t('sync.deleteYes')}</PillButton><PillButton variant="secondary" disabled={busy} onClick={() => setPurge(false)}>{t('sync.cancel')}</PillButton></div></section>}
    </>}
  </div>
}
export function CloudSyncModal({open, onClose, onSyncComplete}: Props): React.JSX.Element | null {
  const {t} = useI18n()
  if (!open) return null
  return <Modal open title={t('sync.title')} onClose={onClose}><Content onSyncComplete={onSyncComplete}/></Modal>
}
