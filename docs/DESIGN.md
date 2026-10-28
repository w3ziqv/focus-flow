# Focus Flow Design System

Current contract: 2026-10-26. This is a working timer interface: the next action
and the time remaining carry the hierarchy. Preserve the concentric dial,
Fraunces figures, Instrument Sans text, warm paper and focus/break accents.

UI architecture updated 2026-10-27: [component/state map](UI-ARCHITECTURE.md),
[representative component contracts](UI-COMPONENTS.md) and
[ADR-0011](adr/0011-ui-ownership-and-render-boundaries.md). Primitives now live
in `ui/`, feature UI in `features/`, composition in `views/` and `app/`.

Localization updated 2026-10-28: [four-language UI contract](LOCALIZATION.md).
Layouts must accommodate translated labels at 320 px and Chinese text without spaces.
The weekly export dialog uses the shared focus/keyboard manager; pending actions
may move focus outside the panel, and the top dialog still owns Tab/Escape.

## Token ownership

`src/design/tokens.json` is the single authored source for semantic colors,
surfaces, fonts, easing, sizes and shared geometry. `scripts/design-tokens.mjs`
generates `src/design/tokens.css`; `index.css` imports it. `theme.ts` reads the
same JSON for preview and export metadata. Never edit generated CSS directly.

```sh
npm run design:tokens
npm run design:check
```

CI rejects stale generated CSS. The spacing grid remains Tailwind's 4 px scale.
New shared values belong in the token source. Component-specific geometry such
as the SVG dial radii stays next to that component; it is not a global token.

| Role | Token family | Rule |
| --- | --- | --- |
| Page and surfaces | `color-page`, `card`, `elevated`, `sunken` | Separate hierarchy by tone; use shadow only for floating content. |
| Text | `color-ink`, `ink-2`, `ink-3` | All three pass 4.5:1 against page/card in unit tests. |
| Focus and break | `color-accent*`, `color-break*` | `*-strong` for text, `*-fill` with `on-accent` for buttons, `*-soft` for selection. |
| Status and focus | `color-success`, `danger`, `ring` | Semantic state, not decorative category color. Preserve a visible keyboard outline. |
| Type | `font-serif`, `font-sans`, `text-label`, `text-body-sm`, `text-control` | Serif for dial/display; readable sentence-case labels, tabular timer digits. |
| Geometry | `radius-control`, `radius-panel`, `radius-dialog`, `spacing-target`, `container-dialog` | Shared controls have 44 px hit areas; the dialog uses one width/padding/radius contract. |
| Motion | `duration-*`, `ease-*` | Feedback on controls; honor system and manual reduced motion. |

The five themes override the same semantic roles: light, dark, obsidian, sage,
eink. `applyTheme` manages classes and UA color scheme. Sage's break-button fill
is darker than its graphic accent so that white text exceeds 4.5:1. A button
color is not automatically a valid text color. No WCAG certification is implied
by color ratios or axe results.

## Component boundaries

| Layer | Examples | Responsibility |
| --- | --- | --- |
| Primitives | PillButton, Switch, SegmentedTabs, Modal | Semantics, focus, keyboard behavior, disabled/pressed state and shared geometry. |
| Feature UI | Dial, TaskField, SoundSettingsDialog, CloudSyncModal | Present a typed feature state and invoke callbacks. Persistence belongs in adapters/facades. |
| Screens | TimerView, StatsView, TopicsIndex | Composition, responsive reading order and useful empty states. |
| Shell | App | Navigation, theme/language, feature activation and lifecycle orchestration. |

`useDialogFocus` supplies background inertness, focus containment, Escape and
focus restoration for Modal and FocusOverlay. Closed focus mode unmounts its
content. `LoadingState` supplies named, closeable lazy-dialog placeholders and
announced view loading. Lazy loading failures use ApplicationBoundary.

Statistics show history in batches of 50, with an announced visible/total count
and an explicit Show more control. Search, aggregates and export cover all stored
sessions. Edit/delete controls remain visible on touch screens and have 44 px
targets; entering the inline Save/Cancel controls must not trigger an early save.

## State contract

- Loading: `role=status`, meaningful translated text. A pending dialog remains
  closeable by keyboard. Do not replace a screen with an unexplained blank box.
- Empty: statistics offer the first session; zero history is displayed honestly.
- Error: ApplicationBoundary and sync UI show localized, allowlisted information.
  Keep saved data and offer a retry. Do not expose raw Firebase/native failures.
- Disabled: native `disabled`; Switch also suppresses interaction and dims state.
- Offline: SyncStatusIndicator distinguishes a local-only profile from an offline
  connected profile. Pending writes remain queued; active timers remain local.
- Hidden: task presets become inert and aria-hidden when a task replaces them.
  Visual clipping alone must not leave invisible buttons in the tab order.
- Selected: use aria-current, aria-selected, aria-pressed or aria-checked as
  appropriate. Never use color as the only indication of state.

## Responsive and accessibility rules

Timer remains a centered, deliberately narrow workspace. It is not a dashboard
with unused chart columns. The primary action stays visible at the tested phone
and desktop widths. Mobile navigation sits above the safe area; content reserves
space for it. Long text may wrap; pages must not overflow horizontally at 320 px.

Keep one h1 per active screen. Timer names the product visibly on phones and
retains a screen-reader heading on desktop, where the navigation shows its name.
Normal labels are sentence case. Small uppercase tracking is retired; the legacy
`text-overline` utility now maps to the readable label token for compatibility.

Zoom and pinch gestures are enabled. Dialogs contain keyboard focus and restore
the opener. The timer has textual accessible state and completion announcements;
sound and animation are supplementary. Touch targets of the shared button,
switch and close control are 44 px. System `prefers-reduced-motion` and the app's
`reduce-motion` preference disable travel and repeated animation.

## Visual evidence and direction

The `design-taste-frontend` app-screen workflow dealt **Editorial greeting**,
seed **2029456425**, retaining brand palette and type. This is an incremental
restyle of existing components: the dashboard grid/sidebar blueprint was not
adopted because Focus Flow's current job is a single centered timer. No new
pictures, licensed assets or invented sample data were added. The dial is the
product-specific element; its working countdown is the interaction.

Screen questions: Timer — what am I working on and how much time remains?
Statistics — what did I complete? Settings — which preference do I need to change?
The paper/brick palette is an explicit existing-brand exception (`palette-cream`).
The remaining inspector `hero-void` warning is accepted for the centered focus
workspace. Do not fill it with unnecessary panels.

Before/after screenshots, inspector reports and axe output live in ignored
`test-artifacts/modernization/` and `/tmp/focus-flow-ux-audit/`. The modernization
report records the review and limitations; these artifacts do not certify a
screen reader, Safari, real hardware or every app state.
