# Focus Flow

A quiet, local-first Pomodoro companion designed to dissolve into the background while you work. It anchors your active intention, generates real-time procedural acoustic soundscapes, tracks authentic progress without surveillance, and stays out of your way.

The interface adheres to an intentional warm editorial aesthetic: paper tones, Fraunces serif typography, and an accent palette shifting calmly from terracotta during focus to sage during rest. Everything executes locally in your browser — zero backend, zero tracking, zero mandatory accounts.

| Desktop Viewport | Mobile Portrait |
| :---: | :---: |
| ![Focus Flow Desktop Interface](focus-flow.png) | ![Focus Flow Mobile Interface](mobile.png) |

---

## Architectural Philosophy

Focus Flow is built upon four foundational pillars that protect cognitive focus and user autonomy:

1. **The Quiet Companion**: Focus Flow rejects notification spam, guilt-inducing streaks, and jarring modal takeovers. Interface feedback is subtle and grounded — tactile haptic cues, gentle chimes, and minimalist vector ink seals.
2. **Local-First Data Sovereignty**: Zero backend dependencies, zero telemetry, and zero mandatory sign-in. Your focus history, intentions, and preferences reside exclusively on your physical device in validated local storage.
3. **Procedural Web Audio Synthesis (0 KB Asset Footprint)**: Rather than streaming or bundling multi-megabyte audio loops, all ambient textures (Brown Noise, Pink Noise, Soft Rain, Ocean Waves) and the Tibetan singing bowl chime are synthesized mathematically in real-time via the Web Audio API with tone warmth filtration.
4. **Wall-Clock Anchored Precision**: Timers never rely on fragile interval decrement loops that drift or freeze when backgrounded. Remaining durations derive from monotonic `Date.now()` differences against target timestamps, reinforced by a dedicated Web Worker ticker.

---

## Milestone v2.5 Capabilities

Focus Flow v2.5 (Stage 5: Customization, Themes & Accessibility) elevates sensory personalization, universal accessibility (**WCAG 2.2 AAA**), and ergonomic navigation:

- **Sensory-Friendly Themes Palette (WCAG 2.2 AAA)**: Five meticulously calibrated themes designed to eliminate glare and reduce eye strain, each guaranteed to meet or exceed 7.0:1 contrast ratios for normal body text and 4.5:1 for large display elements:
  * **Warm Parchment** (`light`): Tactile paper background (`#F5F4ED`) with charcoal ink (`#141413`).
  * **Warm Soot Dark** (`dark`): Low-glare dark canvas (`#141413`) with muted bone typography (`#FAF9F5`).
  * **High-Contrast Obsidian** (`obsidian`): Pure pitch black (`#000000`) with ultra-crisp white text (`#FFFFFF`) and electric blue focus indicators, delivering 21:1 contrast for OLED panels.
  * **Botanical Sage** (`sage`): Calming earthy olive/sage palette (`#EDF2EB` / `#1B2A18`) for prolonged visual calm without blue-light fatigue (13.5:1 contrast).
  * **E-Ink Monochrome** (`eink`): Zero-color high-contrast grayscale (`#FFFFFF` / `#000000`) optimized for e-paper displays with disabled texture grain (21:1 contrast).
- **iOS-Style Master-Detail Settings Navigation**: Replaces monolithic settings scroll with a clean, card-based drill-down navigation pattern. Powered by GPU-accelerated directional transitions (`translate3d`, `220ms var(--ease-standard)`, 120 FPS on ProMotion displays) and tactile micro-press feedback (`active:scale-[0.985]`).
- **Keyboard Shortcuts Manager Modal (`?` Trigger)**: Global interactive cheat sheet and key rebinding modal accessible anywhere via `?` (when text inputs are unfocused). Supports customizing timer shortcuts (`Space`, `R`, `F`, `Esc`, `↑ / ↓`) with safe reserved-key conflict protection and one-click default restoration.
- **Screen Reader Narration & Web Speech API Engine**: Granular voice feedback with three verbosity tiers (*Minimal*, *Standard*, *Detailed*). Features non-blocking speech synthesis in Polish and English, Firefox-hardened queue resumption, active utterance memory pinning to prevent garbage collection bugs, and an `aria-live="polite"` live region (`A11yLiveAnnouncer`).
- **Touch Target Ergonomics & Focus Rings**: Enforces strict **44×44px** minimum touch target bounding boxes across all interactive buttons, steppers, and switches, paired with high-contrast dual-offset focus rings (`--color-ring: #3898EC`).
- **Schema v2.1 Data Portability**: Extends backup format to capture custom theme selections, shortcut keymaps, and narration preferences with non-destructive backward compatibility.

---

## Milestone v2.4 Capabilities

Focus Flow v2.4 (Stage 4: Data Portability, Integrations & Background Execution) introduced complete data independence and resilient background performance:

- **RFC 5545 iCalendar (`.ics`) Export**: Exports focus blocks to universal calendar formats with strict UTC timestamps, summary metadata, and 75-octet line folding for seamless import into Google Calendar, Apple Calendar, and Outlook.
- **RFC 4180 CSV (`.csv`) with UTF-8 BOM**: Exports historical sessions formatted with a UTF-8 Byte Order Mark (`\uFEFF`), ensuring instant, ungarbled character rendering in Microsoft Excel and spreadsheet suites with full RFC 4180 quote escaping.
- **GitHub-Flavored Markdown (`.md`) Tables**: Generates publication-ready session history tables with dates, durations, tasks, micro-step checklist statuses, and daily total summaries.
- **Schema v2 Full Backup & Restore**: Complete JSON archive snapshot capturing settings, stats, v2 sessions, micro-steps, task presets, sound preferences, theme, volume, and interface options. Features backward-compatible migration from Schema v1 and strict structural boundary validation.
- **Direct Client-Side Webhooks**: Opt-in event dispatching (`start`, `pause`, `complete`) triggered directly from the browser via standard HTTP POST to user-configured endpoints (Home Assistant, Discord, n8n, Zapier) with silent, non-blocking error handling.
- **Web Worker Background Ticker & Cold-Start Wake Reconciliation**: Dedicated Web Worker maintaining an unthrottled ~250ms heartbeat across inactive browser tabs, paired with pure wake reconciliation that credits sessions, increments stats, advances rounds, and displays an unobtrusive in-app wake toast upon resume from device sleep or lid close.

---

## Core Capabilities

- **Three-Phase Interval Timer**: Focus, Short Break, and Long Break intervals with customizable round counts, auto-start options, and a concentric hairline daily goal ring.
- **Intention Presets & Ephemeral Micro-Steps**: Single-tap intention presets (*Deep Work*, *Writing*, *Code Review*, *Reading*, *Inbox Zero*) and a 3-step ephemeral checklist tied strictly to the active session.
- **Procedural Soundscapes & Entrainment**: Real-time synthesized pink noise, leaky brown noise, soft rain, ocean waves, tone warmth filter (200–1200 Hz), and binaural beat entrainment (10 Hz Alpha Focus, 6 Hz Theta Rest).
- **Productivity Analytics & Zen Milestones**: Rolling 7-day focus chart, 30-day paper-toned activity mosaic, real-time searchable session log with inline editing, and 5 collectible Zen milestone ink stamps.
- **Client-Side Canvas Card Generator**: Generates high-resolution 1200×630 weekly summary cards client-side using offscreen HTML5 `<canvas>` with Fraunces typography and film grain for instant PNG download or clipboard copy.
- **Evidence-Based Guides Library**: 27 peer-reviewed articles across 7 categories (`learning`, `break`, `sleep`, `food`, `productivity`, `wellbeing`, `mindfulness`) with authentic scientific citations and complete Polish/English bilingual symmetry.
- **Installable Progressive Web App (PWA)**: Full offline functionality via Service Worker, self-hosted variable typography, and responsive touch layout.

---

## Technical Stack

- **Framework**: React 19, TypeScript (Strict Mode, `isolatedDeclarations`, `verbatimModuleSyntax`)
- **Build Tool**: Vite 7 with `vite-plugin-pwa` (Workbox offline precaching)
- **Styling**: Tailwind CSS v4 with custom semantic design tokens (`src/index.css`)
- **Audio Engine**: Pure Web Audio API (procedural mathematical synthesis, biquad filtering, gain ramping)
- **Typography**: Self-hosted variable fonts (`@fontsource-variable/fraunces`, `@fontsource-variable/instrument-sans`) — zero runtime CDN dependencies
- **Test Infrastructure**: Vitest 4, Testing Library, JSDOM, Playwright

---

## Documentation & Architecture

- [`DESIGN.md`](DESIGN.md) — Editorial design tokens, tactile animations, typography scale, and accessibility contracts.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Architectural Decision Records (ADR-001 through ADR-009), including toolchain strictness, storage encapsulation, and opt-in synchronization.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — Evolution roadmap across all 7 development stages (v2.1 through v3.0).

---

## Getting Started

### Prerequisites
- Node.js 20+ (recommended: Node 22 LTS)
- npm 10+

### Development Setup

```bash
# Clone the repository
git clone https://github.com/w3ziqv/focus-flow.git
cd focus-flow

# Install dependencies
npm install

# Start local development server
npm run dev

# Run full test suite (668 tests across 39 test suites)
npm run test:run

# Static type checking
npm run typecheck

# Lint codebase
npm run lint

# Production build
npm run build

# Preview production build locally
npm run preview
```

---

## Author

Mateusz Szostak — [@w3ziqv](https://github.com/w3ziqv)

## License

MIT License. See [LICENSE](LICENSE) for details.
