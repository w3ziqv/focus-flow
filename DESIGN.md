# Focus Flow Design System

## 0. Research Log

- Embedded refs: shortlisted `claude.md` / `notion.md` / `linear.app.md` → picked **soft-skill (Layer A)** + **claude.md (Layer B)** because a focus timer sells calm, and claude.md's warm parchment + terracotta system is the opposite of generic dark-SaaS while still feeling premium; soft-skill's "Editorial Luxury" archetype (warm creams, variable serif, film grain) matches the deep-work mood.
- Lazyweb: 2 queries ("focus timer pomodoro productivity app" desktop, "pomodoro focus session timer mobile app" mobile), 16 screens returned, **2 viewed in full** (tiimo focus tab, atoms focus tab) → layout grammar harvested: (1) the circular dial is the canonical hero — big ring, duration number centered inside, tick marks on the ring; (2) exactly ONE dominant pill CTA under the dial; (3) sound/audio is a single quiet affordance near the timer, not a section; (4) navigation is a floating pill bar, bottom on mobile; (5) warm cream canvases exist in this category (atoms) — warm light theme is viable, not just dark.
- Imagen drafts: skipped — no image generation tool available in this session.
- ui-ux-db: product lookup ("focus timer productivity calm premium") → Timer & Pomodoro row recommends minimalism, dark-mode readiness, focus=red/amber + break=green color semantics → adopted as mode-colored accents (terracotta focus / sage break). Typography lookup rejected its Inter-based pairings (Inter banned by soft-skill); chose Fraunces + Instrument Sans instead.

## 1. Atmosphere & Identity

A quiet study at golden hour. Warm paper surfaces, an editorial serif that speaks softly, and a single terracotta thread of color that warms when you work and cools to sage when you rest. Nothing on the screen begs for attention; the app recedes so the work can come forward. The signature is **the Dial**: a fine, instrument-grade circular timer that carries the whole screen — drawn like a watch face (hairline ticks, thin progress arc with rounded caps, tabular serif digits), never like a progress-bar widget. Depth comes from warm tonal shifts and ring-halos, not drop shadows; a 3% film grain gives the light theme a paper feel.

## 2. Color

### Palette

All neutrals are warm — every gray has a yellow-brown undertone (from claude.md). No cool blue-grays anywhere.

| Role | Token | Light | Dark | Usage |
|------|-------|-------|------|-------|
| Surface/page | --surface-page | #F5F4ED | #141413 | Page background (parchment / warm near-black) |
| Surface/card | --surface-card | #FAF9F5 | #1E1E1C | Cards, panels |
| Surface/elevated | --surface-elevated | #FFFFFF | #262624 | Modals, popovers |
| Surface/sunken | --surface-sunken | #EDEBE2 | #1A1A18 | Inputs, chart track, sunken wells |
| Text/primary | --text-primary | #141413 | #FAF9F5 | Headlines, body |
| Text/secondary | --text-secondary | #5E5D59 | #B0AEA5 | Captions, secondary |
| Text/tertiary | --text-tertiary | #716F66 | #87867F | Metadata, disabled (light #716F66 = 4.57:1 on parchment, AA) |
| Border/default | --border-default | #E8E6DC | #30302E | Dividers, card outlines |
| Border/subtle | --border-subtle | #F0EEE6 | #262624 | Soft separations |
| Accent/focus | --accent-focus | #C96442 | #D97757 | Focus mode: dial arc, active tab, links |
| Accent/focus-strong | --accent-focus-strong | #A84E2F | #E08A6D | Accent text ≥14px on parchment, hover |
| Accent/focus-fill | --accent-focus-fill | #B4552F | #D97757 | Primary button fill (AA with on-accent text) |
| Accent/break | --accent-break | #6E7F5C | #8FA07A | Break modes: dial arc, active tab |
| Accent/break-strong | --accent-break-strong | #57664A | #9FB28A | Break accent text ≥14px, hover |
| Accent/break-fill | --accent-break-fill | #5D6B4D | #8FA07A | Primary button fill in break modes |
| Status/success | --status-success | #5A7248 | #7E9668 | Confirmations |
| Status/error | --status-error | #B53333 | #C95050 | Errors, destructive |
| Focus-ring | --focus-ring | #3898EC | #58A8F0 | Keyboard focus outline (the one cool color, a11y only) |
| On-accent | --on-accent | #FFFFFF | #FAF9F5 | Text on accent fills |

### Rules
- Accent is used ONLY where it carries state: active mode, primary CTA, dial progress, focus-mode glow. Never decorative.
- Accent-on-parchment (#C96442 on #F5F4ED ≈ 3.2:1) is reserved for large text (≥24px), graphics (dial arc), and fills. Small accent text uses the -strong stops (≥4.5:1).
- Mode recolors the surface story: focus mode tints the dial and CTA terracotta; break modes switch both to sage. The switch is animated (color transitions only).
- Never introduce a color not in this table. Extend the table first.

## 3. Typography

### Fonts
- Display/serif: **Fraunces** (variable, optical size axis, weights 300–600). Carries the timer digits, page title, stat numbers, section headings.
- UI/sans: **Instrument Sans** (variable, 400–600). All labels, body, buttons, inputs.
- Self-hosted via @fontsource-variable — no Google Fonts CDN (render-blocking third-party).
- Mono: none. Tabular figures come from `font-variant-numeric: tabular-nums`.

### Scale

| Level | Size | Font | Weight | Line Height | Tracking | Usage |
|-------|------|------|--------|-------------|----------|-------|
| Dial digits | clamp(4.5rem, 14vw, 8rem) | Fraunces | 340 | 1.0 | -0.02em, tabular-nums | Timer center |
| Display | clamp(2.5rem, 6vw, 4rem) | Fraunces | 450 | 1.1 | -0.02em | Focus overlay wordmark, tips hero |
| H1 | 2rem / 32px | Fraunces | 500 | 1.2 | -0.01em | View titles |
| H2 | 1.5rem / 24px | Fraunces | 500 | 1.25 | 0 | Card/section titles |
| Stat number | 1.75rem / 28px | Fraunces | 400 | 1.1 | tabular-nums | Stat cards |
| Body | 1rem / 16px | Instrument Sans | 400 | 1.6 | 0 | Default |
| Body/sm | 0.875rem / 14px | Instrument Sans | 400 | 1.5 | 0 | Secondary, hints |
| Caption | 0.8125rem / 13px | Instrument Sans | 500 | 1.4 | 0.01em | Chips, labels |
| Overline | 0.6875rem / 11px | Instrument Sans | 600 | 1.3 | 0.09em, uppercase | Eyebrows, stat labels |

### Rules
- Serif = voice (numbers, titles). Sans = function (everything you click).
- Fraunces weight ceiling 550; never bold-serif.
- Body never below 14px; overline is the only uppercase treatment.

## 4. Spacing & Layout

### Base unit: 4px

| Token | Value | Usage |
|-------|-------|-------|
| --space-1 | 4px | icon-to-label |
| --space-2 | 8px | inline groups, chip padding |
| --space-3 | 12px | field padding, list items |
| --space-4 | 16px | standard card padding |
| --space-6 | 24px | card padding default |
| --space-8 | 32px | between card groups |
| --space-10 | 40px | sections within a view |
| --space-16 | 64px | page-level vertical rhythm |
| --space-20 | 80px | hero breathing room |

### Grid
- Timer column (single-focus): max-width **560px**, centered.
- Content column (tips, stats-heavy): max-width **760px**, centered.
- Breakpoints: sm 640px, md 768px, lg 1024px.
- Mobile: single column, px-4 (16px), the Dial never exceeds 78vw.
- Desktop timer view: one centered column (the calm is the point). Stats row may widen to 760px.
- Browser mechanics (`clamp()`, `min()`, intrinsic sizing) stay raw — not tokens.

### Rules
- The Dial owns a square, aspect-ratio-locked container; nothing else competes with it vertically on first paint.
- Generous whitespace is load-bearing: the timer view should feel underfilled, not busy.

## 5. Components

### Dial (signature primitive)
- **Structure**: square SVG; 60 hairline ticks (5-minute ticks slightly longer); track circle stroke var(--border-default) 2px; progress arc stroke accent 3px, rounded linecaps, rotated -90°; center stack: mode overline, Fraunces digits, round counter caption. The whole dial is tappable — a transparent overlay button toggles start/pause (mobile-first affordance), keyboard focusable with a visible ring.
- **Variants**: focus (terracotta arc), short/long break (sage arc), paused (arc at 40% opacity), running (arc full accent).
- **States**: idle, running, paused, complete (arc full + one gentle scale-pulse of the center stack, 500ms emphasis).
- **Accessibility**: digits `aria-hidden`; sibling visually-hidden `aria-live="polite"` line announces minute marks and mode changes only; overlay button carries a full action+state label.
- **Motion**: arc updates via SVG stroke-dashoffset transition 1s linear (matches tick cadence); center never reflows.
- **Layout**: centered stack; square, `min(70vw, 340px)` mobile / 360–400px desktop.

### SegmentedTabs (mode switch)
- **Structure**: 3 buttons in a sunken pill track (--surface-sunken), gliding accent pill indicator behind the active label (shared-layout style: single absolutely-positioned pill translated via transform).
- **States**: default, hover (label → primary), active (pill accent-tinted at 12% with -strong label), focus-visible ring.
- **Accessibility**: `role="tablist"`, arrow-key roving focus, `aria-selected`.
- **Motion**: indicator translate 220ms standard curve; label color 120ms micro.

### PillButton
- **Structure**: fully rounded pill; label; optional leading icon.
- **Variants**: primary (accent fill, --on-accent text), secondary (surface-card fill + 1px border-default + ring-halo), quiet-icon (transparent, icon-only, hover: sunken fill).
- **States**: default, hover (primary darkens one step / secondary bg→sunken), active (scale 0.98), focus-visible (--focus-ring 2px offset 2px), disabled (40% opacity, no pointer).
- **Spacing**: primary px-7 py-3; secondary px-5 py-2.5; quiet-icon 40×40.
- **Motion**: press scale 120ms micro; color 150ms.

### TaskField
- **Structure**: time-of-day greeting as a quiet overline above; borderless input, bottom hairline (1px --border-default) that turns accent on focus; placeholder = the plain question ("Nad czym pracujesz?"); a check-circle + completed-task line replaces it while a session runs.
- **States**: empty, filled, focused (hairline→accent 150ms), locked (session running: read-only completed line), completed.
- **Accessibility**: real `<label>` visually hidden; `aria-describedby` hint.

### SoundChipRow
- **Structure**: horizontal wrap of pill chips (Off / Rain / Waves / Stream / Campfire / Noise / custom…) + quiet "Add sound" chip + hidden file input. Active chip: accent-tint fill + -strong label. Custom chips carry a small × remove button (separate stop, 24px hit area). When a soundscape is active, a compact volume slider (native range, `accent-color: var(--ac)`) appears below the chips.
- **States**: default, hover (sunken), active (accent), focus-visible; status line below (`aria-live="polite"`) for load/remove/quota feedback, auto-clears 4s.
- **Motion**: none beyond color — sound selection should feel instant.

### StatCard
- **Structure**: no card box — quiet stack: Fraunces number (Stat number level) + overline label; thin left hairline between items.
- **States**: static; values count-up 400ms on change (opacity/transform only via digit roll if cheap, else simple swap).
- **Layout**: 4-across grid desktop, 2×2 mobile.

### WeekChart
- **Structure**: 7 bars, rounded 3px tops, today's bar accent, past bars --border-default filled; weekday caption under each; bars grow from baseline via scaleY on mount.
- **Accessibility**: `role="img"` + aria-label summary; `<title>` per bar with minutes.

### Modal (settings)
- **Structure**: shared `Modal` primitive (surface-elevated, radius 20px, ring-halo + whisper shadow; backdrop = page color at 60% + 8px blur; focus trap, Esc and backdrop-click close). Two instances: **App settings** (theme, language, interface switches: reduce-motion and show-statistics, data export/import, version + runtime footer) and **Timer settings** (numeric steppers with −/+ buttons and hidden native spinners, clamped to bounds, and a real switch for auto-start).
- **States**: closed/open (scale 0.97→1 + fade 200ms standard); Esc and backdrop-click close; focus trapped; return focus to opener.
- **Accessibility**: `role="dialog"` `aria-modal`, labelled by title; labels on every field.

### FocusOverlay
- **Structure**: fullscreen fixed layer in page background color (light: parchment, dark: ink); the Dial at 60vmin; wordmark exit button top-left; nothing else.
- **Motion**: fade+scale 500ms emphasis; exit reverses.
- **Accessibility**: focus moves into overlay on open, restored on close; Esc exits.

### Accordion (tips)
- **Structure**: category header rows (overline + chevron) with content region; single-open behavior.
- **Motion**: grid-template-rows 1fr/0fr morph 260ms standard (height-morph via grid, GPU-safe enough, `prefers-reduced-motion` swaps to instant).
- **Accessibility**: `<button aria-expanded>` + region.

### NavPill
- **Structure**: floating island — top center on desktop (mt-24px, pill, surface-card + ring-halo + blur), bottom center on mobile (fixed, 16px inset); links: Timer, Tips; theme toggle + language toggle as quiet-icon buttons on the right.
- **States**: active link = sunken pill fill; hover = sunken at 60%.
- **Motion**: none beyond color; the island itself never animates position.

### Switch (auto-start)
- **Structure**: 44×24 track, 20px thumb; on = accent track.
- **Motion**: thumb translate 200ms standard curve with slight overshoot cubic-bezier(0.34,1.56,0.64,1); `role="switch"` `aria-checked`.

## 6. Motion & Interaction

### Timing

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Micro | 120–150ms | cubic-bezier(0.2, 0, 0, 1) | Presses, label color, hairline focus |
| Standard | 200–260ms | cubic-bezier(0.32, 0.72, 0, 1) | Tabs indicator, modal, accordion, switch |
| Emphasis | 400–600ms | cubic-bezier(0.16, 1, 0.3, 1) | Overlay enter, dial complete pulse, count-up |
| Dial tick | 1000ms | linear | Arc progress only |

### Rules
- Only `transform`, `opacity`, `filter`, and SVG stroke-dashoffset animate. Never layout properties.
- Every interactive element: hover + active + focus-visible states.
- Entry animations: one gentle fade-up (12px, 400ms emphasis) on view mount, staggered 40ms across siblings; nothing else moves on load.
- `prefers-reduced-motion: reduce`: entry animations become opacity-only 1-step, dial arc jumps per-second without transition, pulse/count-up/scale disabled, accordion instant.
- Sound must never be required for state feedback (visual status line accompanies every sound event).

## 7. Depth & Surface

**Strategy: mixed — warm ring-halos + whisper shadows + tonal surfaces (from claude.md).**

| Level | Treatment | Usage |
|-------|-----------|-------|
| Flat | no shadow, no border | Page background, text |
| Contained | `1px solid var(--border-default)` | Cards, dividers |
| Ring-halo | `0 0 0 1px var(--border-default)` at 60% + `0 1px 2px rgba(20,20,19,0.04)` | Buttons, chips, nav island |
| Whisper | `0 4px 24px rgba(20,20,19,0.06)` | Elevated cards, modal |
| Inset | `inset 0 0 0 1px` at 15% | Active/pressed fills |

- Light theme adds a fixed, `pointer-events-none` film-grain overlay (SVG turbulence, 3% opacity) — the paper signature. Dark theme omits it (or ≤2%).
- Backdrop blur ONLY on the modal backdrop and the nav island (fixed elements). Never on scrolling content.
- Depth is warm-toned; no neutral-black shadows beyond the 0.04–0.06 warm blacks above.

## 8. Accessibility Constraints & Accepted Debt

### Constraints
- WCAG 2.2 AA target. Contrast floor 4.5:1 body / 3:1 large text & graphics; accent-on-parchment restriction per Section 2.
- Visible `--focus-ring` (2px, 2px offset) on every interactive element; full keyboard reachability: Tab order follows visual order; Space = start/pause, R = reset, F = focus overlay, Esc = close topmost layer (documented in a shortcuts hint line under the timer controls).
- Mode tabs: roving tabindex + arrow keys. Modal: focus trap + restore. Focus overlay: focus move + restore.
- Screen reader: timer digits aria-hidden; polite live region announces mode changes, round changes, session completion, and each full minute; stats/chart have text alternatives.
- `prefers-reduced-motion` respected everywhere (Section 6).
- Touch targets ≥44px (chips' remove buttons: 24px visual, 44px padded hit area).
- `lang` attribute switches with UI language (pl/en).

### Accepted Debt
| Item | Location | Why accepted | Owner / Exit |
|------|----------|--------------|--------------|
| Legacy `ff_*` localStorage stats migrate best-effort; malformed legacy data silently resets to defaults | `src/lib/storage.ts` | One-shot migration for a personal project's old data; new schema is authoritative | Next breaking change of storage schema |
| Lighthouse performance 98/100 (mobile, throttled): LCP ≈ 2.1–2.3 s is gated by the Fraunces webfont that renders the Dial digits | `vite.config.ts` font-preload plugin | Reaching 100 would require inlining the font as base64 (+~90 KB HTML) or replacing the serif LCP element — both harm the design that is the point of the product | Revisit if a static host serves fonts with HTTP/2 priority hints |
