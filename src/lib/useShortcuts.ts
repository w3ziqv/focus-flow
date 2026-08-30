import { useEffect } from 'react'

interface ShortcutHandlers {
  toggle: () => void
  reset: () => void
  focusMode: () => void
  escape: () => void
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

export function useShortcuts(handlers: ShortcutHandlers): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing || event.metaKey || event.ctrlKey || event.altKey) return
      if (isTypingTarget(event.target)) {
        if (event.key === 'Escape') {
          ;(event.target as HTMLElement).blur()
        }
        return
      }
      if (event.key === ' ' && isActivatable(event.target)) return
      switch (event.key) {
        case ' ':
          event.preventDefault()
          handlers.toggle()
          break
        case 'r':
        case 'R':
          handlers.reset()
          break
        case 'f':
        case 'F':
          handlers.focusMode()
          break
        case 'Escape':
          handlers.escape()
          break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handlers])
}
