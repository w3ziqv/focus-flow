import { useRef, useId } from 'react'
import type { ReactNode } from 'react'
import { useI18n } from '../lib/i18n'
import { X } from 'lucide-react'
import { useDialogFocus } from './useDialogFocus'

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
  useDialogFocus(open, panelRef, onClose)

  if (!open) return null

  return (
    <div data-dialog-root className="fixed inset-0 z-50 grid place-items-center p-4">
      <div aria-hidden="true" className="absolute inset-0 bg-page/70 backdrop-blur-sm modal-backdrop" onMouseDown={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="dialog-panel modal-in"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="absolute top-3 right-3 flex size-target items-center justify-center rounded-control text-ink-2 transition-colors duration-150 hover:bg-sunken hover:text-ink"
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
