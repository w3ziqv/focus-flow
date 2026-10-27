import { describe, expect, it } from 'vitest'
import { themes } from './tokens.json'
import { getContrastRatio } from '../lib/theme'

describe.each(Object.entries(themes))('%s semantic color roles', (_name, tokens) => {
  it('keeps ordinary text readable on both application surfaces', () => {
    for (const ink of ['color-ink', 'color-ink-2', 'color-ink-3'] as const) {
      for (const surface of ['color-page', 'color-card'] as const) {
        expect(getContrastRatio(tokens[ink], tokens[surface]), `${ink} on ${surface}`).toBeGreaterThanOrEqual(4.5)
      }
    }
  })
  it('keeps button labels readable in focus and break modes', () => {
    for (const fill of ['color-accent-fill', 'color-break-fill'] as const) {
      expect(getContrastRatio(tokens['color-on-accent'], tokens[fill]), fill).toBeGreaterThanOrEqual(4.5)
    }
  })
})
