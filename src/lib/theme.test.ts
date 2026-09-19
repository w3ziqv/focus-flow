import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { applyTheme, getContrastRatio, getLuminance, isValidTheme, THEMES, THEME_TOKENS } from './theme'

describe('Theme Engine & WCAG 2.2 AAA Contrast', () => {
  beforeEach(() => {
    document.documentElement.className = ''
    document.documentElement.style.colorScheme = ''
  })

  afterEach(() => {
    document.documentElement.className = ''
    document.documentElement.style.colorScheme = ''
  })

  it('provides all five sensory-friendly theme definitions', () => {
    expect(THEMES).toHaveLength(5)
    const ids = THEMES.map((t) => t.id)
    expect(ids).toContain('light')
    expect(ids).toContain('dark')
    expect(ids).toContain('obsidian')
    expect(ids).toContain('sage')
    expect(ids).toContain('eink')
  })

  it('validates theme identifiers correctly with isValidTheme', () => {
    expect(isValidTheme('light')).toBe(true)
    expect(isValidTheme('dark')).toBe(true)
    expect(isValidTheme('obsidian')).toBe(true)
    expect(isValidTheme('sage')).toBe(true)
    expect(isValidTheme('eink')).toBe(true)
    expect(isValidTheme('sepia')).toBe(false)
    expect(isValidTheme('')).toBe(false)
    expect(isValidTheme(null)).toBe(false)
    expect(isValidTheme(123)).toBe(false)
  })

  it('applies theme classes and color scheme to document element', () => {
    applyTheme('obsidian')
    expect(document.documentElement.classList.contains('obsidian')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe('dark')

    applyTheme('sage')
    expect(document.documentElement.classList.contains('sage')).toBe(true)
    expect(document.documentElement.classList.contains('obsidian')).toBe(false)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.style.colorScheme).toBe('light')

    applyTheme('eink')
    expect(document.documentElement.classList.contains('eink')).toBe(true)
    expect(document.documentElement.classList.contains('sage')).toBe(false)
    expect(document.documentElement.style.colorScheme).toBe('light')

    applyTheme('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.classList.contains('eink')).toBe(false)
    expect(document.documentElement.style.colorScheme).toBe('dark')

    applyTheme('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.style.colorScheme).toBe('light')
  })

  it('computes relative luminance within valid range [0, 1]', () => {
    expect(getLuminance('#000000')).toBeCloseTo(0, 3)
    expect(getLuminance('#ffffff')).toBeCloseTo(1, 3)
  })

  it('verifies that all five themes satisfy WCAG AAA standards (> 7.0:1) for primary body text', () => {
    for (const theme of THEMES) {
      const ratio = getContrastRatio(theme.textPrimary, theme.surfacePage)
      // WCAG 2.2 AAA requires minimum 7.0:1 for standard text
      expect(
        ratio,
        `Theme ${theme.id} primary text contrast (${ratio}:1) must exceed 7.0:1`,
      ).toBeGreaterThanOrEqual(7.0)
    }
  })

  it('ensures High-Contrast Obsidian and E-Ink provide exceptional contrast (> 15:1)', () => {
    const obsidianContrast = getContrastRatio(
      THEME_TOKENS.obsidian.textPrimary,
      THEME_TOKENS.obsidian.surfacePage,
    )
    expect(obsidianContrast).toBeGreaterThanOrEqual(19.0)

    const einkContrast = getContrastRatio(
      THEME_TOKENS.eink.textPrimary,
      THEME_TOKENS.eink.surfacePage,
    )
    expect(einkContrast).toBeGreaterThanOrEqual(19.0)
  })
})
