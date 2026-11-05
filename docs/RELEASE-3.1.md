# Focus Flow 3.1 — interface update

## Publication follow-up — 2026-11-05

The owner requested publication of 3.1 to the production website and GitHub
Releases after the complete update passed local checks and pull request CI.
The original three bundle commits are preserved, with an additional correction
that rejects delayed P2P data channels after their connection is disconnected.

Repeated local validation passed 907 application tests, 66 Firestore rule checks,
the real synchronization adapter with 1,105 sessions, responsive and accessibility
checks, browser stress, offline recovery, four-language traversal and real WebRTC
pairing between two browser contexts. Native CI passed Linux, Windows and macOS
builds, Rust tests and Clippy, the optimized Linux GLib regression, and installed
application checks on Linux and Windows. Production installers must be built
separately using the protected production cloud configuration.

Physical iPhone/PWA acceptance, real two-device P2P, interactive macOS acceptance,
screen-reader/volunteer acceptance and current real-account OAuth/device scenarios
remain unverified. Publication does not turn these into passing checks. Installers
remain unsigned and macOS remains experimental. Preserve a full backup before
updating; see [installation and rollback](INSTALL-UPDATE.md).

See [pull request #27](https://github.com/w3ziqv/focus-flow/pull/27) for the latest
source and CI results and [release 3.1.0](https://github.com/w3ziqv/focus-flow/releases/tag/v3.1.0)
for published installers and their checksums. Earlier candidate status, local
toolchain limitations and GitHub HTTP 403 notes below describe the November 4
validation and are superseded by this publication follow-up.

Follow-up: the [security and stress review](SECURITY-REVIEW-3.1.md) adds import,
CSV, peer-protocol and batch-aware Firestore corrections plus completed emulator
tests. Its results supersede the initial validation limitations recorded below.

This change implements the shared 3.1 interface for the web, installed PWA and
Tauri frontend. Physical-device and voluntary-user acceptance remain open;
publication does not establish that those checks have passed.

## Everyday journeys

| Journey | 3.0 friction | 3.1 behavior |
| --- | --- | --- |
| Start, pause, reset | Large mobile dial pushes actions down | Viewport-sized mobile dial; one primary action; reset remains secondary |
| Change phase | Long translated labels can crowd controls | Equal-width tabs with room to wrap and a 44 px minimum target |
| Adjust sound | Utility competes with an unlabeled settings icon | Visible sound, focus-mode and timer-settings labels |
| Find/edit a session | Leaving statistics remounts filters and editor | Visited views remain mounted, preserving search and local editing state |
| Export data | Backup tools are nested under app settings | Header download action opens the existing data/export section directly |
| Inspect sync | Status is hidden on the mobile timer footer | Independent status indicator in the header, including offline/error state |
| Read and return | iOS status bar covers titles and close controls | Shared safe insets; sticky guide return; reading route survives tab changes |

The visual foundation retains Fraunces and Instrument Sans, warm surfaces,
readable text and the circular dial. Parchment, Soot and Obsidian use measured
teal accents; Sage and E-ink retain their distinct palettes. All colors still
come from `src/design/tokens.json`; generated CSS must pass `design:check`.
All four languages and all five themes remain available. Reduced motion also
removes entrance delays. No video, external fonts or telemetry was added.

## iPhone PWA correction

`viewport-fit=cover` and the existing translucent status bar allow the viewport
under the system UI. 3.0 reserved the bottom inset but omitted the top and sides.
The shell now consumes all four `env(safe-area-inset-*)` values. Its status-bar
surface stays opaque while content scrolls. Dialogs, focus mode, notices and
navigation use the same inset variables, including landscape notch clearance.
Guide return buttons remain below the top safe area while reading. Content has
space below the mobile navigation and scroll margins for keyboard navigation.

The responsive regression test injects representative inset values because
desktop Chromium does not emulate iOS `env()` values. This verifies geometry;
it does not certify Safari's installed-PWA behavior. On iPhone 16, still check
cold launch, rotation, keyboard open/close, guide scrolling/return, every modal
and every theme, then repeat on another iOS device and Android.

## Data and security

No storage, backup, account or Firestore schema changes. Active deadlines remain
local. View changes preserve task/checklist content, filters and the current
guide route; guide Escape handling is inactive when its view is hidden.
Statistics refresh stored sessions without remounting the editor on timer ticks.

Updated Firestore's transitive `re2js` dependency from 2.8.6 to 2.9.1 to address
GHSA-gg6h-894w-4m9c (high-severity quadratic matching denial of service).
Production dependency audit passes. Remaining low/moderate build-tool advisories
are not hidden by a forced incompatible dependency downgrade. The follow-up
changes candidate Firebase rules; production rules/data were not changed.

## Design source

[Editable state explorations in Figma](https://www.figma.com/design/EaWdTXpzfSDLfHYzUOg7CZ)
cover mobile/desktop idle, running, paused, break, statistics, audio, settings,
offline and sync-error states. They use product fonts, semantic text, auto-layout
and reusable button instances, without UI screenshots as flattened designs.
These are **draft explorations**: the Starter MCP call limit blocked the final
layout corrections after visual review identified control spacing/wrapping
issues. The tested application and shared code tokens are authoritative.

## Validation

See the validation record below for executed checks and measurements. Generated
logs/screenshots are local in `test-artifacts/v3.1/`; they contain synthetic test
data, not personal histories. Browser-based results are not native OS acceptance.

Before production publication, complete the roadmap's five-volunteer exercise:
at least four testers must start/pause, find audio and export a backup without
assistance. Record observations manually. Also complete real screen-reader and
physical iOS/Android checks. Native installers need their own runtime validation;
unsigned-installer and macOS limitations in `INSTALL-UPDATE.md` still apply.

### Executed checks (2026-11-04)

- TypeScript, ESLint, generated-token consistency and UI import-boundary checks.
- 68 unit-test files / 872 tests passed, including storage, timers, imports and
  sync-adapter coverage. A resource-contended run hit timing limits; the complete
  rerun passed without relaxing assertions.
- Web and desktop frontend builds; PWA/native build isolation verified.
- 16 responsive language/viewport cases, injected standalone safe-area geometry,
  five themes, retained guide route/checklist/task/deadline and JSON download.
- Nested-dialog keyboard trap/restore, timer-setting drafts across resizing,
  audio changes, language changes and synthetic sync/offline/reconnect states.
- Four-language production traversal: 108 guide views and their source links,
  Markdown export, retained timer/history, reload and 20 axe states.
- Additional Polish axe checks, 200% CSS zoom and 320 px overflow checks.
- Production PWA offline reload, navigation/settings, complete rain/wave decode,
  attribution availability and recovery from a retired asset without data loss.
- UI-render profiling: header, navigation, dialog host, statistics and guides had
  zero tick-driven renders across 15 measured scenarios. The timer still updates.
- `npm audit --omit=dev`: zero vulnerabilities. The full audit has no high or
  critical vulnerabilities; low/moderate development-tool findings remain.

The experimental WebRTC-pairing portion of `test:browser` timed out in this
runtime; no pairing pass is claimed. Local Firebase emulator CLI bootstrap was
not completed; emulator/rules/native-installer acceptance is not claimed.
Existing dedicated security and desktop CI workflows remain in place. New CI
coverage runs the responsive, accessibility and dialog-interaction suites.

### Publication boundary

The configured GitHub integration rejected blob creation with HTTP 403,
`Resource not accessible by integration`; ordinary Git push was also rejected
with HTTP 403. Changes are therefore supplied as a local commit/patch. No PR,
production deployment or installer publication is claimed. Restore write access
to `w3ziqv/focus-flow` before pushing the branch and running remote CI.

### Before/after measurements

Raw samples are committed in [validation/3.1](validation/3.1). Both localhost
builds used Node 24.22.1, Chromium 155.0.8059.79 and the same installed dependency
set (including the `re2js` fix); the baseline UI source is `b35d2db`. Measurements
ran sequentially after the functional suites, with no test/build workload in
parallel. These are synthetic laboratory observations, not field performance.

For the existing browser harness: 390×844 viewport, blocked service workers,
three fresh contexts at each CPU rate, five-second running-timer samples, then
brown noise and rain. Values below are medians. LCP is repeated across the three
sound states because startup is measured once per context.

| Measurement | 3.0 source | 3.1 candidate |
| --- | ---: | ---: |
| Startup LCP, normal CPU | 816 ms | 724 ms |
| Startup LCP, 4× CPU slowdown | 1,204 ms | 1,172 ms |
| Initial decoded JS resource bytes | 435,912 | 436,614 |
| Main-thread time / 5 s, normal CPU, audio off | 352 ms | 300 ms |
| Main-thread time / 5 s, normal CPU, brown noise | 322 ms | 288 ms |
| Main-thread time / 5 s, normal CPU, rain | 316 ms | 302 ms |
| Main-thread time / 5 s, 4× CPU, audio off | 1,344 ms | 1,238 ms |
| Main-thread time / 5 s, 4× CPU, brown noise | 1,109 ms | 1,167 ms |
| Main-thread time / 5 s, 4× CPU, rain | 1,092 ms | 1,260 ms |

The initial-JS tradeoff is +702 bytes (+0.16%) for direct backup/sync access and
retained view state. Normal-CPU timing did not regress in these samples. The
4× rain main-thread median rose 15.4%, but sample ranges overlap (3.0: 999–1,334
ms; 3.1: 957–1,626 ms), while median script time fell from 90 to 87 ms. This is
inconclusive under throttling; do not treat it as a general performance sign-off.
Check audio/scroll responsiveness on the target phones before publication.

The separate `scripts/measure-usability.mjs` harness uses five fresh contexts per
release at 393×852 with reduced motion. It measures input/click dispatch to two
animation frames, **not field INP**. Typing medians were 25.3→26.8 ms; Start-click
medians were 23.9→25.3 ms. The differences are below one 60 Hz frame and the sample
ranges overlap. The raw file also retains that harness's startup observations.

### Desktop header follow-up

A visual review found the navigation center at x=604.95 on a 1440 px viewport,
115.05 px left of the timer/window center. Equal-width side columns now keep the
navigation centered regardless of the brand and utility widths. All navigation
controls have the same 44 px minimum height. At 768–1279 px the navigation gets
its own centered row so translated controls can stay on one line.

Browser geometry checks passed 36 cases: four languages at 320, 393, 768, 1024,
1199, 1200, 1280, 1440 and 1920 px. No horizontal overflow or header overlap;
the corrected 1440 px center is x=719.99. Raw bounds are in
[header-layout.json](validation/3.1/header-layout.json). The frontend build passed.
The performance samples above predate this CSS-only alignment follow-up; they
were not repeated for this layout correction.
