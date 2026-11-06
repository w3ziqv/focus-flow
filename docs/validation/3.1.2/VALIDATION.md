# Focus Flow 3.1.2 validation

Validation dates: 2026-11-05 and 2026-11-06. Local environment: Node 24.22.1 and headless Chromium
156.0.8078.79 on Linux. Browser safe-area values were injected for layout testing;
these runs do not emulate Safari's rendering engine or a physical device.

## Completed checks

| Check | Result |
| --- | --- |
| TypeScript | `npm run typecheck` passed. |
| ESLint | `npm run lint` passed. The configuration pins its project root and ignores local `.taste-skill` snapshots. |
| Unit and component tests | `npm run test:run`: 72 files, 910 tests passed. |
| Design tokens | `npm run design:check` passed. Existing theme tokens were retained. |
| Web build | `npm run build` passed, including service-worker generation. |
| Desktop frontend build | `npm run build:desktop` passed. |
| Build isolation and versions | `npm run verify:builds` passed: npm/Cargo versions agree; web has PWA artifacts; desktop excludes them; both contain identical guide covers. |
| Guide and settings matrix | `npm run test:guides`: 80 language/theme/viewport cases passed. |
| Guide and settings accessibility | 30 axe WCAG A/AA audits passed with no violations. |
| Motion browser checks | `npm run test:motion` passed at 320, 393 and 1440px, including three further axe audits with no violations. |
| Nested dialog interaction regression | `npm run test:ui-interactions` passed: keyboard isolation, retained settings draft, sync/audio/language updates and reconnect behavior. |
| Existing responsive regression | `npm run test:responsive`: 16 language/viewport cases passed. |
| Production offline behavior | `npm run test:web-offline` passed: all 14 cover files decoded offline before visiting their categories, and a newly added article opened with its steps and source link. |
| Offline recovery regression | Retired chunk, bounded automatic reload, manual retry and retained timer/history checks passed. |
| Settings subviews | 40 localized 320px/landscape cases passed, including accessibility, notifications, data, nested shortcuts and webhook settings. |
| Existing content audit | 108 introductions changed; all original route IDs, evidence, steps, limits and source destinations retained. 21 guides and 17 references added. |
| Source style check | TasteSkill lint on the changed guide and settings files: zero failures and warnings. |
| Built-app stress regression | 40 start/pause cycles, 30 view cycles, 1,000-session export, quota rollback and resource cleanup passed. The injection check scopes images to active history because local guide covers remain mounted in hidden views. |
| Dependency audit | `npm audit --audit-level=high` passed on 2026-11-06. The registry reports two low and 13 moderate findings in the existing build/lint dependency tree; this release retains the dependency lock. |
| Diff formatting | `git diff --check` passed. |

The 80-case matrix covers four languages, five themes and four viewport sizes:
320×740, 393×852, 768×1024 and 1440×1000. The 393px case injects a 59px top inset
and 34px bottom inset. It verifies seven reachable categories, decoded covers,
localized article content, a compact heading, sticky return access, retained
reading routes when switching views, theme/language settings and focus restoration.

The existing responsive suite additionally covers landscape safe areas, timer
and checklist retention, all five themes and JSON export. Existing component
tests cover settings import/export, notifications, theme changes, narration,
shortcuts and desktop-specific navigation.

## Motion follow-up, 2026-11-06

Directional navigation uses a shared curve and explicit timing tokens. Main views
move 18px over 320ms; depth navigation takes 440ms, with movement capped at 560px
on desktop. Dialogs open over 380ms and close over 260ms. Both reduced-motion
preferences use 100ms fades and remove screen displacement.

The motion browser suite verifies reversal during a paused transition, repeated
navigation before completion, inert departing visuals, cleanup, stationary
header/navigation, sticky article return during movement, restored reading
positions, exact retained session data and checklist content. It also checks
settings height interpolation, nested dialog focus restoration, immediate release
of modal semantics on close, export dialog layering during view movement, and an
OS reduced-motion preference change while an animation is running.

The first review found a lazy category entering with a loading placeholder,
settings height changing abruptly, a departing loading dialog briefly overlapping
its replacement, and temporary clipping creating a scroll ancestor for sticky
returns. The final implementation loads destination content first, interpolates
settings height, animates actual dialog content and uses non-scrolling clipping.
Static motion wrappers do not establish stacking contexts, and opening a dialog
ends screen motion before focus moves. This keeps the statistics export dialog
above navigation.

Screenshots at 320, 393 and 1440px were reviewed during transitions. The settled
Polish settings panel was reviewed again after the loading-dialog repair. The
motion checks report no page errors. The complete unit suite still passes all
910 tests in 72 files. TypeScript, ESLint, web/desktop builds, token generation,
build isolation, responsive regression and production offline recovery pass.

[Motion implementation notes](../../MOTION.md) describe timing and state handling.

## Visual review

Screenshots were reviewed at 390, 768 and 1440px for the library, category, article
and settings views, including light and obsidian themes. The first review found
long Polish category names breaking before the final letter on mobile/tablet.
The final layouts reduce title size and remove the trailing decorative arrow at
those widths. Another review shortened the main sync summary and corrected the
settings panel selector so the shared dialog CSS cannot override its surface.

The style reference was TasteSkill's `editorial-greeting`, seed 1433123440,
keeping the application's palette and type. The implementation uses the existing
shell and modal navigation because this is an update to Focus Flow. The guide
library answers which subject to read; the category answers which article to
open; the reader presents the method and evidence; settings group the current
preferences. Mountain covers and Fraunces headings provide the visual character.
Article counts and reading times come from the content catalog; no sample usage
figures were introduced.

The inspection harness mounts the actual React view components with the shared
header and styles. Interaction and accessibility checks use the full application.
The rendered inspector reports no unresolved failures after two scoped allowances
for the settings dialog: `heavy-shadow` applies to the floating dialog, and
`covered-text` applies to the intentionally obscured background. The following
warnings are deliberate:

- `palette-cream`: the parchment palette is the existing 3.1.1 brand.
- `app-title-size`: editorial reading pages use larger serif titles, matching the
  supplied references. The settings title remains 28px.
- `micro-label`: the category cover has one contextual label over its photograph.

The neutral contrast scrim over photographs is the source linter's documented
image exception. It is recorded inline. The e-ink theme desaturates the photography.

Local logs, matrix reports and screenshots are in `test-artifacts/v3.1.2/`.
These generated files are intentionally excluded from Git.

## Limits

Physical iPhone/PWA acceptance and native macOS/Windows installed-app rendering
were not run. This change builds the desktop frontend; it does not produce or
validate native release installers. Automated accessibility checks do not replace
manual screen-reader testing.

Vite reports a Firebase chunk above its 500 kB advisory size.
The combined guide view/content bundle is about 175 kB before gzip. Covers total 529,050 bytes and
are precached, increasing the offline download in exchange for local imagery.

The research summaries distinguish experimental findings, reviews and health
recommendations. They do not establish that each editorial exercise has been
independently validated. Source-review dates for the original guides are retained;
new entries are dated 2026-11-05. See [the evidence notes](../../GUIDE-CONTENT.md).
