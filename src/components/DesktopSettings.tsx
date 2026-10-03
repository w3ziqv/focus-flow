import { useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'
import { useI18n } from '../lib/i18n'
import { getPersistence, nativeInvoke } from '../lib/desktop/runtime'
import { Switch } from './Switch'
import { PillButton } from './PillButton'
import { LocalPeer, type PeerStatus } from '../lib/desktop/peer'

interface DiscoveredPeer { id: string; name: string }
export default function DesktopSettings(): JSX.Element {
  const { t } = useI18n()
  const [autostart, setAutostart] = useState(false)
  const [awake, setAwake] = useState(() => getPersistence().getItem('ff3_awake') !== 'false')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const peerSupported = typeof RTCPeerConnection !== 'undefined'
  const [status, setStatus] = useState<PeerStatus>('disconnected')
  const [peers, setPeers] = useState<DiscoveredPeer[]>([])
  const [outgoing, setOutgoing] = useState('')
  const [incoming, setIncoming] = useState('')
  const peer = useRef<LocalPeer | null>(null)
  useEffect(() => {
    let cancelled = false
    void import('@tauri-apps/plugin-autostart').then(async ({ isEnabled }) => { const value = await isEnabled(); if (!cancelled) setAutostart(value) }).catch(failure => { if (!cancelled) setError(String(failure)) })
    return () => { cancelled = true }
  }, [])
  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    let dispose: (() => void) | undefined
    let connection: LocalPeer | null = null
    void import('@tauri-apps/api/event').then(async ({ listen }) => {
      if (cancelled) return
      const active = new LocalPeer(() => {
        if (!cancelled) { setStatus(active.status); if (active.error) setError(active.error) }
      })
      connection = active
      peer.current = active
      const unlisten = await listen<DiscoveredPeer[]>('local-peers', event => { if (!cancelled) setPeers(event.payload) })
      if (cancelled) { unlisten(); return }
      dispose = unlisten
      await nativeInvoke('discovery_start', {device: getPersistence().getItem('ff3_device'), name: 'Focus Flow'})
      if (cancelled) await nativeInvoke('discovery_stop')
    }).catch(failure => { if (!cancelled) setError(String(failure)) })
    return () => {
      cancelled = true; dispose?.(); connection?.disconnect(); peer.current = null
      void nativeInvoke('discovery_stop').catch(() => {})
    }
  }, [enabled])
  const run = async (work: () => Promise<void>) => {
    setBusy(true); setError(null)
    try { await work() } catch (failure) { setError(String(failure)) }
    finally { setBusy(false) }
  }
  return <section className="rounded-2xl border border-line bg-card p-4 text-body-sm text-ink">
    <h2 className="mb-3 font-serif text-h2">{t('desktop.title')}</h2>
    <Switch disabled={busy} label={t('desktop.autostart')} checked={autostart} onChange={value => { void run(async () => {
      const plugin = await import('@tauri-apps/plugin-autostart')
      if (value) await plugin.enable(); else await plugin.disable()
      setAutostart(await plugin.isEnabled())
    }) }}/>
    <Switch disabled={busy} label={t('desktop.awake')} checked={awake} onChange={value => {
      getPersistence().setItem('ff3_awake', String(value)); setAwake(value)
      void run(async () => {
        const timer = await nativeInvoke<{running: boolean} | null>('timer_display')
        await nativeInvoke('set_awake', {active: value && timer?.running === true})
      })
    }}/>
    <PillButton variant="secondary" className="my-3" onClick={() => { void run(async () => { await nativeInvoke('toggle_mini') }) }}>{t('desktop.mini')}</PillButton>
    <p className="text-caption text-ink-2">{t('desktop.hotkeys')}</p>
    <div className="mt-5 border-t border-line pt-4">
      <h3 className="font-serif text-h2">{t('peer.title')}</h3>
      <p className="my-2 text-body-sm text-ink-2">{t('peer.description')}</p>
      {!peerSupported && <p role="status" className="my-2 text-body-sm text-ink-2">{t('peer.unsupported')}</p>}
      <p className="text-xs text-ink-3">{t('peer.experimental')}</p>
      <Switch disabled={busy || !peerSupported} label={t('peer.enable')} checked={enabled} onChange={value => { setEnabled(value); setOutgoing(''); setIncoming(''); setPeers([]); setError(null); setStatus('disconnected') }}/>
      {enabled && <div className="mt-3 space-y-3">
        <p role="status">{t(`peer.status.${status}`)}</p>
        <p className="text-caption text-ink-2">{peers.length ? `${t('peer.nearby')}: ${peers.map(item => item.name).join(', ')}` : t('peer.none')}</p>
        <p className="text-body-sm text-ink-2">{t('peer.instructions')}</p>
        <PillButton disabled={busy} variant="secondary" onClick={() => { void run(async () => { setOutgoing(await peer.current!.offer()) }) }}>{t('peer.offer')}</PillButton>
        {outgoing && <div>
          <label htmlFor="peer-outgoing" className="block text-caption">{t('peer.outgoing')}</label>
          <textarea id="peer-outgoing" readOnly value={outgoing} rows={3} className="mt-1 w-full rounded-xl border border-line bg-sunken p-3 text-body-sm" onFocus={event => event.currentTarget.select()}/>
          <PillButton variant="secondary" onClick={() => { void run(async () => { await navigator.clipboard.writeText(outgoing) }) }}>{t('peer.copy')}</PillButton>
        </div>}
        <label htmlFor="peer-incoming" className="block text-caption">{t('peer.incoming')}</label>
        <textarea id="peer-incoming" value={incoming} onChange={event => setIncoming(event.target.value.slice(0, 64*1024))} rows={3} className="w-full rounded-xl border border-line bg-sunken p-3 text-body-sm"/>
        <div className="flex flex-wrap gap-2">
          <PillButton disabled={busy || !incoming.trim()} variant="primary" onClick={() => { void run(async () => { const answer = await peer.current!.accept(incoming); if (answer) setOutgoing(answer); setIncoming('') }) }}>{t('peer.accept')}</PillButton>
          <PillButton disabled={busy || !['connected','synced'].includes(status)} variant="secondary" onClick={() => { void run(async () => { await peer.current!.sync() }) }}>{t('peer.sync')}</PillButton>
          <PillButton variant="secondary" onClick={() => { peer.current?.disconnect(); setOutgoing(''); setIncoming('') }}>{t('peer.disconnect')}</PillButton>
        </div>
        <p className="text-caption text-ink-2">{t('peer.scope')}</p>
      </div>}
    </div>
    {error && <p role="alert" className="mt-3 break-words text-body-sm text-ink">{t('desktop.error.operation')}</p>}
  </section>
}
