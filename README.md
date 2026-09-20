# Focus Flow

[![Live Demo](https://img.shields.io/badge/demo-focusflow.ink-C96442)](https://focusflow.ink)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![WCAG 2.2 AAA](https://img.shields.io/badge/accessibility-WCAG_2.2_AAA-green.svg)](docs/ROADMAP.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6.svg)](tsconfig.json)

A quiet, local-first Pomodoro companion designed to stay out of your way while you work. Focus Flow pairs a warm editorial aesthetic with real-time procedural soundscapes, ephemeral task intentions, and zero-telemetry offline storage.

Everything runs entirely in your browser — no accounts, no subscriptions, and no remote databases.

| Desktop View | Mobile Portrait |
| :---: | :---: |
| ![Focus Flow Desktop Interface](docs/assets/desktop.png) | ![Focus Flow Mobile Interface](docs/assets/mobile.png) |

---

## Core Features

### ⏱ Focus & Rhythm
- **Three-Phase Intervals**: Configurable Focus, Short Break, and Long Break durations with customizable round counts and auto-start options.
- **Concentric Goal Ring**: Subtle hairline perimeter ring on the dial that fills smoothly toward your optional daily focus target.
- **Wake Reconciliation**: Accurately credits sessions completed while the computer was asleep or the tab was backgrounded, using wall-clock timestamps (`Date.now()`).
- **Dedicated Web Worker**: Unthrottled 250ms heartbeat ensures interval precision even in inactive or throttled browser tabs.

### ✍️ Intentions & Micro-Steps
- **Intention Presets**: Single-tap chips (*Deep Work*, *Writing*, *Code Review*, *Reading*, *Inbox Zero*) to anchor your focus without typing.
- **Ephemeral Micro-Steps**: Up to 3 lightweight checklist items attached to the active session. Completed steps are logged with the session, while incomplete items reset cleanly so you don't accumulate backlog debt.

### 🎧 Procedural Acoustic Soundscapes
- **Mathematical Sound Synthesis (0 KB Assets)**: Generates pink noise, leaky brown noise, soft rain, and ocean wave textures in real time using the Web Audio API without downloading static audio files.
- **Tone Warmth Filter**: Lowpass biquad filter with adjustable cutoff frequency (200–1200 Hz) to shape the sound texture to your preference.
- **Binaural Beat Entrainment**: Stereo carriers supporting 10 Hz Alpha (Focus) and 6 Hz Theta (Rest) modes.
- **Tibetan Singing Bowl Chime**: Five inharmonic modal partials with acoustic beating shimmer and mallet transient burst for session completion alerts.

### 📊 Reflective Analytics & Milestones
- **Rolling Visualizations**: 7-day focus duration bar chart and 30-day paper-toned activity mosaic.
- **Session History Log**: Real-time searchable history with inline task editing and atomic stat recalculation on deletions.
- **Zen Milestone Stamps**: 5 milestone seals celebrating consistency without guilt-inducing broken-streak penalties.
- **Exportable Summary Cards**: Generates high-resolution 1200×630 summary cards directly on an offscreen HTML5 `<canvas>` for saving to Obsidian, Notion, or personal logs.

### 🔒 Privacy & Data Sovereignty
- **Local-First Invariant**: 100% of user data remains on the device in local storage. Zero analytics beacons, tracking pixels, or third-party cookies.
- **Multi-Format Exports**: One-click exports to RFC 5545 iCalendar (`.ics`), RFC 4180 CSV (`.csv`) with UTF-8 BOM, and GitHub-Flavored Markdown (`.md`) tables.
- **Full Backup Archive (Schema v2)**: Single-file JSON snapshot containing all settings, history, custom sound metadata, and interface preferences, with backward compatibility for v1 backups.
- **Client-Side Webhooks**: Optional direct HTTP POST alerts (`start`, `pause`, `complete`) to services like Home Assistant, Discord, n8n, or Zapier.

### ♿️ Accessibility & Sensory Themes (WCAG 2.2 AAA)
- **5 Ergonomic Themes**: Warm Parchment (default), Warm Soot Dark, High-Contrast Obsidian (21:1 OLED contrast), Botanical Sage, and E-Ink Monochrome.
- **Contrast Standards**: All color stops meet or exceed 7:1 contrast for regular text and 4.5:1 for large display elements.
- **Keyboard Navigation & Cheat Sheet**: Press `?` to open the shortcuts manager with rebindable keymaps (`Space`, `R`, `F`, `Esc`, `↑ / ↓`).
- **Screen Reader Support**: Polite live announcements (`aria-live="polite"`) and optional speech narration via Web Speech API with Polish and English support.
- **Hardware-Accelerated Motion**: Respects `prefers-reduced-motion` and offers an in-app toggle restricting animations strictly to transform and opacity.

### 📚 Evidence-Based Guides Library
- **27 Peer-Reviewed Articles**: Focus, sleep, nutrition, and rest guides categorized across 7 domains with authentic citations and 100% Polish and English bilingual parity.

### 📱 Progressive Web App (PWA)
- Fully installable on iOS, Android, macOS, Windows, and Linux.
- Offline-ready via Service Worker precaching.
- Mobile notifications with vibration and haptic feedback.

---

## Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 19, TypeScript | Strict typing, `isolatedDeclarations`, `verbatimModuleSyntax` |
| **Styling** | Tailwind CSS v4 | CSS-first `@theme` configuration with semantic design tokens |
| **Build & PWA** | Vite 7, `vite-plugin-pwa` | Workbox service worker caching, asset preloading |
| **Audio** | Web Audio API | Procedural mathematical synthesis, biquad filtering |
| **Typography** | Fontsource Variable | `@fontsource-variable/fraunces`, `@fontsource-variable/instrument-sans` |
| **Testing** | Vitest 4, JSDOM | Unit, integration, and adversarial boundary test suites |

---

## Project Structure

```text
focus-flow/
├── public/              # Static web assets, PWA icons, screenshots, favicon
├── src/
│   ├── components/      # UI components (Dial, Settings, AudioMixer, Shortcuts)
│   ├── hooks/           # Custom hooks (useTimer, useAudio, useLanguage)
│   ├── lib/             # Core engines (audio, storage, export, sync, stats, timer)
│   ├── views/           # Primary views (Timer, Stats, Guides library)
│   ├── types.ts         # Central TypeScript interfaces & schemas
│   └── App.tsx          # Application shell & routing
├── docs/                # Architecture records (ADR), roadmap, specs, and assets
└── vite.config.ts       # Vite & PWA configuration
```

---

## Getting Started

### Prerequisites
- Node.js 20+ (recommended: Node 22 LTS)
- npm 10+

### Development Setup

```bash
# 1. Clone repository
git clone https://github.com/w3ziqv/focus-flow.git
cd focus-flow

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Run test suites
npm test

# 5. Type-check with TypeScript
npm run typecheck

# 6. Lint codebase
npm run lint

# 7. Build for production
npm run build
```

---

## Documentation

- [`docs/ROADMAP.md`](docs/ROADMAP.md) — 7-stage technical roadmap specification and release status tracking.
- [`docs/DESIGN.md`](docs/DESIGN.md) — Design system, color semantics, typography hierarchy, and motion curves.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Architectural Decision Records (ADR-001 through ADR-009).
- [`docs/PROJECT.md`](docs/PROJECT.md) — Stage 5 milestone specification and feature inventory.

---

## Author

Mateusz Szostak — [@w3ziqv](https://github.com/w3ziqv)

## License

MIT License. See [LICENSE](LICENSE) for details.
