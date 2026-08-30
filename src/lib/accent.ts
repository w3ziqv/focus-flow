import type { CSSProperties } from 'react'

export type AccentStyle = CSSProperties & {
  '--ac': string
  '--ac-strong': string
  '--ac-soft': string
  '--ac-fill': string
}

export function accentStyle(mode: 'focus' | 'break' | 'rest'): AccentStyle {
  if (mode === 'break' || mode === 'rest') {
    return {
      '--ac': 'var(--color-break)',
      '--ac-strong': 'var(--color-break-strong)',
      '--ac-soft': 'var(--color-break-soft)',
      '--ac-fill': 'var(--color-break-fill)',
    }
  }
  return {
    '--ac': 'var(--color-accent)',
    '--ac-strong': 'var(--color-accent-strong)',
    '--ac-soft': 'var(--color-accent-soft)',
    '--ac-fill': 'var(--color-accent-fill)',
  }
}
