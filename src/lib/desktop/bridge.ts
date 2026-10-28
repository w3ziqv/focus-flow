import { useEffect, useRef, useState } from 'react'
import { canonical } from './crdt'
import { loadSettings } from '../storage'
import type { TimerEngine } from '../timer'
import type { Lang, Theme, Settings } from '../../types'
import { detectPlatform } from '../platform'
import { flushPersistence, getPersistenceError, nativeInvoke } from './runtime'
import type { TranslationKey } from '../translations'

export interface TimerDisplay {
  mode: string; modeLabel: string; remainingMs: number; totalMs: number
  running: boolean; task: string; theme: Theme; lang: Lang
  toggleLabel: string; resetLabel: string; showLabel: string; closeLabel: string
}
export function useDesktopBridge(engine: TimerEngine, theme: Theme, lang: Lang, t: (key: TranslationKey) => string, openPreferences: (open: boolean) => void): { error: string | null; nativeError: boolean; dismiss: () => void } {
  const { running, settings: currentSettings, updateSettings } = engine
  const latest = useRef(engine)
  const pendingSettings = useRef<Settings | null>(null)
  const [nativeError, setNativeError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(getPersistenceError)
  useEffect(() => { latest.current = engine }, [engine])
  useEffect(() => {
    if (!running && pendingSettings.current) {
      const settings = pendingSettings.current
      pendingSettings.current = null
      if (canonical(settings) !== canonical(currentSettings)) updateSettings(settings)
    }
  }, [running, currentSettings, updateSettings])
  useEffect(() => {
    if (detectPlatform() !== 'tauri') return
    let cancelled = false
    const disposers: (() => void)[] = []
    const onError = (event: Event) => setError((event as CustomEvent<string | null>).detail)
    window.addEventListener('focus-flow:persistence', onError)
    const onPeerSync = () => {
      latest.current.refreshStats()
      const settings = loadSettings()
      if (canonical(settings) !== canonical(latest.current.settings)) {
        if (latest.current.running) pendingSettings.current = settings
        else latest.current.updateSettings(settings)
      } else pendingSettings.current = null
    }
    window.addEventListener('focus-flow:peer-sync', onPeerSync)
    void import('@tauri-apps/api/event').then(async ({ listen }) => {
      const unlisten = await listen<string>('desktop-action', async ({ payload }) => {
        if (cancelled) return
        if (payload === 'toggle') latest.current.toggle()
        else if (payload === 'reset') latest.current.reset()
        else if (payload === 'skip') latest.current.skip()
        else if (payload === 'preferences') openPreferences(true)
        else if (payload === 'quit') {
          try { await flushPersistence(); await nativeInvoke('finish_exit') }
          catch (failure) { setError(String(failure)) }
        }
      })
      if (cancelled) unlisten(); else disposers.push(unlisten)
      const stopErrors = await listen<string>('desktop-error', ({ payload }) => { if (!cancelled) setNativeError(payload) })
      if (cancelled) stopErrors(); else disposers.push(stopErrors)
    }).catch(failure => { if (!cancelled) setNativeError(String(failure)) })
    void nativeInvoke<string[]>('desktop_warnings').then(warnings => { if (warnings.length && !cancelled) setNativeError(warnings.join('\n')) }).catch(failure => { if (!cancelled) setNativeError(String(failure)) })
    return () => { cancelled = true; disposers.forEach(dispose => dispose()); window.removeEventListener('focus-flow:persistence', onError); window.removeEventListener('focus-flow:peer-sync', onPeerSync) }
  }, [openPreferences])
  const seconds = Math.ceil(engine.remainingMs / 1000)
  useEffect(() => {
    if (detectPlatform() !== 'tauri') return
    const timer: TimerDisplay = {
      mode: engine.mode, modeLabel: t(`mode.${engine.mode}`), remainingMs: seconds * 1000,
      totalMs: engine.totalMs, running: engine.running, task: engine.task, theme, lang,
      toggleLabel: t(engine.running ? 'timer.pause' : 'timer.start'), resetLabel: t('timer.reset'),
      showLabel: t('desktop.show'), closeLabel: t('desktop.closeMini'),
    }
    void nativeInvoke('publish_timer', { timer }).catch(failure => setNativeError(String(failure)))
  }, [seconds, engine.mode, engine.totalMs, engine.running, engine.task, theme, lang, t])
  const message: TranslationKey = nativeError?.startsWith('Wake lock') ? 'desktop.error.awake' : nativeError?.startsWith('Tray') ? 'desktop.error.tray' : nativeError?.startsWith('Shortcut') ? 'desktop.error.shortcut' : nativeError ? 'desktop.error.operation' : 'desktop.error.storage'
  return { error: nativeError || error ? t(message) : null, nativeError: nativeError !== null, dismiss: () => setNativeError(null) }
}
