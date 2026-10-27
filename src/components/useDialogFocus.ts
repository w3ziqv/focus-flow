import { useEffect, useRef, type RefObject } from 'react'

const SELECTOR = 'button:not(:disabled), input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), a[href], summary, [tabindex]:not([tabindex="-1"]):not(:disabled)'

/** Shared modal behavior for settings, lazy-loading dialogs and focus mode. */
export function useDialogFocus(open: boolean, panel: RefObject<HTMLElement | null>, onClose: () => void): void {
  const close = useRef(onClose)
  useEffect(() => { close.current = onClose }, [onClose])

  useEffect(() => {
    const element = panel.current
    if (!open || !element) return
    const previousFocus = document.activeElement
    const inert: Array<{ element: HTMLElement; previous: boolean }> = []
    let current: HTMLElement | null = element.closest<HTMLElement>('[data-dialog-root]') ?? element
    while (current?.parentElement && current !== document.body) {
      for (const sibling of current.parentElement.children) {
        if (sibling !== current && sibling instanceof HTMLElement) {
          inert.push({ element: sibling, previous: sibling.hasAttribute('inert') })
          sibling.setAttribute('inert', '')
        }
      }
      current = current.parentElement
    }
    const controls = () => Array.from(element.querySelectorAll<HTMLElement>(SELECTOR)).filter(control => {
      const style = getComputedStyle(control)
      const details = control.closest('details:not([open])')
      return !control.closest('[hidden], [inert]') && style.display !== 'none' && style.visibility !== 'hidden' && (!details || control.tagName === 'SUMMARY')
    })
    ;(controls()[0] ?? element).focus()
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        event.preventDefault()
        close.current()
      } else if (event.key === 'Tab') {
        const list = controls()
        const first = list[0] ?? element
        const last = list.at(-1) ?? element
        if (!list.length || (event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
          event.preventDefault()
          ;(event.shiftKey ? last : first).focus()
        }
      }
    }
    element.addEventListener('keydown', keydown)
    return () => {
      element.removeEventListener('keydown', keydown)
      for (const item of inert) {
        if (!item.previous) item.element.removeAttribute('inert')
      }
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus()
    }
  }, [open, panel])
}
