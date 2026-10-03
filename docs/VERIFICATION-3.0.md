# Verification — 3.0.0-alpha.1

Date: 2026-10-03. Base `a2f5f22`, branch `feature/v3-desktop`. These are
observed local results. The stable tag remains blocked by the acceptance gates
below. GitHub CI results must be recorded for the pushed commit separately.

| Check | Observed result |
|---|---|
| TypeScript, ESLint, build isolation | Passed |
| Unit suite | 55 suites passed, 753 tests passed; emulator-only suite skipped locally and run separately |
| Firestore emulator | 50 authorization checks passed, Firebase CLI 15.32.1 / Java 21 |
| Real shared adapter + Firestore | Two isolated profiles, 1105 sessions, legacy migration/source backup, settings, edit conflict, offline failure/retry, totals, permanent deletion and full-page masking passed |
| Remote preferences | Sound engine/UI refresh from already saved remote preferences without upload echo; active phase keeps its original settings/duration across pause, restart and closed-app expiry; remote settings apply to the next phase |
| Partial batch failure | 805-session upload retried without duplicate IDs; six writes per session batch respect rule-access limits |
| Sync timeout | Slow requests making progress continue beyond one minute; a stalled transport times out without dropping queued sessions |
| Account isolation | Consent required even without sessions; replace backs up/clears profile and milestones; stale in-flight reply rejected after logout |
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
| Installer | Local unsigned Linux .deb built; SHA-256 generated. CI targets Ubuntu .deb/AppImage and Windows NSIS |

## Evidence and environment

Scripts are in `scripts/`: `test-browser.mjs`, `test-web-offline.mjs`,
`test-accessibility.mjs`, `test-firestore-rules.mjs`, `test-native.py`,
`test-windows.ps1` and `checksums.mjs`. The real adapter integration is
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

## GitHub publication attempt

Creating the branch through the GitHub connector returned HTTP 403
`Resource not accessible by integration`, including a retry after reconnection.
The local environment has no configured Git credential helper, CLI login, SSH key
or token. Standard Git push also failed because HTTPS credentials are unavailable. No branch/PR was published and no GitHub Actions run was triggered.
The workflow files are prepared, not a claimed remote CI pass. A ready PR body
is provided in [PR-3.0.md](PR-3.0.md); publishing requires repository write access.
