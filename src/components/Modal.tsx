import { useEffect, useRef, useId } from 'react'
import type { ReactNode } from 'react'
import { useI18n } from '../lib/i18n'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export function Modal({ open, title, onClose, children }: ModalProps): React.JSX.Element | null {
  const {t} = useI18n()
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    previouslyFocused.current = document.activeElement as HTMLElement | null
    const inert: Array<{element: HTMLElement; previous: boolean}> = []
    let current = panelRef.current?.parentElement
    while (current?.parentElement && current !== document.body) {
      for (const sibling of current.parentElement.children) {
        if (sibling !== current && sibling instanceof HTMLElement) {
          inert.push({element: sibling, previous: sibling.inert})
          sibling.inert = true
        }
      }
      current = current.parentElement
    }
    const id = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>('input, button')
      first?.focus()
    }, 80)
    return () => {window.clearTimeout(id); for (const item of inert) item.element.inert = item.previous; if (previouslyFocused.current?.isConnected) previouslyFocused.current.focus()}
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div aria-hidden="true" className="absolute inset-0 bg-page/70 backdrop-blur-sm modal-backdrop" onMouseDown={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative max-h-[85dvh] w-full max-w-sm overflow-y-auto rounded-[20px] border border-line bg-elevated p-6 shadow-whisper modal-in"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation()
            onClose()
            return
          }
          if (event.key !== 'Tab') return
          const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], summary, [tabindex]:not([tabindex="-1"]):not([disabled])',
          )
          if (!focusables || focusables.length === 0) return
          const list = Array.from(focusables)
          const first = list[0]
          const last = list[list.length - 1]
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault()
            last.focus()
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault()
            first.focus()
          }
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full text-ink-2 transition-colors duration-150 hover:bg-sunken hover:text-ink"
        >
          <X size={16} aria-hidden="true" />
        </button>
        <h2 id={titleId} className="mb-5 pr-10 font-serif text-[1.5rem] font-[500] text-ink">
          {title}
        </h2>
        {children}
      </div>
    </div>
  )
}
