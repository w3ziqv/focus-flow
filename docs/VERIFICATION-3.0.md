# Verification — 3.0.0-alpha.1

Updated: 2026-10-09. Local baseline: 2026-10-03. Base `a2f5f22`, branch `feature/v3-desktop`. These are
observed local results. The stable tag remains blocked by the acceptance gates
below. GitHub CI results must be recorded for the pushed commit separately.

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

1. **Live cloud/OAuth:** public Firebase configuration and Desktop OAuth client
   are not available here. Test system-browser login, state/PKCE callback,
   credential-store refresh after restart, revocation and memory-only fallback on
   both supported OS. Then run the documented two-device scenarios against
   staging/live configuration, not just emulator-authenticated profiles.
2. **Older data:** compare real exports before/after migration. Unknown overlap
   in legacy aggregates and time-zone changes cannot be inferred perfectly from
   missing historical session IDs. Keep the versioned source backup and verify
   conservative totals before tightening production rules.
3. **Linux/Windows acceptance:** installer installation/update/rollback with
   backups, actual tray shell/mini focus, audio output/migration, notification
   delivery, login-cycle autostart and hardware suspend/resume remain open.
   CI Windows smoke is a fresh-install test; compilation alone is insufficient.
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

The latest Windows correction and dependency update still require a fresh full
CI result. Exact current-commit run links, results and any failures are maintained
in the draft PR body. Native builds and installed-runtime checks are separate
jobs, so a failed runtime check can be repeated without rebuilding installers.
Reusing a previous run requires identical application source and lockfiles, and
checks the downloaded installers' SHA-256 before execution.

All outstanding stable gates above still apply, even after a green runtime smoke.
