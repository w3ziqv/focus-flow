import { useRef } from 'react'
import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useI18n } from '../lib/i18n'
import { PillButton } from './PillButton'
import { useDialogFocus } from './useDialogFocus'

interface FocusOverlayProps {
  open: boolean
  onClose: () => void
  children: ReactNode
}

export function FocusOverlay({ open, onClose, children }: FocusOverlayProps): React.JSX.Element | null {
  const { t } = useI18n()
  const panelRef = useRef<HTMLDivElement>(null)
  useDialogFocus(open, panelRef, onClose)
  if (!open) return null

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={t('focus.enter')}
      tabIndex={-1}
      className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-10 overflow-y-auto bg-page p-6"
    >
      <PillButton variant="secondary" className="absolute top-6 left-6" onClick={onClose}>
        <ArrowLeft size={16} aria-hidden="true" />
        {t('focus.exit')}
      </PillButton>
      {children}
    </div>
  )
}
