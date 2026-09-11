import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Check, CheckCircle2, Plus, X } from 'lucide-react'
import { useI18n } from '../lib/i18n'
import type { TranslationKey } from '../lib/translations'
import type { ChecklistItem, TaskPreset } from '../types'

export interface TaskFieldProps {
  phase: 'draft' | 'running' | 'done'
  value: string
  greeting: string
  onChange: (value: string) => void
  checklist?: ChecklistItem[]
  onChecklistChange?: (checklist: ChecklistItem[]) => void
  onAddChecklistItem?: (text: string) => void
  onToggleChecklistItem?: (id: string) => void
  onRemoveChecklistItem?: (id: string) => void
  presets?: TaskPreset[]
  onSelectPreset?: (preset: TaskPreset) => void
}

function getDefaultPresets(t: (key: TranslationKey) => string): TaskPreset[] {
  return [
    { id: 'deep-work', label: t('preset.deepWork') },
    { id: 'writing', label: t('preset.writing') },
    { id: 'code-review', label: t('preset.codeReview') },
    { id: 'reading', label: t('preset.reading') },
    { id: 'inbox-zero', label: t('preset.inboxZero') },
  ]
}

export function TaskField({
  phase,
  value,
  greeting,
  onChange,
  checklist: externalChecklist,
  onChecklistChange,
  onAddChecklistItem,
  onToggleChecklistItem,
  onRemoveChecklistItem,
  presets: externalPresets,
  onSelectPreset,
}: TaskFieldProps): React.JSX.Element {
  const { t } = useI18n()
  const inputId = useId()

  // Local state fallback if controlled props are not passed
  const [internalChecklist, setInternalChecklist] = useState<ChecklistItem[]>([])
  const checklist = externalChecklist ?? internalChecklist

  const updateChecklist = useCallback(
    (next: ChecklistItem[]): void => {
      if (onChecklistChange) {
        onChecklistChange(next)
      } else {
        setInternalChecklist(next)
      }
    },
    [onChecklistChange],
  )

  const [isAdding, setIsAdding] = useState<boolean>(false)
  const [draftText, setDraftText] = useState<string>('')
  const addInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (isAdding) {
      addInputRef.current?.focus()
    }
  }, [isAdding])

  const presetList = useMemo<TaskPreset[]>(() => {
    if (externalPresets && externalPresets.length > 0) {
      return externalPresets
    }
    return getDefaultPresets(t)
  }, [externalPresets, t])

  const handleSelectPreset = useCallback(
    (preset: TaskPreset): void => {
      const sanitized = preset.label.slice(0, 200)
      onChange(sanitized)
      onSelectPreset?.(preset)
    },
    [onChange, onSelectPreset],
  )

  const handleToggleStep = useCallback(
    (id: string): void => {
      if (onToggleChecklistItem) {
        onToggleChecklistItem(id)
      } else {
        const next = checklist.map((item) =>
          item.id === id ? { ...item, completed: !item.completed } : item,
        )
        updateChecklist(next)
      }
    },
    [checklist, onToggleChecklistItem, updateChecklist],
  )

  const handleRemoveStep = useCallback(
    (id: string): void => {
      if (onRemoveChecklistItem) {
        onRemoveChecklistItem(id)
      } else {
        const next = checklist.filter((item) => item.id !== id)
        updateChecklist(next)
      }
    },
    [checklist, onRemoveChecklistItem, updateChecklist],
  )

  const commitDraftStep = useCallback((): void => {
    const trimmed = draftText.trim().slice(0, 140)
    if (trimmed !== '' && checklist.length < 3) {
      if (onAddChecklistItem) {
        onAddChecklistItem(trimmed)
      } else {
        const newItem: ChecklistItem = {
          id: `ms_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          text: trimmed,
          completed: false,
        }
        const next = [...checklist, newItem]
        updateChecklist(next)
      }
      setDraftText('')
      if (checklist.length + 1 >= 3) {
        setIsAdding(false)
      }
    } else if (trimmed === '') {
      setIsAdding(false)
    }
  }, [checklist, draftText, onAddChecklistItem, updateChecklist])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === 'Enter') {
        e.preventDefault()
        commitDraftStep()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setDraftText('')
        setIsAdding(false)
      } else if (e.key === 'Backspace' && draftText === '') {
        e.preventDefault()
        if (checklist.length > 0) {
          if (onRemoveChecklistItem) {
            onRemoveChecklistItem(checklist[checklist.length - 1].id)
          } else {
            updateChecklist(checklist.slice(0, -1))
          }
        } else {
          setIsAdding(false)
        }
      }
    },
    [checklist, commitDraftStep, draftText, onRemoveChecklistItem, updateChecklist],
  )

  // Done Phase Rendering
  if (phase === 'done' && value.trim() !== '') {
    return (
      <div className="mx-auto w-full max-w-[380px]">
        <div className="flex min-h-[3rem] items-center justify-center gap-2 text-[15px] text-ink-2">
          <CheckCircle2 size={18} className="text-success shrink-0" aria-hidden="true" />
          <span className="truncate">
            <span className="text-ink-3">{t('task.done')}</span>{' '}
            <span className="font-medium text-ink">{value}</span>
          </span>
        </div>

        {checklist.length > 0 && (
          <div className="mt-2 space-y-1.5 px-2">
            {checklist.map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-[13px] text-ink-3">
                <span
                  className={`size-3.5 w-[14px] h-[14px] shrink-0 rounded-full border flex items-center justify-center ${
                    item.completed
                      ? 'bg-success border-success text-white'
                      : 'border-ink-3/40 bg-transparent'
                  }`}
                >
                  {item.completed && <Check size={9} strokeWidth={3} aria-hidden="true" />}
                </span>
                <span className={item.completed ? 'line-through' : ''}>{item.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Running Phase Rendering
  if (phase === 'running' && value.trim() !== '') {
    return (
      <div className="mx-auto w-full max-w-[380px]">
        <div className="flex min-h-[3rem] items-center justify-center gap-2 text-[15px]">
          <span aria-hidden="true" className="size-2 rounded-full bg-[var(--ac)] session-dot shrink-0" />
          <span className="truncate">
            <span className="text-ink-3">{t('task.committed')}</span>{' '}
            <span className="font-medium text-ink">{value}</span>
          </span>
        </div>

        {checklist.length > 0 && (
          <div className="mt-3 space-y-2 px-2" role="list" aria-label={t('microstep.aria')}>
            {checklist.map((item) => (
              <div key={item.id} className="group flex items-center gap-2.5 py-0.5">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={item.completed}
                  aria-label={item.text}
                  onClick={() => handleToggleStep(item.id)}
                  className={`size-3.5 w-[14px] h-[14px] shrink-0 rounded-full border transition-colors duration-150 [transition-timing-function:var(--ease-micro)] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] ${
                    item.completed
                      ? 'bg-[var(--ac)] border-[var(--ac)] text-white'
                      : 'border-ink-3/50 bg-transparent hover:border-ink'
                  }`}
                >
                  {item.completed && <Check size={9} strokeWidth={3} aria-hidden="true" />}
                </button>
                <div className="relative min-w-0 flex-1 text-left font-sans text-[14px]">
                  <span
                    className={`block truncate transition-colors duration-[120ms] [transition-timing-function:var(--ease-micro)] ${
                      item.completed ? 'text-ink-3' : 'text-ink'
                    }`}
                  >
                    {item.text}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`absolute left-0 top-1/2 h-[1px] w-full bg-ink-3 transition-transform duration-[120ms] [transition-timing-function:var(--ease-micro)] origin-left pointer-events-none ${
                      item.completed ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Draft Phase Rendering
  return (
    <div className="mx-auto w-full max-w-[380px]">
      <p aria-hidden="true" className="mb-1 text-center text-overline text-ink-3">
        {greeting}
      </p>
      <label htmlFor={inputId} className="sr-only">
        {t('task.placeholder')}
      </label>
      <input
        id={inputId}
        type="text"
        value={value}
        maxLength={200}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        placeholder={t('task.placeholder')}
        className="w-full border-b border-line bg-transparent py-3 text-center text-[17px] text-ink outline-none transition-colors duration-150 [transition-timing-function:var(--ease-micro)] placeholder:text-ink-3 focus:border-[var(--ac)]"
      />

      {/* Single-tap intention presets row (recedes when value is non-empty) */}
      <div
        role="group"
        aria-label={t('task.presets')}
        className={`flex flex-wrap items-center justify-center gap-1.5 overflow-hidden transition-all duration-200 [transition-timing-function:var(--ease-micro)] ${
          value.trim() === ''
            ? 'mt-3 max-h-24 opacity-100 pointer-events-auto'
            : 'max-h-0 opacity-0 pointer-events-none mt-0'
        }`}
      >
        {presetList.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => handleSelectPreset(preset)}
            className="rounded-full border border-line bg-card px-2.5 py-1 text-caption text-ink-2 shadow-halo transition-colors duration-150 [transition-timing-function:var(--ease-micro)] hover:bg-sunken hover:text-ink active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Ephemeral micro-step checklist */}
      <div className="mt-3 px-1" role="region" aria-label={t('microstep.aria')}>
        {checklist.length > 0 && (
          <div className="space-y-1.5">
            {checklist.map((item) => (
              <div key={item.id} className="group flex items-center gap-2.5 py-0.5">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={item.completed}
                  aria-label={item.text}
                  onClick={() => handleToggleStep(item.id)}
                  className={`size-3.5 w-[14px] h-[14px] shrink-0 rounded-full border transition-colors duration-150 [transition-timing-function:var(--ease-micro)] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] ${
                    item.completed
                      ? 'bg-[var(--ac)] border-[var(--ac)] text-white'
                      : 'border-ink-3/50 bg-transparent hover:border-ink'
                  }`}
                >
                  {item.completed && <Check size={9} strokeWidth={3} aria-hidden="true" />}
                </button>

                <div className="relative min-w-0 flex-1 text-left font-sans text-[14px]">
                  <span
                    className={`block truncate transition-colors duration-[120ms] [transition-timing-function:var(--ease-micro)] ${
                      item.completed ? 'text-ink-3' : 'text-ink'
                    }`}
                  >
                    {item.text}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`absolute left-0 top-1/2 h-[1px] w-full bg-ink-3 transition-transform duration-[120ms] [transition-timing-function:var(--ease-micro)] origin-left pointer-events-none ${
                      item.completed ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveStep(item.id)}
                  aria-label={t('microstep.delete')}
                  className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 p-0.5 text-ink-3 hover:text-ink rounded transition-opacity duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]"
                >
                  <X size={12} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Adding micro-step input or button */}
        {checklist.length < 3 && (
          <div className="mt-2">
            {isAdding ? (
              <div className="flex items-center gap-2.5 py-0.5">
                <span className="size-3.5 w-[14px] h-[14px] shrink-0 rounded-full border border-dashed border-ink-3/40" />
                <input
                  ref={addInputRef}
                  type="text"
                  value={draftText}
                  maxLength={140}
                  placeholder={t('microstep.placeholder')}
                  onChange={(e) => setDraftText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={commitDraftStep}
                  className="w-full bg-transparent text-[14px] font-sans text-ink placeholder:text-ink-3 outline-none border-b border-line focus:border-[var(--ac)] transition-colors duration-150 py-0.5"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="mx-auto flex items-center gap-1.5 rounded-full px-2.5 py-1 text-caption text-ink-3 transition-colors duration-150 [transition-timing-function:var(--ease-micro)] hover:bg-sunken hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
              >
                <Plus size={13} aria-hidden="true" />
                <span>{t('microstep.add')}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
