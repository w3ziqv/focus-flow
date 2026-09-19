import { useEffect } from 'react'
import type { ShortcutKeymap } from '../types'

export interface ShortcutHandlers {
  toggle: () => void
  reset: () => void
  focusMode: () => void
  escape: () => void
  openShortcuts?: () => void
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

/** Space natively activates focused buttons and links — let the browser do it. */
function isActivatable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'BUTTON' || tag === 'A' || tag === 'SUMMARY') return true
  const role = target.getAttribute('role')
  return role === 'button' || role === 'switch' || role === 'tab'
}

export function useShortcuts(handlers: ShortcutHandlers, keymap?: ShortcutKeymap): void {
  const toggleKey = keymap?.toggleTimer ?? ' '
  const resetKey = (keymap?.resetTimer ?? 'r').toLowerCase()
  const focusKey = (keymap?.toggleFullscreen ?? 'f').toLowerCase()
  const helpKey = keymap?.openSettings ?? '?'

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing || event.metaKey || event.ctrlKey || event.altKey) return
      if (isTypingTarget(event.target)) {
        if (event.key === 'Escape') {
          ;(event.target as HTMLElement).blur()
        }
        return
      }

      const key = event.key
      const keyLower = key.toLowerCase()

      // Handle Escape first
      if (key === 'Escape') {
        handlers.escape()
        return
      }

      // Handle Help / Shortcuts modal ('?' or custom)
      if (key === helpKey || key === '?') {
        if (handlers.openShortcuts) {
          event.preventDefault()
          handlers.openShortcuts()
          return
        }
      }

      // Handle Toggle
      if (key === toggleKey || (toggleKey === ' ' && key === ' ')) {
        if (isActivatable(event.target)) return
        event.preventDefault()
        handlers.toggle()
        return
      }

      // Handle Reset
      if (keyLower === resetKey) {
        handlers.reset()
        return
      }

      // Handle Focus Mode
      if (keyLower === focusKey) {
        handlers.focusMode()
        return
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handlers, toggleKey, resetKey, focusKey, helpKey])
}
