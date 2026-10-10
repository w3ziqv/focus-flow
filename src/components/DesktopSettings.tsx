import { useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'
import { Keyboard, Moon, PanelsTopLeft, Power } from 'lucide-react'
import { useI18n } from '../lib/i18n'
import { getPersistence, nativeInvoke } from '../lib/desktop/runtime'
import { Switch } from './Switch'
import { PillButton } from './PillButton'
import { LocalPeer, type PeerStatus } from '../lib/desktop/peer'

interface DiscoveredPeer { id: string; name: string }
export default function DesktopSettings({ section = 'desktop' }: { section?: 'desktop' | 'peer' }): JSX.Element {
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
    if (section !== 'desktop') return
    let cancelled = false
    void import('@tauri-apps/plugin-autostart').then(async ({ isEnabled }) => { const value = await isEnabled(); if (!cancelled) setAutostart(value) }).catch(failure => { if (!cancelled) setError(String(failure)) })
    return () => { cancelled = true }
  }, [section])
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
  return <div className="space-y-3.5 text-body-sm text-ink">
    {section === 'desktop' && <>
    <div className="overflow-hidden rounded-2xl border border-line bg-card divide-y divide-line/60">
    <div className="flex items-center justify-between gap-3 p-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent"><Power size={17} aria-hidden="true" /></div>
        <div><div className="text-[14px] font-medium leading-snug">{t('desktop.autostart')}</div><p className="text-[12px] leading-snug text-ink-3">{t('desktop.autostartDescription')}</p></div>
      </div>
    <Switch hideLabel disabled={busy} label={t('desktop.autostart')} checked={autostart} onChange={value => { void run(async () => {
      const plugin = await import('@tauri-apps/plugin-autostart')
      if (value) await plugin.enable(); else await plugin.disable()
      setAutostart(await plugin.isEnabled())
    }) }}/>
    </div>
    <div className="flex items-center justify-between gap-3 p-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[var(--color-break-soft)] text-[var(--color-break)]"><Moon size={17} aria-hidden="true" /></div>
        <div><div className="text-[14px] font-medium leading-snug">{t('desktop.awake')}</div><p className="text-[12px] leading-snug text-ink-3">{t('desktop.awakeDescription')}</p></div>
      </div>
    <Switch hideLabel disabled={busy} label={t('desktop.awake')} checked={awake} onChange={value => {
      getPersistence().setItem('ff3_awake', String(value)); setAwake(value)
      void run(async () => {
        const timer = await nativeInvoke<{running: boolean} | null>('timer_display')
        await nativeInvoke('set_awake', {active: value && timer?.running === true})
      })
    }}/>
    </div>
    </div>
    <div className="overflow-hidden rounded-2xl border border-line bg-card">
      <button type="button" disabled={busy} className="flex min-h-[52px] w-full items-center gap-3 p-3.5 text-left transition-colors hover:bg-sunken/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50" onClick={() => { void run(async () => { await nativeInvoke('toggle_mini') }) }}>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent"><PanelsTopLeft size={17} aria-hidden="true" /></div>
        <div><div className="text-[14px] font-medium leading-snug">{t('desktop.mini')}</div><p className="text-[12px] leading-snug text-ink-3">{t('desktop.miniDescription')}</p></div>
      </button>
    </div>
    <details className="overflow-hidden rounded-2xl border border-line bg-card">
      <summary className="min-h-[52px] cursor-pointer p-3.5 text-[14px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><Keyboard size={17} className="mr-2 inline-block text-ink-2" aria-hidden="true" />{t('desktop.shortcuts')}</summary>
      <p className="border-t border-line/60 p-3.5 text-caption leading-relaxed text-ink-2">{t('desktop.hotkeys')}</p>
    </details>
    </>}
    {section === 'peer' && <>
      <p className="text-body-sm leading-relaxed text-ink-2">{t('peer.description')}</p>
      <div className="rounded-2xl border border-line bg-card p-3.5 space-y-3">
      <p className="text-caption text-ink-3">{t('peer.experimental')}</p>
      {!peerSupported && <p role="status" className="text-body-sm leading-relaxed text-ink-2">{t('peer.unsupported')}</p>}
      <div className="flex items-center justify-between gap-3">
        <span className="text-[14px] font-medium leading-snug">{t('peer.enable')}</span>
        <Switch hideLabel disabled={busy || !peerSupported} label={t('peer.enable')} checked={enabled} onChange={value => { setEnabled(value); setOutgoing(''); setIncoming(''); setPeers([]); setError(null); setStatus('disconnected') }}/>
      </div>
      </div>
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
    </>}
    {error && <p role="alert" className="mt-3 break-words text-body-sm text-ink">{t('desktop.error.operation')}</p>}
  </div>
}
