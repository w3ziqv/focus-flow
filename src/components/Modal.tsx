import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export function Modal({ open, title, onClose, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    previouslyFocused.current = document.activeElement as HTMLElement | null
    const id = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>('input, button')
      first?.focus()
    }, 80)
    return () => window.clearTimeout(id)
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div aria-hidden="true" className="absolute inset-0 bg-page/70 backdrop-blur-sm modal-backdrop" onMouseDown={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative max-h-[85dvh] w-full max-w-sm overflow-y-auto rounded-[20px] border border-line bg-elevated p-6 shadow-whisper modal-in"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation()
            onClose()
            return
          }
          if (event.key !== 'Tab') return
          const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
            'button, input, [tabindex]:not([tabindex="-1"])',
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
        <h2 id="modal-title" className="mb-5 font-serif text-[1.5rem] font-[500] text-ink">
          {title}
        </h2>
        {children}
      </div>
    </div>
  )
}
