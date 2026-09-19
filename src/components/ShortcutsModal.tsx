import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { RotateCcw } from 'lucide-react'
import { Modal } from './Modal'
import { PillButton } from './PillButton'
import { useI18n } from '../lib/i18n'
import type { TranslationKey } from '../lib/translations'
import { DEFAULT_SHORTCUTS } from '../types'
import type { ShortcutKeymap } from '../types'

export interface ShortcutsModalProps {
  open: boolean
  shortcuts?: ShortcutKeymap
  onSaveShortcuts: (shortcuts: ShortcutKeymap) => void
  onClose: () => void
}

type RebindingAction = keyof ShortcutKeymap | null

export function ShortcutsModal({
  open,
  shortcuts = DEFAULT_SHORTCUTS,
  onSaveShortcuts,
  onClose,
}: ShortcutsModalProps): JSX.Element | null {
  const { t } = useI18n()
  const [rebinding, setRebinding] = useState<RebindingAction>(null)

  useEffect(() => {
    if (!rebinding) return

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      // Disallow modifier keys or Escape as custom shortcuts
      if (['Escape', 'Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) {
        setRebinding(null)
        return
      }

      const newKey = e.key === ' ' ? ' ' : e.key.toLowerCase()
      onSaveShortcuts({
        ...shortcuts,
        [rebinding]: newKey,
      })
      setRebinding(null)
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [rebinding, shortcuts, onSaveShortcuts])

  if (!open) return null

  const formatKeyDisplay = (key: string): string => {
    if (key === ' ') return 'Space'
    return key.toUpperCase()
  }

  const handleResetDefaults = () => {
    onSaveShortcuts({ ...DEFAULT_SHORTCUTS })
    setRebinding(null)
  }

  return (
    <Modal open={open} onClose={onClose} title={t('shortcuts.title')}>
      <p className="text-[13px] text-ink-2 leading-relaxed mb-5">
        {t('shortcuts.desc')}
      </p>

      <div className="space-y-4">
        {/* Timer Actions */}
        <div>
          <h3 className="text-overline text-ink-3 mb-2">{t('shortcuts.timerSection')}</h3>
          <div className="divide-y divide-line/60 rounded-xl border border-line bg-card overflow-hidden">
            <div className="flex items-center justify-between p-3 min-h-[48px]">
              <span className="text-[14px] text-ink font-medium">{t('shortcuts.toggleTimer')}</span>
              <button
                type="button"
                onClick={() => setRebinding('toggleTimer')}
                className={`min-h-[44px] min-w-[56px] px-3 py-1.5 rounded-lg border text-caption font-mono transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  rebinding === 'toggleTimer'
                    ? 'border-accent bg-accent-soft text-accent-strong animate-pulse'
                    : 'border-line bg-page hover:bg-sunken text-ink'
                }`}
                aria-label={`${t('shortcuts.toggleTimer')} (${formatKeyDisplay(shortcuts.toggleTimer)})`}
              >
                {rebinding === 'toggleTimer' ? t('shortcuts.pressKey') : formatKeyDisplay(shortcuts.toggleTimer)}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 min-h-[48px]">
              <span className="text-[14px] text-ink font-medium">{t('shortcuts.resetTimer')}</span>
              <button
                type="button"
                onClick={() => setRebinding('resetTimer')}
                className={`min-h-[44px] min-w-[56px] px-3 py-1.5 rounded-lg border text-caption font-mono transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  rebinding === 'resetTimer'
                    ? 'border-accent bg-accent-soft text-accent-strong animate-pulse'
                    : 'border-line bg-page hover:bg-sunken text-ink'
                }`}
                aria-label={`${t('shortcuts.resetTimer')} (${formatKeyDisplay(shortcuts.resetTimer)})`}
              >
                {rebinding === 'resetTimer' ? t('shortcuts.pressKey') : formatKeyDisplay(shortcuts.resetTimer)}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 min-h-[48px]">
              <span className="text-[14px] text-ink font-medium">{t('shortcuts.toggleFullscreen')}</span>
              <button
                type="button"
                onClick={() => setRebinding('toggleFullscreen')}
                className={`min-h-[44px] min-w-[56px] px-3 py-1.5 rounded-lg border text-caption font-mono transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  rebinding === 'toggleFullscreen'
                    ? 'border-accent bg-accent-soft text-accent-strong animate-pulse'
                    : 'border-line bg-page hover:bg-sunken text-ink'
                }`}
                aria-label={`${t('shortcuts.toggleFullscreen')} (${formatKeyDisplay(shortcuts.toggleFullscreen)})`}
              >
                {rebinding === 'toggleFullscreen' ? t('shortcuts.pressKey') : formatKeyDisplay(shortcuts.toggleFullscreen)}
              </button>
            </div>
          </div>
        </div>

        {/* Global / Navigation Actions */}
        <div>
          <h3 className="text-overline text-ink-3 mb-2">{t('shortcuts.generalSection')}</h3>
          <div className="divide-y divide-line/60 rounded-xl border border-line bg-card overflow-hidden">
            <div className="flex items-center justify-between p-3 min-h-[48px]">
              <span className="text-[14px] text-ink font-medium">{t('shortcuts.openSettings')}</span>
              <button
                type="button"
                onClick={() => setRebinding('openSettings')}
                className={`min-h-[44px] min-w-[56px] px-3 py-1.5 rounded-lg border text-caption font-mono transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  rebinding === 'openSettings'
                    ? 'border-accent bg-accent-soft text-accent-strong animate-pulse'
                    : 'border-line bg-page hover:bg-sunken text-ink'
                }`}
                aria-label={`${t('shortcuts.openSettings')} (${formatKeyDisplay(shortcuts.openSettings)})`}
              >
                {rebinding === 'openSettings' ? t('shortcuts.pressKey') : formatKeyDisplay(shortcuts.openSettings)}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 min-h-[48px]">
              <span className="text-[14px] text-ink font-medium">{t('shortcuts.closeModal')}</span>
              <kbd className="inline-flex min-h-[32px] items-center px-2.5 rounded border border-line bg-sunken text-caption font-mono text-ink-2">
                Esc
              </kbd>
            </div>

            <div className="flex items-center justify-between p-3 min-h-[48px]">
              <span className="text-[14px] text-ink font-medium">{t('shortcuts.steppers')}</span>
              <kbd className="inline-flex min-h-[32px] items-center px-2.5 rounded border border-line bg-sunken text-caption font-mono text-ink-2">
                ↑ / ↓
              </kbd>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
        <button
          type="button"
          onClick={handleResetDefaults}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3 text-[13px] font-medium text-ink-2 hover:text-ink hover:bg-sunken transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <RotateCcw size={14} aria-hidden="true" />
          {t('shortcuts.resetDefaults')}
        </button>
        <PillButton variant="primary" onClick={onClose}>
          {t('common.done' as TranslationKey)}
        </PillButton>
      </div>
    </Modal>
  )
}
