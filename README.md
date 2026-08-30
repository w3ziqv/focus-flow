# Focus Flow

A Pomodoro timer for people who want the timer to disappear while they work. It keeps one task in front of you, plays soft ambient sound if you ask for it, counts what you actually finished, and stays out of the way otherwise.

The interface is deliberately quiet: warm paper tones, a serif clock face, one accent color that shifts from terracotta during work to sage during breaks. Everything runs in the browser, offline included.

| Desktop | Mobile |
| --- | --- |
| ![Desktop](focus-flow.png?v=2) | ![Mobile](mobile.png?v=2) |

## What it does

- Three-phase timer (focus / short break / long break) with rounds and an optional long break every N rounds
- Countdown survives a page reload — it is anchored to wall-clock time, so a throttled background tab does not drift
- One-task session field: write what you are working on, the app holds you to it until the session ends
- Ambient soundscapes from freely-licensed field recordings — rain, ocean waves, stream, campfire — plus synthesized brown noise, and your own audio files, all stored locally
- Session statistics: today, this week, day streak, total focus minutes, and a 7-day bar chart
- A tips library with 30 evidence-backed entries (each cites its research) on learning, breaks, sleep, food, and productivity, in Polish and English
- Fullscreen focus mode, keyboard shortcuts (Space, R, F, Esc), light and dark theme
- Installable PWA; works offline after the first visit
- Polish and English interface, switchable at runtime

## Stack

- React 19, TypeScript (strict), Vite
- Tailwind CSS v4 with design tokens in `src/index.css`; the full design contract lives in [DESIGN.md](DESIGN.md)
- Web Audio API for the chime and soundscapes, hand-rolled SVG for the dial and chart
- `vite-plugin-pwa` (Workbox) for the service worker and manifest
- Self-hosted variable fonts (Fraunces, Instrument Sans) — no external requests at runtime

Timers are easy to get wrong: this one never counts by decrementing a variable each second. It stores a deadline and derives the remaining time from `Date.now()`, which is why it stays accurate when the tab sleeps.

## Ambient sounds

The bundled soundscapes are freely-licensed field recordings from Wikimedia
Commons, level-normalized and edited into seamless loops — author and license
credits are in [`public/sounds/SOUNDS.md`](public/sounds/SOUNDS.md). Brown noise
is synthesized live with the Web Audio API instead of being shipped as a file.

## Development

```bash
npm install
npm run dev        # local dev server
npm run build      # typecheck + production build
npm run preview    # serve the production build
```

The production build goes to `dist/`. Any static host works; the service worker is generated at build time.

## Project structure

```
src/
  lib/
    timer.ts     timer engine (deadline-based, persisted session)
    audio.ts     chime + ambient sound engine
    storage.ts   typed localStorage wrapper, legacy data migration
    stats.ts     streak / week math, 7-day series
    i18n.tsx     Polish and English dictionary
    tips.ts      tips content
  components/    dial, tabs, buttons, modal, accordion, nav
  views/         timer and tips views
DESIGN.md        design system: tokens, components, motion, accessibility
```

## Author

Mateusz Szostak — [w3ziqv](https://github.com/w3ziqv)

## License

MIT
