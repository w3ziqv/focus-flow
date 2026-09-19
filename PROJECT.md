# Project: Focus Flow Stage 5 (Milestone v2.5) — Customization, Themes & Accessibility

## Architecture
Focus Flow operates with 100% client-side data sovereignty, zero mandatory server dependencies, universal WCAG 2.2 AAA accessibility compliance, and sensory-friendly personalization.
Stage 5 introduces:
1. **Sensory-Friendly Themes Palette (`src/lib/theme.ts`, `src/index.css`)**:
   - 5 meticulously tuned themes satisfying strict WCAG 2.2 AAA contrast ratios (≥ 7:1 for normal body text, ≥ 4.5:1 for large display text):
     * **Warm Parchment** (`light`): Tactile paper background (`#F5F4ED`) with charcoal ink (`#141413`).
     * **Warm Soot Dark** (`dark`): Low-glare dark canvas (`#141413`) with muted bone typography (`#FAF9F5`).
     * **High-Contrast Obsidian** (`obsidian`): Pure black (`#000000`) with ultra-crisp white text (`#FFFFFF`) and electric blue focus rings (`#4DA6FF`) delivering 21:1 contrast.
     * **Botanical Sage** (`sage`): Calming earthy olive/sage palette (`#EDF2EB` / `#1B2A18`) for prolonged visual calm without eye strain (13.5:1 contrast).
     * **E-Ink Monochrome** (`eink`): Zero-color high-contrast grayscale (`#FFFFFF` / `#000000`) optimized for e-paper displays and maximum distraction reduction (21:1 contrast).
2. **Keyboard Shortcuts Manager Modal (`src/components/ShortcutsModal.tsx`, `src/lib/useShortcuts.ts`)**:
   - Interactive cheat sheet and configuration panel accessible via `?` key or settings.
   - Global shortcuts: `Space` (Toggle Start/Pause), `R` (Reset phase), `F` (Focus Mode overlay), `Esc` (Close modals), `↑ / ↓` (Stepper adjustments).
   - Rebindable keymap with safe conflict handling, input-focus isolation, and one-click "Reset to defaults" restoration.
3. **Screen Reader Narration & Web Speech Engine (`src/lib/speech.ts`, `src/components/A11yLiveAnnouncer.tsx`)**:
   - Granular screen reader narration verbosity: *Minimal* (completion alerts only), *Standard* (phase transitions & round advance), *Detailed* (all events including pauses, resumes, and task titles).
   - Optional Web Speech API synthesis (`voiceAlertsEnabled`) reading statuses aloud in Polish and English without blocking the timer audio thread.
   - Screen reader polite live region (`role="status" aria-live="polite"`) delivering seamless non-visual announcements.
4. **Hardware-Accelerated Accessibility & Touch Ergonomics**:
   - Strict **44×44px** minimum touch target bounding boxes across all interactive controls.
   - High-contrast focus indicator ring (`--color-ring`, 2px solid with 2px offset) enabled on keyboard navigation.
   - Dual-layer reduced motion support (`prefers-reduced-motion: reduce` + manual toggle in Interface preferences).
5. **Storage Schema v2.1 & Full Data Portability (`src/types.ts`, `src/lib/storage.ts`, `src/lib/dataPort.ts`)**:
   - Extends `InterfacePrefs` with `shortcuts` (`ShortcutKeymap`) and `narration` (`NarrationSettings`).
   - Backup v2 import/export validates and restores all 5 sensory themes and extended interface preferences safely.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
| - | - | - | - | - |
| F1 | Sensory Themes Engine | 5 tactile themes (Parchment, Soot, Obsidian, Sage, E-Ink) with dynamic root class application | M1 | ROADMAP § 3.5.2 |
| F2 | WCAG 2.2 AAA Contrast Ratios | Minimum 7.0:1 body text contrast and 4.5:1 large text contrast across all 5 themes | M1 | ROADMAP § 3.5.2 |
| F3 | High-Contrast Focus Ring | High-contrast focus indicator ring (2px solid, 2px offset) active during keyboard navigation | M1 | ROADMAP § 3.5.2 |
| F4 | 44×44px Touch Target Minimum | All interactive elements enforce minimum 44×44px touch bounding boxes | M1 | ROADMAP § 3.5.2 |
| F5 | Interactive Shortcuts Modal | Visual cheat sheet displaying all keyboard shortcuts with clean editorial kbd tags | M2 | ROADMAP § 3.5.2 |
| F6 | Global '?' Shortcuts Trigger | Pressing '?' globally outside input fields opens the shortcuts cheat sheet | M2 | ROADMAP § 3.5.2 |
| F7 | Key Rebinding Engine | Interactive remapping of timer shortcuts with reserved-key protection | M2 | ROADMAP § 3.5.2 |
| F8 | Reset Shortcuts to Defaults | One-click button restoring default keybindings safely | M2 | ROADMAP § 3.5.2 |
| F9 | Web Speech Narration Engine | Web Speech API synthesis reading timer transitions aloud in Polish and English | M3 | ROADMAP § 3.5.2 |
| F10 | Granular Narration Verbosity | 3 verbosity tiers: Minimal (completions), Standard (phases & rounds), Detailed (all events) | M3 | ROADMAP § 3.5.2 |
| F11 | A11y Polite Live Region | Dedicated sr-only live region (`role="status" aria-live="polite"`) for screen readers | M3 | ROADMAP § 3.5.2 |
| F12 | UI Sensory Themes Picker | Visual swatch cards in AppSettingsModal displaying background and accent colors | M4 | ROADMAP § 3.5.2 |
| F13 | UI Accessibility Settings Panel | Narration verbosity segmented tabs and voice alerts toggle switch | M4 | ROADMAP § 3.5.2 |
| F14 | UI Shortcuts Modal Trigger | Button with '?' kbd chip in settings opening the shortcuts manager | M4 | ROADMAP § 3.5.2 |
| F15 | Schema v2.1 Storage Adaptation | Persistent storage and sanitization for shortcuts keymap and narration settings | M5 | ROADMAP § 3.5.4 |
| F16 | Backup v2.1 Import & Export | Full data snapshot export/import supporting all 5 themes and extended interface options | M5 | ROADMAP § 3.5.4 |
| F17 | Bilingual Translation Symmetry | 100% key and text parity between Polish and English for all Stage 5 features | M5 | content.test.ts |
| F18 | Automated Verification Suite | 39 test suites and 664 automated tests covering themes, speech, shortcuts, and storage | M6 | Quality Gates |

## Milestones
| # | Name | Scope | Dependencies | Status |
| - | - | - | - | - |
| M1 | Sensory Themes & WCAG AAA Palette | F1, F2, F3, F4 | none | DONE |
| M2 | Keyboard Shortcuts Manager Modal | F5, F6, F7, F8 | none | DONE |
| M3 | Screen Reader Narration & Voice Engine | F9, F10, F11 | none | DONE |
| M4 | UI Integration & Settings Panels | F12, F13, F14 | M1, M2, M3 | DONE |
| M5 | Schema v2.1 Storage & Data Portability | F15, F16, F17 | M1, M2, M3, M4 | DONE |
| M6 | Test Verification & Release Baseline | F18 | M1, M2, M3, M4, M5 | DONE |

## Interface Contracts

### `src/lib/theme.ts` ↔ UI / Styles
```typescript
export interface ThemeTokens {
  id: Theme
  nameKey: string
  descKey: string
  surfacePage: string
  surfaceCard: string
  textPrimary: string
  textSecondary: string
  accentFocus: string
  accentBreak: string
  focusRing: string
  isDark: boolean
}

export const THEMES: ThemeTokens[]
export function isValidTheme(val: unknown): val is Theme
export function applyTheme(theme: Theme): void
export function getContrastRatio(fgHex: string, bgHex: string): number
```

### `src/lib/speech.ts` ↔ Timer Engine / Announcer
```typescript
export type TimerNarrationEvent =
  | { type: 'session-start'; task?: string | null }
  | { type: 'session-pause' }
  | { type: 'session-resume' }
  | { type: 'session-complete'; task?: string | null }
  | { type: 'break-start'; mode: 'short' | 'long' }
  | { type: 'break-complete' }
  | { type: 'round-advance'; round: number; totalRounds: number }

export function formatNarrationText(event: TimerNarrationEvent, lang: Lang): string
export function shouldAnnounce(eventType: TimerNarrationEvent['type'], verbosity: NarrationVerbosity): boolean
export function speakNarration(text: string, lang: Lang, enabled: boolean): void
export function announceTimerEvent(event: TimerNarrationEvent, settings: NarrationSettings | undefined, lang: Lang): string | null
```

### `src/types.ts` & `src/lib/storage.ts` ↔ Interface Preferences Schema v2.1
```typescript
export type Theme = 'light' | 'dark' | 'obsidian' | 'sage' | 'eink'
export type NarrationVerbosity = 'minimal' | 'standard' | 'detailed'

export interface NarrationSettings {
  verbosity: NarrationVerbosity
  voiceAlertsEnabled: boolean
}

export interface ShortcutKeymap {
  toggleTimer: string
  resetTimer: string
  toggleFullscreen: string
  openSettings: string
}

export interface InterfacePrefs {
  reduceMotion: boolean
  showGreeting: boolean
  shortcuts?: ShortcutKeymap
  narration?: NarrationSettings
}
```

## Code Layout
- `src/types.ts`: Extended type definitions (`Theme`, `ThemeTokens`, `NarrationSettings`, `ShortcutKeymap`, `InterfacePrefs`).
- `src/lib/theme.ts`: 5 sensory-friendly themes tokens, contrast ratio computation, dynamic theme applicator.
- `src/lib/speech.ts`: Web Speech API narration dispatcher and localized text formatter.
- `src/lib/useShortcuts.ts`: Global keyboard shortcut hook supporting custom keymaps and `?` help shortcut.
- `src/components/ShortcutsModal.tsx`: Accessible interactive keyboard shortcuts cheat sheet and rebinding modal.
- `src/components/A11yLiveAnnouncer.tsx`: Screen reader polite live region component.
- `src/components/AppSettingsModal.tsx`: Visual sensory themes card picker, Accessibility & Narration section, Shortcuts modal button.
- `src/lib/storage.ts`: Persistence and boundary sanitizers for Schema v2.1 interface preferences and themes.
- `src/lib/dataPort.ts`: Schema v2.1 export/import serialization supporting sensory themes and interface preferences.
- `src/lib/translations.ts`: 100% Polish and English symmetric localization strings for all Stage 5 features.
