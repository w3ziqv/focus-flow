import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { Pause, Play, ExternalLink } from 'lucide-react'
import { nativeInvoke } from '../lib/desktop/runtime'
import type { TimerDisplay } from '../lib/desktop/bridge'
import { applyTheme } from '../lib/theme'

export default function MiniDial(): JSX.Element {
  const [timer, setTimer] = useState<TimerDisplay | null>(null)
  const [focused, setFocused] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    let dispose: (() => void) | undefined
    void import('@tauri-apps/api/event').then(async ({ listen }) => {
      const unlisten = await listen<TimerDisplay>('timer-display', event => { if (!cancelled) setTimer(event.payload) })
      if (cancelled) { unlisten(); return }
      dispose = unlisten
      const current = await nativeInvoke<TimerDisplay | null>('timer_display')
      if (!cancelled) setTimer(current)
    }).catch(failure => { if (!cancelled) setError(String(failure)) })
    const onFocus = () => setFocused(true)
    const onBlur = () => setFocused(false)
    window.addEventListener('focus', onFocus); window.addEventListener('blur', onBlur)
    return () => { cancelled = true; dispose?.(); window.removeEventListener('focus', onFocus); window.removeEventListener('blur', onBlur) }
  }, [])
  useEffect(() => {
    if (timer) { applyTheme(timer.theme); document.documentElement.lang = timer.lang }
    document.documentElement.style.background = 'transparent'
    document.body.style.background = 'transparent'
    document.body.style.minWidth = '0'
  }, [timer])
  const send = (name: string) => { void nativeInvoke('desktop_action', { name }).catch(failure => setError(String(failure))) }
  const seconds = Math.ceil((timer?.remainingMs ?? 0) / 1000)
  return <div className={`flex h-20 w-[220px] items-center rounded-2xl border border-line bg-page px-2 text-ink transition-opacity ${focused ? 'opacity-100' : 'opacity-70'}`}>
    <div data-tauri-drag-region className="min-w-0 flex-1 pl-2">
      <div data-tauri-drag-region className="truncate text-caption text-ink-2">{timer?.modeLabel ?? 'Focus Flow'}</div>
      <div data-tauri-drag-region className="font-serif text-[28px] leading-none tabular-nums">{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</div>
    </div>
    <button className="flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-sunken" aria-label={timer?.toggleLabel ?? 'Start / Pause'} onClick={() => send('toggle')}>{timer?.running ? <Pause size={18}/> : <Play size={18}/>}</button>
    <button className="flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-sunken" aria-label={timer?.showLabel ?? 'Show Focus Flow'} onClick={() => send('show')}><ExternalLink size={16}/></button>
    {error && <span role="alert" className="sr-only">{error}</span>}
  </div>
}
