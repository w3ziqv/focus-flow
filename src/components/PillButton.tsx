import type { ComponentPropsWithRef, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'icon'

interface PillButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: Variant
  children: ReactNode
}

const base =
  'inline-flex select-none items-center justify-center gap-2 rounded-full font-medium transition-all duration-150 [transition-timing-function:var(--ease-micro)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40'

const variants: Record<Variant, string> = {
  primary: 'bg-[var(--ac)] text-[var(--color-on-accent)] px-7 py-3 text-[15px] hover:bg-[var(--ac-strong)]',
  secondary:
    'border border-line bg-card px-5 py-2.5 text-[14px] text-ink shadow-halo hover:bg-sunken',
  icon: 'size-10 text-ink-2 hover:bg-sunken hover:text-ink',
}

export function PillButton({ variant = 'secondary', className = '', children, type, ...rest }: PillButtonProps) {
  return (
    <button type={type ?? 'button'} className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  )
}
