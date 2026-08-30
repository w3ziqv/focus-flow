import { CheckCircle2 } from 'lucide-react'
import { useI18n } from '../lib/i18n'

interface TaskFieldProps {
  phase: 'draft' | 'running' | 'done'
  value: string
  placeholder: string
  onChange: (value: string) => void
}

export function TaskField({ phase, value, placeholder, onChange }: TaskFieldProps) {
  const { t } = useI18n()

  if (phase === 'done' && value.trim() !== '') {
    return (
      <div className="flex min-h-[3rem] items-center justify-center gap-2 text-[15px] text-ink-2">
        <CheckCircle2 size={18} className="text-success" aria-hidden="true" />
        <span>
          <span className="text-ink-3">{t('task.done')}</span> <span className="font-medium text-ink">{value}</span>
        </span>
      </div>
    )
  }

  if (phase === 'running' && value.trim() !== '') {
    return (
      <div className="flex min-h-[3rem] items-center justify-center gap-2 text-[15px]">
        <span aria-hidden="true" className="size-2 rounded-full bg-[var(--ac)] session-dot" />
        <span>
          <span className="text-ink-3">{t('task.committed')}</span> <span className="font-medium text-ink">{value}</span>
        </span>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[380px]">
      <label htmlFor="task-input" className="sr-only">
        {t('task.placeholder')}
      </label>
      <input
        id="task-input"
        type="text"
        value={value}
        maxLength={200}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full border-b border-line bg-transparent py-3 text-center text-[17px] text-ink outline-none transition-colors duration-150 [transition-timing-function:var(--ease-micro)] placeholder:text-ink-3 focus:border-[var(--ac)]"
      />
    </div>
  )
}
