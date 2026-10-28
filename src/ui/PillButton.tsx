import type { ComponentPropsWithRef, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'icon'

interface PillButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: Variant
  children: ReactNode
}

const base =
  'inline-flex min-h-target select-none items-center justify-center gap-2 rounded-control font-medium transition-[color,background-color,transform] duration-[var(--duration-micro)] [transition-timing-function:var(--ease-micro)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40'

const variants: Record<Variant, string> = {
  primary:
    'bg-[var(--ac-fill)] text-on-accent px-7 py-3 text-control hover:bg-[color-mix(in_srgb,var(--ac-fill)_86%,black)]',
  secondary:
    'border border-line bg-card px-5 py-3 text-body-sm text-ink hover:bg-sunken',
  icon: 'size-11 text-ink-2 hover:bg-sunken hover:text-ink',
}

export function PillButton({ variant = 'secondary', className = '', children, type, ...rest }: PillButtonProps): React.JSX.Element {
  return (
    <button type={type ?? 'button'} className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  )
}
