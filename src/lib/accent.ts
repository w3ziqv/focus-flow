import type { CSSProperties } from 'react'

export type AccentStyle = CSSProperties & { '--ac': string; '--ac-strong': string; '--ac-soft': string }

export function accentStyle(mode: 'focus' | 'break'): AccentStyle {
  if (mode === 'focus') {
    return {
      '--ac': 'var(--color-accent)',
      '--ac-strong': 'var(--color-accent-strong)',
      '--ac-soft': 'var(--color-accent-soft)',
    }
  }
  return {
    '--ac': 'var(--color-break)',
    '--ac-strong': 'var(--color-break-strong)',
    '--ac-soft': 'var(--color-break-soft)',
  }
}
