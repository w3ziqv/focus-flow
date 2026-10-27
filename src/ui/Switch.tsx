import { useId } from 'react'

interface SwitchProps {
  hideLabel?: boolean
  disabled?: boolean
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}

export function Switch({ checked, onChange, label, disabled = false, hideLabel = false }: SwitchProps): React.JSX.Element {
  const id = useId()
  return (
    <span className="inline-flex shrink-0 items-center gap-3">
      <span id={id} className={hideLabel ? 'sr-only' : 'text-[14px] text-ink'}>
        {label}
      </span>
      <button
        type="button"
        role="switch"
        disabled={disabled}
        aria-checked={checked}
        aria-labelledby={id}
        onClick={() => onChange(!checked)}
        className="relative flex size-target shrink-0 items-center rounded-control disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span aria-hidden="true" className={`absolute inset-x-0 top-2.5 h-6 rounded-control transition-colors duration-200 ${checked ? 'bg-[var(--ac)]' : 'bg-sunken ring-1 ring-line ring-inset'}`} />
        <span
          aria-hidden="true"
          className={`absolute top-3 left-0.5 size-5 rounded-control bg-card transition-transform duration-200 [transition-timing-function:var(--ease-overshoot)] ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </span>
  )
}
