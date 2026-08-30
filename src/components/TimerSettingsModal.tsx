import { useEffect, useRef, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import type { Settings } from '../types'
import { useI18n } from '../lib/i18n'
import { Modal } from './Modal'
import { PillButton } from './PillButton'
import { Switch } from './Switch'

interface TimerSettingsModalProps {
  open: boolean
  settings: Settings
  onSave: (settings: Settings) => void
  onClose: () => void
}

const fieldClass =
  'no-spin w-full rounded-xl border border-line bg-card px-3 py-2 text-center text-base text-ink tnum outline-none transition-colors duration-150 focus:border-[var(--ac)]'

const stepButtonClass =
  'flex size-9 shrink-0 items-center justify-center rounded-full text-ink-2 transition-colors duration-150 [transition-timing-function:var(--ease-micro)] hover:bg-sunken hover:text-ink disabled:pointer-events-none disabled:opacity-30'

export function TimerSettingsModal({ open, settings, onSave, onClose }: TimerSettingsModalProps) {
  const { t } = useI18n()
  const [draft, setDraft] = useState<Settings>(settings)
  const [wasOpen, setWasOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

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

  const numberField = (key: 'focus' | 'short' | 'long' | 'rounds', label: string, min: number, max: number) => {
    const bump = (delta: number) => {
      setDraft((prev) => ({ ...prev, [key]: Math.min(max, Math.max(min, prev[key] + delta)) }))
    }
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={`timer-settings-${key}`} className="text-caption text-ink-2">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={`${t('settings.decrease')} — ${label}`}
            onClick={() => bump(-1)}
            disabled={draft[key] <= min}
            className={stepButtonClass}
          >
            <Minus size={14} aria-hidden="true" />
          </button>
          <input
            id={`timer-settings-${key}`}
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
          <button
            type="button"
            aria-label={`${t('settings.increase')} — ${label}`}
            onClick={() => bump(1)}
            disabled={draft[key] >= max}
            className={stepButtonClass}
          >
            <Plus size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    )
  }

  const clampDraft = (): Settings => ({
    focus: Math.min(120, Math.max(1, Math.round(draft.focus) || 1)),
    short: Math.min(60, Math.max(1, Math.round(draft.short) || 1)),
    long: Math.min(120, Math.max(1, Math.round(draft.long) || 1)),
    rounds: Math.min(20, Math.max(1, Math.round(draft.rounds) || 1)),
    autoStart: draft.autoStart,
  })

  return (
    <Modal open={open} onClose={onClose} title={t('settings.timer')}>
      <div ref={panelRef} className="flex flex-col gap-4">
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
    </Modal>
  )
}
