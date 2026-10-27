import { themes } from '../design/tokens.json'
import type { Theme, ThemeTokens } from '../types'

export const THEME_TOKENS: Record<Theme, ThemeTokens> = {
  light: {
    id: 'light',
    nameKey: 'theme.parchment',
    descKey: 'theme.parchmentDesc',
    surfacePage: themes.light['color-page'],
    surfaceCard: themes.light['color-card'],
    textPrimary: themes.light['color-ink'],
    textSecondary: themes.light['color-ink-2'],
    accentFocus: themes.light['color-accent'],
    accentBreak: themes.light['color-break'],
    focusRing: themes.light['color-ring'],
    isDark: false,
  },
  dark: {
    id: 'dark',
    nameKey: 'theme.soot',
    descKey: 'theme.sootDesc',
    surfacePage: themes.dark['color-page'],
    surfaceCard: themes.dark['color-card'],
    textPrimary: themes.dark['color-ink'],
    textSecondary: themes.dark['color-ink-2'],
    accentFocus: themes.dark['color-accent'],
    accentBreak: themes.dark['color-break'],
    focusRing: themes.dark['color-ring'],
    isDark: true,
  },
  obsidian: {
    id: 'obsidian',
    nameKey: 'theme.obsidian',
    descKey: 'theme.obsidianDesc',
    surfacePage: themes.obsidian['color-page'],
    surfaceCard: themes.obsidian['color-card'],
    textPrimary: themes.obsidian['color-ink'],
    textSecondary: themes.obsidian['color-ink-2'],
    accentFocus: themes.obsidian['color-accent'],
    accentBreak: themes.obsidian['color-break'],
    focusRing: themes.obsidian['color-ring'],
    isDark: true,
  },
  sage: {
    id: 'sage',
    nameKey: 'theme.sage',
    descKey: 'theme.sageDesc',
    surfacePage: themes.sage['color-page'],
    surfaceCard: themes.sage['color-card'],
    textPrimary: themes.sage['color-ink'],
    textSecondary: themes.sage['color-ink-2'],
    accentFocus: themes.sage['color-accent'],
    accentBreak: themes.sage['color-break'],
    focusRing: themes.sage['color-ring'],
    isDark: false,
  },
  eink: {
    id: 'eink',
    nameKey: 'theme.eink',
    descKey: 'theme.einkDesc',
    surfacePage: themes.eink['color-page'],
    surfaceCard: themes.eink['color-card'],
    textPrimary: themes.eink['color-ink'],
    textSecondary: themes.eink['color-ink-2'],
    accentFocus: themes.eink['color-accent'],
    accentBreak: themes.eink['color-break'],
    focusRing: themes.eink['color-ring'],
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
