# Architecture

Decisions are recorded as short ADRs (Architecture Decision Records). Status:
**Accepted** decisions are binding; **Proposed** ones wait for a trigger. This
document is the reason a new contributor can understand *why*, not just *what*.

## 1. What the product is

Focus Flow is a local-first Pomodoro timer. Every feature works offline, every
byte of user data stays on the device, and there is no backend. The web app is
the product; native packaging is an option we keep cheap, not a goal in itself.

## 2. Layers

```
views/            composition, per-screen layout
components/       reusable UI primitives (Dial, tabs, modal, chips, …)
lib/
  timer.ts        timer engine — deadline-based, framework-agnostic core
  audio.ts        audio engine — chime + ambient + uploads
  storage.ts      the ONLY module touching localStorage (typed, validated)
  dataPort.ts     backup export/import on top of storage
  platform.ts     runtime capability detection (browser / PWA / Tauri / Electron)
  i18n.tsx        translation provider
  stats.ts, tips.ts, placeholders.ts   pure data + derivations
```

Rules that keep it future-proof:

1. Only `storage.ts` touches persistence. A desktop build swaps this one module
   for a file-backed adapter; nothing else changes.
2. `lib/` never imports React DOM APIs. Engine and derivations are testable
   without rendering.
3. All design decisions trace to `DESIGN.md`; all colors/spacing/type to tokens
   in `src/index.css`.

## 3. ADRs

### ADR-001 — React 19 + TypeScript strict + Vite — Accepted
Component model fits the stateful timer UI; Vite gives instant HMR and a
static, host-anywhere build. Alternatives (Svelte, Solid) were viable but
React has the largest hiring and library surface for future contributors.

### ADR-002 — Tailwind CSS v4 with a token file, design contract in DESIGN.md — Accepted
Tailwind utilities keep styling local; the token layer (`@theme` in
`src/index.css`) is the single source of visual truth. Lint and review check
that no raw values bypass tokens.

### ADR-003 — localStorage behind an adapter — Accepted, with a known limit
Data volume is kilobytes; localStorage is synchronous and simple. Known limit:
browsers may evict it under pressure and it is per-origin. The adapter shape
(`load*/save*` functions, validators at the boundary) makes a later swap to
IndexedDB or a desktop file adapter a one-module change. Mitigation for data
loss anxiety: JSON export/import (`dataPort.ts`).

### ADR-004 — Timer is deadline-based, never decrementing — Accepted
`Date.now()` vs a persisted deadline keeps the countdown correct through tab
throttling, sleep and reloads. `setInterval` only redraws. A running session is
persisted so a refresh resumes it.

### ADR-005 — Local-first, no backend — Accepted
No accounts, no network calls, no tracking. If sync is ever wanted it starts
with file export/import (already shipped) and moves to an opt-in sync provider
later — the storage adapter is the integration point.

### ADR-006 — Desktop packaging: PWA now, Tauri 2 when triggered — Accepted
See the comparison below. **Electron is rejected for now**: bundling Chromium
and Node (~100 MB installer, 150–300 MB RAM) is not justified for a timer with
a kilobyte-scale data model. **Tauri 2 is the chosen path** once native
capabilities are required: ~10 MB binaries, OS webviews, updater, tray,
global-shortcut and autostart plugins, and iOS/Android targets from the same
codebase. **Trigger to act**: we need any of tray / global shortcuts /
autostart / code-signed installers. Until then the installable PWA covers
desktop and Android.

| Criterion | PWA (today) | Tauri 2 | Electron |
|---|---|---|---|
| Installer | none (browser) | ~3–10 MB | ~85–100 MB |
| Idle RAM | browser tab | ~50–80 MB | 150–300 MB |
| Tray, global shortcuts, autostart | no | yes (plugins) | yes |
| Auto-update | service worker | Tauri updater | electron-updater |
| Mobile path | Android yes, iOS weak | iOS/Android targets | none |
| Toolchain cost | none | Rust + platform SDK | Node |
| Fits this product | fully | when native needed | only for Node-specific needs |

Packaging note: a wrapped build must not register the web service worker
(Workbox conflicts with custom asset protocols). `vite-plugin-pwa` is disabled
for packaged targets — this is a build-flag change, not a code change.

### ADR-007 — i18n as a flat dictionary with parity tests — Accepted
PL and EN are complete key-for-key mirrors enforced by tests, `lang` attribute
syncs with the UI. Adding a language = adding a dictionary object.

### ADR-008 — Accessibility is a feature, not a pass — Accepted
Keyboard shortcuts, focus trapping and restoration, live regions for timer
announcements, 44-class touch targets and AA contrast are enforced in review
and covered by manual + Lighthouse audits.

**Accepted deviation — pinch-zoom is locked** (`user-scalable=no,
maximum-scale=1` in the viewport meta, plus a `gesturestart` blocker for iOS
Safari). Rationale: in an installed PWA a timer that zooms by accident feels
broken, and the UI never carries small text that requires zooming (body ≥14px,
clamped dial digits). This trades away WCAG 1.4.4 (Resize Text) — a deliberate
product decision, not an oversight. iOS ignores the lock anyway; revisit only
if a real accessibility need surfaces.

## 4. Testing strategy

- Unit: engine (fake timers), stats math, storage validators, content parity.
- Build gates: `tsc --noEmit`, ESLint, `vite build` on every change — enforced
  by CI (`.github/workflows/ci.yml`) on every push and pull request.
- Visual: production-build screenshots at 390 / 1280 widths across light/dark
  and every dialog (see the design showcase set).
- Not yet: end-to-end flows; add when the UI surface stabilises.

## 5. Roadmap (planned, in order of value)

1. **v2.1 — stats depth**: monthly view, session log, streak calendar.
2. **v2.1 — tasks**: optional task list per session (today: single task).
3. **v2.2 — import formats**: accept generic Pomodoro app exports.
4. **v3 — desktop**: Tauri 2 wrapper (tray, global shortcut, autostart,
   updater) once the trigger in ADR-006 fires; storage adapter swaps to files.
