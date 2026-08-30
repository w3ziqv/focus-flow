import { useEffect, useRef, useState } from 'react'
import type { Settings } from '../types'
import { useI18n } from '../lib/i18n'
import { PillButton } from './PillButton'
import { Switch } from './Switch'

interface SettingsModalProps {
  open: boolean
  settings: Settings
  onSave: (settings: Settings) => void
  onClose: () => void
}

const fieldClass =
  'w-full rounded-xl border border-line bg-card px-3 py-2 text-right text-[15px] text-ink tnum outline-none transition-colors duration-150 focus:border-[var(--ac)]'

export function SettingsModal({ open, settings, onSave, onClose }: SettingsModalProps) {
  const { t } = useI18n()
  const [draft, setDraft] = useState<Settings>(settings)
  const panelRef = useRef<HTMLDivElement>(null)
  const [wasOpen, setWasOpen] = useState(false)

  if (open && !wasOpen) {
    setWasOpen(true)
    setDraft(settings)
  }
  if (!open && wasOpen) {
    setWasOpen(false)
  }

  useEffect(() => {
    if (open) {
      const first = panelRef.current?.querySelector<HTMLInputElement>('input')
      first?.focus()
    }
  }, [open])

  if (!open) return null

  const numberField = (key: 'focus' | 'short' | 'long' | 'rounds', label: string, min: number, max: number) => (
    <div className="flex flex-col gap-1">
      <label htmlFor={`settings-${key}`} className="text-caption text-ink-2">
        {label}
      </label>
      <input
        id={`settings-${key}`}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={draft[key]}
        onChange={(event) => {
          const parsed = Number.parseInt(event.target.value, 10)
          setDraft((prev) => ({ ...prev, [key]: Number.isFinite(parsed) ? parsed : min }))
        }}
        className={fieldClass}
      />
    </div>
  )

  const clampDraft = (): Settings => ({
    focus: Math.min(120, Math.max(1, Math.round(draft.focus) || 1)),
    short: Math.min(60, Math.max(1, Math.round(draft.short) || 1)),
    long: Math.min(120, Math.max(1, Math.round(draft.long) || 1)),
    rounds: Math.min(20, Math.max(1, Math.round(draft.rounds) || 1)),
    autoStart: draft.autoStart,
  })

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-page/70 backdrop-blur-sm modal-backdrop" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="relative w-full max-w-sm rounded-[20px] border border-line bg-elevated p-6 shadow-whisper modal-in"
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
        <h2 id="settings-title" className="mb-5 font-serif text-[1.5rem] font-[500] text-ink">
          {t('settings.title')}
        </h2>
        <div className="flex flex-col gap-4">
          {numberField('focus', t('settings.focus'), 1, 120)}
          {numberField('short', t('settings.short'), 1, 60)}
          {numberField('long', t('settings.long'), 1, 120)}
          {numberField('rounds', t('settings.rounds'), 1, 20)}
          <Switch
            checked={draft.autoStart}
            onChange={(autoStart) => setDraft((prev) => ({ ...prev, autoStart }))}
            label={t('settings.autoStart')}
          />
        </div>
        <div className="mt-6 flex items-center justify-end gap-2">
          <PillButton variant="secondary" onClick={onClose}>
            {t('settings.cancel')}
          </PillButton>
          <PillButton variant="primary" onClick={() => onSave(clampDraft())}>
            {t('settings.save')}
          </PillButton>
        </div>
      </div>
    </div>
  )
}
