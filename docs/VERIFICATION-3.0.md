# Verification — 3.0.0-alpha.1

Updated: 2026-10-10. Local baseline: 2026-10-03. Base `a2f5f22`, branch `feature/v3-desktop`. These are
observed local results. The stable tag remains blocked by the acceptance gates
below. GitHub CI results must be recorded for the pushed commit separately.

## 2026-10-10 isolated cloud and recording follow-up

- A subsequent failed attempt exposed a cache boundary: stored Google identity
  was not scoped to a Firebase project, and startup sync could issue requests
  before Firebase Auth restored its session. The new test project's authenticated
  user listing was empty; an unauthenticated SDK metadata read reproduced
  `permission-denied` without writing data. These observations support a missing
  test login, but do not prove the cause of every denied request.
- Cached connections now include project identity. A backend change requests
  Google reconnection without clearing local history, settings or the upload queue.
  Startup sync/polling await Auth restoration and reject a missing or mismatched
  identity before Firestore access. The local-data consent boundary also includes
  project identity, even for identical UIDs. Error details show only the public
  project ID and an allowlisted error code. Live acceptance remains pending.
- Local cache/auth follow-up: **787 tests passed**, one emulator-only test skipped;
  TypeScript, ESLint, web/desktop builds and build isolation passed. New regressions
  cover project changes, equal UIDs across backends, preserved local data/queue,
  delayed or missing Auth restoration and mismatched authenticated accounts.
- Live Preview UI also reproduced a stale deployment chunk: the existing tab
  referenced `StatsView-CJWB-efP.js` after the alias moved, leaving a blank view.
  Reloading switched the entry bundle from `index-Dehtt_hg.js` to
  `index-BeaH65FS.js` and restored all **805 synthetic sessions / 20,125 minutes**.
  The app now attempts one online recovery reload per entry bundle, with a
  session-storage guard against loops, and offers a localized accessible manual
  retry when a view still fails. Application data and service-worker caches are
  not cleared; offline failures do not trigger automatic reloads. Startup errors
  use safe messages and offer backup restoration only on desktop.
- Recovery follow-up: **794 unit tests passed**, one emulator-only test skipped;
  TypeScript, ESLint and both build targets/isolation passed. The production
  browser test now injects a retired StatsView asset (HTTP 404) and verifies the
  automatic reload limit, manual fallback/retry and retained task/history. Record
  its CI result separately before claiming that injected browser scenario passed.
  Recovery uses [Vite's documented preload-error event](https://vite.dev/guide/build.html#load-error-handling).

- Actual deployed production rules omit `daily_history`; the owner's v3 sync
  attempt returned `permission-denied`. Production rules were backed up and
  preserved. With the owner's approval, a separate Standard test Firebase
  project was provisioned in europe-west1. Reviewed rules passed syntax validation
  and exact authenticated read-back. Google sign-in and the stable Preview domain
  are configured; six Vercel variables are scoped only to `test/v3.0-cloud`.
  The rebuilt `f463935` Preview `dpl_3qVP9keLp6kwx8fHcZ7GHFnBdWRr` is READY.
  Auth preflight passed; live user login/two-profile sync remain unverified.
- Local follow-up: **778 tests passed**, one emulator-only test skipped;
  TypeScript and ESLint passed. Web/desktop builds and isolation passed, including
  identical bundled audio assets, the 2 MiB per-file budget and actual service
  worker precache entries for recordings/attribution. FFmpeg fully decoded both
  58-second, 32 kHz stereo files and verified their manifest SHA-256 hashes.
- The browser sound picker selected rain and waves and displayed the source/
  license disclosure without console warnings/errors. This does not certify
  audible hardware output. Screenshot capture was unavailable for this check.
- Eleven new audio regressions cover caching, delayed decode/switch/disposal,
  pause, preserving the previous texture, failed network/HTTP/codec/oversized
  assets and timeouts. Existing zero-asset checks were replaced by a bounded
  two-recording palette check. CI now also exercises actual offline PWA decoding
  and bundled MP3 decoding in installed Linux/Windows WebViews; record their
  results for the new head before claiming those runtime checks passed.

| Check | Observed result |
|---|---|
| TypeScript, ESLint, build isolation | Passed |
| Unit suite | 55 suites passed, 755 tests passed; emulator-only suite skipped locally and run separately |
| Firestore emulator | 50 authorization checks passed, Firebase CLI 15.32.1 / Java 21 |
| Real shared adapter + Firestore | Two isolated profiles, 1105 sessions, legacy migration/source backup, settings, edit conflict, offline failure/retry, totals, permanent deletion and full-page masking passed |
| Remote preferences | Sound engine/UI refresh from already saved remote preferences without upload echo; active phase keeps its original settings/duration across pause, restart and closed-app expiry; remote settings apply to the next phase |
| Partial batch failure | 805-session upload retried without duplicate IDs; six writes per session batch respect rule-access limits |
| Sync timeout | Slow requests making progress continue beyond one minute; a stalled transport times out without dropping queued sessions |
| Account isolation | Consent required even without sessions; replace backs up/clears profile, milestones and active task/checklist while keeping the local countdown; stale in-flight reply rejected after logout |
| npm audit | Zero advisories, including development dependencies |
| Cargo audit | 578 dependencies, zero vulnerability entries; one unmaintained proc-macro-error notice remains visible |
| Rust format / Clippy all targets | Passed with project warnings denied; vendored GLib emits upstream compiler lifetime-style warnings |
| Rust tests | 7 passed: atomic replacement/recovery/private permissions, schema boundary, tray raster, Firebase values/path scope, PKCE vector, patched GLib iterator |
| Optimized GLib regression | Passed in release mode, 10,000 iterations covering front/back/skip/final operations |
| Web/PWA and desktop frontends | Both built; PWA assets present only in web build |
| Native Linux | Built and loaded embedded assets in real Tauri WebKitGTK window |
| Native controls and mini | Start/pause/reset/skip, persistence, shared timer, 220×80 mini and main-only command denials passed |
| Linux X11 hotkey / autostart | Actual Ctrl+Alt+Space toggled twice; isolated enable/query/disable restored initial state |
| Native sound permissions | Binary sound-file round trip/remove passed; out-of-scope read denied |
| Notifications / discovery | Permission IPC and mDNS lifecycle passed; physical delivery/second-device discovery unverified |
| Browser / P2P | Timer/navigation/persistence/390px layout, two profiles and bidirectional offline edit/delete conflict convergence passed |
| Production PWA offline | Reload and timer/statistics/guides/settings worked with network disabled |
| Accessibility | Polish timer/stats/cloud, keyboard modal trap/return, 200% CSS zoom with no overflow; axe reported no violations in enabled A/AA checks |
| Installer | Local unsigned Linux .deb built, SHA-256 verified and its extracted release executable passed native smoke. CI targets Ubuntu .deb/AppImage and Windows NSIS |

## Evidence and environment

Scripts are in `scripts/`: `test-browser.mjs`, `test-web-offline.mjs`,
`test-accessibility.mjs`, `test-firestore-rules.mjs`, `test-native.py`,
`test-linux.sh`, `test-windows.ps1` and `checksums.mjs`. The real adapter integration is
`src/lib/sync/adapter.emulator.test.ts`. The emulator is loopback-only with the
demo project; no production Firebase data or credentials were used.

Native smoke ran on Arch Linux x86_64 under isolated Xvfb X11 and D-Bus profiles.
GTK/WebKit packages and build tools were staged in temporary paths without system
package changes. The relocated WebKit test launcher disabled its process sandbox
only for this isolated run; production source/configuration does not disable it.
This is not normal-distribution installation acceptance or a Wayland test.

Screenshots in [verification/](verification/) were inspected. They contain test
fixtures, not user session data. `accessibility-results.json` records zero
violations and some incomplete contrast checks requiring manual review. Axe and
200% CSS zoom do not certify WCAG, browser/OS zoom or screen-reader usability.
The README's unsupported AAA certification badge was removed.

## Outstanding stable release gates

1. **Live cloud/OAuth:** isolated web Firebase is configured; live acceptance is
   confirmed for initial web synchronization, with full two-device acceptance
   pending. A Desktop OAuth client was created in the isolated test project on
   2026-10-10. Test system-browser login, state/PKCE callback,
   credential-store refresh after restart, revocation and memory-only fallback on
   both supported OS. Then run the documented two-device scenarios against
   staging/live configuration, not just emulator-authenticated profiles.
2. **Older data:** compare real exports before/after migration. Unknown overlap
   in legacy aggregates and time-zone changes cannot be inferred perfectly from
   missing historical session IDs. Keep the versioned source backup and verify
   conservative totals before tightening production rules.
3. **Linux/Windows acceptance:** fresh CI installation and timer/mini/IPC tests
   pass on Ubuntu and Windows runners. End-user desktop installation,
   update/rollback with backups, actual tray shell/mini focus, audio
   output/migration, notification delivery, login-cycle autostart and hardware
   suspend/resume remain open. CI smoke does not reproduce a physical desktop.
4. **Accessibility:** test real screen readers, browser/OS zoom, high contrast and
   keyboard on supported systems. Some axe contrast nodes require manual checks.
5. **Production configuration:** no live Firebase rules, Vercel policy or GitHub
   branch protection changes are certified. Deploy only after staging review.
6. **Distribution:** installers are unsigned. SHA-256 checks integrity, not
   publisher identity. The local Arch-built .deb does not establish Ubuntu ABI
   support; use and test the Ubuntu CI artifact. Release size/idle CPU/RAM goals
   were not measured. Vite warns about the existing large lazy Firebase chunk.

P2P and macOS are experimental. Linux WebKitGTK here lacks WebRTC; pairing is
visibly disabled. This does not replace the required cloud path.

Do not merge or publish `v3.0.0` until every stable gate is closed. See
[ROADMAP.md](ROADMAP.md), [CLOUD-SETUP.md](CLOUD-SETUP.md),
[INSTALL-UPDATE.md](INSTALL-UPDATE.md) and [security report](../specs/security/SECURITY_REPORT_v3.0.md).

## GitHub publication and CI

Branch `feature/v3-desktop` is published and [draft PR #4](https://github.com/w3ziqv/focus-flow/pull/4)
is open against `main`. No stable tag or release has been published.

### Confirmed 2026-10-03 remote results

For `751b1e8c9b1807388753c0e2d7e75a57881e8b51`:

- [CI](https://github.com/w3ziqv/focus-flow/actions/runs/37137515699): passed,
  including 755 tests, lint/types, npm audit and both frontend builds/isolation.
- [Security](https://github.com/w3ziqv/focus-flow/actions/runs/37137515648): passed,
  including 50 Firestore checks, 1105-session integration and Cargo audit.
- [Desktop](https://github.com/w3ziqv/focus-flow/actions/runs/37137515685): browser,
  Ubuntu native/optimized GLib tests, .deb/AppImage packaging and fresh .deb
  installation/runtime smoke passed. Experimental macOS tests/DMG packaging passed.
  Windows Rust tests and NSIS packaging/installation passed; runtime did not.

Ubuntu's installed smoke exercised the timer, shared 220×80 mini, main/mini IPC
isolation, sound-file round trip and scope denial, notification-permission IPC,
X11 shortcut, autostart settings and discovery lifecycle. It ran with native
Ubuntu libraries, a fresh Xvfb/DBus profile and the shipped process-sandbox settings.
No actual notification delivery, audio playback, login-cycle autostart or physical
sleep/resume is implied. The headless runner lacked a working wake-lock service;
the application showed a human-readable message and kept its timer usable.

Linux .deb/AppImage, Windows NSIS and experimental macOS DMG were downloaded and
SHA-256 verified. They are unsigned alpha artifacts. A repeat of relocated WebKit
on Arch failed even for the previously tested local executable; this extra
cross-environment check is not a pass and is separate from native Ubuntu smoke.

### 2026-10-09 continuation

The Windows diagnosis separated two issues:

1. Elevated CI hosts ignore user-writable WebView2 debug environment overrides
   by design. The test harness uses app-specific HKLM automation policies on the
   disposable runner and restores the original values afterward. Production
   source does not enable remote debugging or weaken WebView2's elevation checks.
2. Once the harness connected, mini creation stalled. Tauri documents a Windows
   deadlock when constructing a WebView in a synchronous command/UI event.
   Creation now runs in a blocking worker, with serialized requests and an
   explicit main-window guard. Regression smoke covers command and event paths.

The initial resumed [CI](https://github.com/w3ziqv/focus-flow/actions/runs/37962604149)
stopped on a newly reviewed high-severity source-map-js advisory
[GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q).
The lockfile now pins its patched 1.2.2 version; no audit threshold or advisory
ignore changed. The post-update local npm audit reported zero vulnerabilities.

The Windows correction and dependency update passed full CI for
`bb110d5f981bee375dfd760085a9c6105780197a` on 2026-10-09:

| Workflow | Result |
|---|---|
| [CI](https://github.com/w3ziqv/focus-flow/actions/runs/37963102559) | Passed: 755 tests, types/lint, npm audit and build isolation |
| [Security](https://github.com/w3ziqv/focus-flow/actions/runs/37963102580) | Passed: 50 Firestore checks, real adapter integration and Cargo audit |
| [Desktop](https://github.com/w3ziqv/focus-flow/actions/runs/37963102681) | Passed: browser/PWA/accessibility, fmt/Clippy, native tests, packaging and fresh installed-runtime tests |

Native Rust suites passed: 7 tests on Linux, 6 on Windows and 6 on experimental
macOS, plus the optimized GLib regression on Linux. Both installed runtimes
passed the mini command/event-path regression, timer/persistence, main/mini IPC
isolation, sound file scope, notification-permission IPC and autostart settings;
Linux additionally passed the actual X11 shortcut check. Windows screenshot
[mini](verification/windows-mini-oct9.png) confirms a rendered 220×80 window.

The .deb, AppImage, NSIS and experimental DMG from this run were downloaded and
all four SHA-256 hashes matched their manifests. Current run results for later
commits are maintained in the draft PR body. Native builds and installed-runtime checks are separate
jobs, so a failed runtime check can be repeated without rebuilding installers.
Reusing a previous run requires identical application source and lockfiles, and
checks the downloaded installers' SHA-256 before execution.

All outstanding stable gates above still apply, even after a green runtime smoke.

## Arch/Hyprland acceptance and AppImage follow-up (2026-10-10)

The owner tested the SHA-256-verified `381608a` Ubuntu AppImage on Arch Linux
with Hyprland/Wayland and confirmed the native window and timer work. The test
uses a separate XDG data/config/cache profile; no daily profile is modified.
Runtime logs exposed missing GStreamer `appsink`, `appsrc` and `autoaudiosink`.
The AppImage contained core libraries but omitted plugins; the existing CI
installed-runtime check exercised only the `.deb` and did not cover that gap.

The follow-up enables Tauri's `bundleMediaFramework` and adds a separate
AppImage runtime smoke with bundled plugins/scanner and host plugin discovery
excluded. Desktop runtime run `38065252932` passed both Linux packages and
installed Windows, using source-verified installers from `38063630235`.
The initial packaging run's overall result was a failure from AppImage driver
HTTP resets; the corrected runtime harness retained every assertion and passed.
The AppImage may be larger.

Desktop controls now open as a compact settings detail with the same icon,
card, typography and spacing patterns as other settings. Experimental local
pairing moves to Advanced integrations; unsupported WebRTC remains clearly
explained with a disabled switch. Three added navigation regressions pass;
local totals are 797 passed and one emulator-only skip, with TypeScript,
ESLint and the desktop frontend build passing. Native Linux/Windows smoke
now verifies the detail navigation and captures settings screenshots. On
2026-10-10 the owner quit the older application and launched the SHA-256-verified
`ba300dc` AppImage using the same isolated profile after a full native data
directory backup. Startup no longer reported missing GStreamer plugins. The
owner explicitly accepted the new settings appearance and audible playback.
This is Linux acceptance for those checks, not Windows hardware acceptance.

A separate Desktop app OAuth client has now been created in the test project
with action-time owner approval. CI configuration is being prepared for an
explicit isolated test-cloud build. System-browser login, keyring restoration,
refresh/revocation and unavailable-store acceptance remain pending. Saved
credentials now carry project identity and use project-specific OS store entries.
Two Rust regressions cover equal-UID project isolation and legacy/empty credentials;
their results must be recorded from the new source revision before acceptance.
