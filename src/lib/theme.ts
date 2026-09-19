import type { Theme, ThemeTokens } from '../types'

export const THEME_TOKENS: Record<Theme, ThemeTokens> = {
  light: {
    id: 'light',
    nameKey: 'theme.parchment',
    descKey: 'theme.parchmentDesc',
    surfacePage: '#f5f4ed',
    surfaceCard: '#faf9f5',
    textPrimary: '#141413',
    textSecondary: '#5e5d59',
    accentFocus: '#c96442',
    accentBreak: '#6e7f5c',
    focusRing: '#3898ec',
    isDark: false,
  },
  dark: {
    id: 'dark',
    nameKey: 'theme.soot',
    descKey: 'theme.sootDesc',
    surfacePage: '#141413',
    surfaceCard: '#1e1e1c',
    textPrimary: '#faf9f5',
    textSecondary: '#b0aea5',
    accentFocus: '#d97757',
    accentBreak: '#8fa07a',
    focusRing: '#58a8f0',
    isDark: true,
  },
  obsidian: {
    id: 'obsidian',
    nameKey: 'theme.obsidian',
    descKey: 'theme.obsidianDesc',
    surfacePage: '#000000',
    surfaceCard: '#0d0d0d',
    textPrimary: '#ffffff',
    textSecondary: '#d4d4d4',
    accentFocus: '#ff8c66',
    accentBreak: '#9fd884',
    focusRing: '#4da6ff',
    isDark: true,
  },
  sage: {
    id: 'sage',
    nameKey: 'theme.sage',
    descKey: 'theme.sageDesc',
    surfacePage: '#edf2eb',
    surfaceCard: '#f5f8f3',
    textPrimary: '#1b2a18',
    textSecondary: '#3f523b',
    accentFocus: '#4a6b3e',
    accentBreak: '#758b68',
    focusRing: '#2e7bb8',
    isDark: false,
  },
  eink: {
    id: 'eink',
    nameKey: 'theme.eink',
    descKey: 'theme.einkDesc',
    surfacePage: '#ffffff',
    surfaceCard: '#fafafa',
    textPrimary: '#000000',
    textSecondary: '#2b2b2b',
    accentFocus: '#000000',
    accentBreak: '#333333',
    focusRing: '#000000',
    isDark: false,
  },
}

export const THEMES: ThemeTokens[] = [
  THEME_TOKENS.light,
  THEME_TOKENS.dark,
  THEME_TOKENS.obsidian,
  THEME_TOKENS.sage,
  THEME_TOKENS.eink,
]

const VALID_THEME_SET = new Set<Theme>(['light', 'dark', 'obsidian', 'sage', 'eink'])

export function isValidTheme(val: unknown): val is Theme {
  return typeof val === 'string' && VALID_THEME_SET.has(val as Theme)
}

/**
 * Applies the selected theme to the root HTML element, configuring
 * class lists, custom property tokens, and color-scheme for native elements.
 */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement

  // Clean existing theme class markers
  root.classList.remove('dark', 'obsidian', 'sage', 'eink')
  root.classList.add('grain')

  const tokens = THEME_TOKENS[theme] ?? THEME_TOKENS.light

  if (tokens.isDark) {
    root.classList.add('dark')
    root.style.colorScheme = 'dark'
  } else {
    root.style.colorScheme = 'light'
  }

  if (theme === 'obsidian') {
    root.classList.add('obsidian')
  } else if (theme === 'sage') {
    root.classList.add('sage')
  } else if (theme === 'eink') {
    root.classList.add('eink')
  }
}

/**
 * Computes the relative luminance of an sRGB hex color string.
 * Conforms strictly to W3C WCAG 2.2 § 1.4.3 definition.
 */
export function getLuminance(hex: string): number {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255

  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

/**
 * Calculates WCAG contrast ratio between two hex colors (1:1 to 21:1).
 */
export function getContrastRatio(fgHex: string, bgHex: string): number {
  const lum1 = getLuminance(fgHex)
  const lum2 = getLuminance(bgHex)
  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2))
}
