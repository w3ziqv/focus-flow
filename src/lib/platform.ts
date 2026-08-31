export type Platform = 'tauri' | 'electron' | 'pwa' | 'browser'
export type OS = 'ios' | 'android' | 'desktop'

/**
 * Runtime capability seam (docs/ARCHITECTURE.md ADR-006).
 * Platform-specific adapters (file storage, native notifications, tray)
 * branch on this value instead of feature-detecting all over the codebase.
 */
export function detectPlatform(): Platform {
  const w = window as Window & { __TAURI_INTERNALS__?: unknown; __TAURI__?: unknown }
  if ('__TAURI_INTERNALS__' in w || '__TAURI__' in w) return 'tauri'
  if (typeof navigator !== 'undefined' && navigator.userAgent.includes('Electron')) return 'electron'
  if (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) {
    return 'pwa'
  }
  return 'browser'
}

/**
 * iPadOS 13+ reports a desktop Mac UA — `maxTouchPoints > 1` is the tell.
 */
export function detectOS(): OS {
  if (typeof navigator === 'undefined') return 'desktop'
  const ua = navigator.userAgent
  const iPadOS = ua.includes('Macintosh') && navigator.maxTouchPoints > 1
  if (/iPhone|iPad|iPod/.test(ua) || iPadOS) return 'ios'
  if (ua.includes('Android')) return 'android'
  return 'desktop'
}
