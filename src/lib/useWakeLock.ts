import { detectPlatform } from './platform'
import { nativeInvoke, getPersistence } from './desktop/runtime'
import { useEffect } from 'react'

type WakeLockSentinelLike = { release: () => Promise<void> }
type NavigatorWithWakeLock = Navigator & {
  wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> }
}

/**
 * Keeps the screen awake while `active` (a running session).
 * Mobile timers that let the screen sleep get missed — this re-acquires the
 * lock whenever the tab becomes visible again (OS releases it on hide).
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (detectPlatform() === 'tauri') {
      void nativeInvoke('set_awake', { active: active && getPersistence().getItem('ff3_awake') !== 'false' }).catch(error => window.dispatchEvent(new CustomEvent('focus-flow:persistence', { detail: String(error) })))
      return () => { void nativeInvoke('set_awake', { active: false }).catch(() => {}) }
    }
    if (!active) return
    const nav = navigator as NavigatorWithWakeLock
    if (!nav.wakeLock) return

    let sentinel: WakeLockSentinelLike | null = null
    let cancelled = false

    const acquire = () => {
      nav.wakeLock
        ?.request('screen')
        .then((s) => {
          if (cancelled) void s.release()
          else sentinel = s
        })
        .catch(() => {
          // Denied or dropped (low battery, screen off) — the timer is deadline-based and loses nothing.
        })
    }

    acquire()
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !sentinel) acquire()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      void sentinel?.release().catch(() => {})
      sentinel = null
    }
  }, [active])
}
