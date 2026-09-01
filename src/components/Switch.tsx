import { useId } from 'react'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}

export function Switch({ checked, onChange, label }: SwitchProps): React.JSX.Element {
  const id = useId()
  return (
    <span className="inline-flex items-center gap-3">
      <span id={id} className="text-[14px] text-ink">
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={id}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors duration-200 [transition-timing-function:var(--ease-standard)] ${
          checked ? 'bg-[var(--ac)]' : 'bg-sunken ring-1 ring-line ring-inset'
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-card shadow-[0_1px_2px_rgba(20,20,19,0.2)] transition-transform duration-200 [transition-timing-function:var(--ease-overshoot)] ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </span>
  )
}
