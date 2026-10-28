import { useEffect, useRef, type RefObject } from 'react'

const SELECTOR = 'button:not(:disabled), input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), a[href], summary, [tabindex]:not([tabindex="-1"]):not(:disabled)'

interface Entry { panel: HTMLElement; root: HTMLElement }
const dialogs = new Set<Entry>()
const background = new Map<HTMLElement, boolean>()
let activeDialog: Entry | undefined
let savedOverflow: string | null = null

function topDialog(): Entry | undefined {
  return [...dialogs].filter(entry => entry.panel.isConnected).sort((a, b) => {
    const depth = (Number.parseInt(getComputedStyle(a.root).zIndex) || 0) - (Number.parseInt(getComputedStyle(b.root).zIndex) || 0)
    return depth || (a.root.compareDocumentPosition(b.root) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1)
  }).at(-1)
}

// Recompute from the top layer. Reference snapshots per dialog break when a lazy
// fallback/parent unmounts before its child; restoring the current stack does not.
function updateBackground(): void {
  for (const [element, previous] of background) element.toggleAttribute('inert', previous)
  background.clear()
  activeDialog = topDialog()
  if (activeDialog) {
    savedOverflow ??= document.body.style.overflow
    document.body.style.overflow = 'hidden'
  } else if (savedOverflow !== null) {
    document.body.style.overflow = savedOverflow
    savedOverflow = null
  }
  let current: HTMLElement | null = activeDialog?.root ?? null
  while (current?.parentElement && current !== document.body) {
    for (const sibling of current.parentElement.children) {
      if (sibling !== current && sibling instanceof HTMLElement) {
        background.set(sibling, sibling.hasAttribute('inert'))
        sibling.setAttribute('inert', '')
      }
    }
    current = current.parentElement
  }
}

/** Shared modal behavior for settings, lazy-loading dialogs and focus mode. */
export function useDialogFocus(open: boolean, panel: RefObject<HTMLElement | null>, onClose: () => void): void {
  const close = useRef(onClose)
  useEffect(() => { close.current = onClose }, [onClose])

  useEffect(() => {
    const element = panel.current
    if (!open || !element) return
    const previousFocus = document.activeElement
    const entry = { panel: element, root: element.closest<HTMLElement>('[data-dialog-root]') ?? element }
    dialogs.add(entry)
    updateBackground()
    const controls = () => Array.from(element.querySelectorAll<HTMLElement>(SELECTOR)).filter(control => {
      const style = getComputedStyle(control)
      const details = control.closest('details:not([open])')
      return !control.closest('[hidden], [inert]') && style.display !== 'none' && style.visibility !== 'hidden' && (!details || control.tagName === 'SUMMARY')
    })
    if (topDialog() === entry) (controls()[0] ?? element).focus()
    const keydown = (event: KeyboardEvent) => {
      if (event.isComposing || event.defaultPrevented || topDialog() !== entry) return
      if (event.key === 'Escape') {
        event.stopPropagation()
        event.preventDefault()
        close.current()
      } else if (event.key === 'Tab') {
        const list = controls()
        const first = list[0] ?? element
        const last = list.at(-1) ?? element
        if (!list.length || !element.contains(document.activeElement) || (event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
          event.preventDefault()
          ;(event.shiftKey ? last : first).focus()
        }
      }
    }
    // A disabled pending action can move focus to body. The top dialog still
    // owns Escape and must recover focus on the next Tab in that case.
    document.addEventListener('keydown', keydown)
    return () => {
      document.removeEventListener('keydown', keydown)
      const wasTop = activeDialog === entry
      dialogs.delete(entry)
      updateBackground()
      if (wasTop) {
        if (previousFocus instanceof HTMLElement && previousFocus.isConnected && !previousFocus.closest('[inert]')) previousFocus.focus()
        else (topDialog()?.panel.querySelector<HTMLElement>(SELECTOR) ?? document.querySelector<HTMLElement>('nav button[aria-current="page"]'))?.focus()
      }
    }
  }, [open, panel])
}
