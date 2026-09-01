import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useI18n } from '../lib/i18n'
import { PillButton } from './PillButton'

interface FocusOverlayProps {
  open: boolean
  onClose: () => void
  children: ReactNode
}

export function FocusOverlay({ open, onClose, children }: FocusOverlayProps): React.JSX.Element {
  const { t } = useI18n()
  const exitRef = useRef<HTMLButtonElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (open) {
      previouslyFocused.current = document.activeElement as HTMLElement | null
      const id = window.setTimeout(() => exitRef.current?.focus(), 80)
      return () => window.clearTimeout(id)
    }
    previouslyFocused.current?.focus()
    return undefined
  }, [open])

  return (
    <div
      aria-hidden={!open}
      inert={!open}
      className={`fixed inset-0 z-40 flex flex-col items-center justify-center gap-10 bg-page transition-all duration-500 [transition-timing-function:var(--ease-emphasis)] ${
        open ? 'scale-100 opacity-100' : 'pointer-events-none scale-[1.03] opacity-0'
      }`}
    >
      <PillButton ref={exitRef} variant="secondary" className="absolute top-6 left-6" onClick={onClose}>
        <ArrowLeft size={16} aria-hidden="true" />
        {t('focus.exit')}
      </PillButton>
      {children}
    </div>
  )
}
