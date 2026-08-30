export type Platform = 'tauri' | 'electron' | 'pwa' | 'browser'

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
