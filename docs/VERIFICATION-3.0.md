# Verification — 3.0 release preparation

Updated: 2026-10-28. The current candidate is recorded first; the following dated
sections preserve historical results. Initial local baseline: 2026-10-03,
base `a2f5f22`, branch `feature/v3-desktop`. The stable tag remains blocked by
the acceptance gates below.

## 2026-10-28 UI candidate

This is the pre-localization baseline. PR #8 subsequently merged as `cb3e238`;
its exact required CI (`40717230990`), Security (`40717231009`) and Desktop
(`40717230923`) all PASS. Production Desktop `40720464290` is a separate run
for literal `cb3e238`; inspect its current result. The owner then requested a
full translation audit, Spanish/Simplified Chinese and review of all 27 guides.
Those changes require new release evidence before publication.

Real Google browser follow-up PASS on application-equivalent `5143cd7`: owner
selected accounts in native popups, account restored and synchronized after page
reload; two independent HTTPS origins transferred 501 sessions / 12525 minutes,
including the original session plus 500 synthetic records. Pagination and search,
online edit propagation and deletion propagation PASS. Final exports show 500
sessions / 12500 minutes, the expected ID set and unchanged original session
content. The owner has only one test account; real account switching remains
unavailable. This is not physical two-device or real network-cut acceptance.
Private exports remain outside Git. See the updated handoff for limitations and
the corrected snapshot history.

Candidate: `575f070997b7824ddcabaec28eb2bc1c102e1815` on protected
`codex/v3.0-release`; application source matches test candidate `5143cd7`.
PR #6 merged after all required application/security/browser/installed checks.
Current main PR #7 remains draft; production publication is pending acceptance.

- [Application CI 40711072975](https://github.com/w3ziqv/focus-flow/actions/runs/40711072975):
  PASS (844 unit tests, lint/typecheck/tokens/boundaries, npm audit, both frontend
  builds and isolation).
- [Security 40711072823](https://github.com/w3ziqv/focus-flow/actions/runs/40711072823):
  Firestore and Rust PASS. Patched native webpki/roots/Tokio versions remain in
  the lockfile; advisory policy was not relaxed.
- These PR jobs checkout the synthetic merge `369ec403265b582c7d1efc716e8298165242b2f6`.
  Fetched both commits and verified equal full trees
  `9de9aebb77e125feed2e671f3efdc90ed42e16f9` and an empty diff with the candidate.
- [Production Desktop 40710979304](https://github.com/w3ziqv/focus-flow/actions/runs/40710979304)
  checks out the literal candidate SHA: PASS for native Linux/Windows/macOS,
  installed Linux/Windows and Windows baseline install → in-place upgrade →
  pre-update backup rollback. All four installer hashes and strict native
  metadata were verified after download. Public metadata identifies production
  project `focus-flow-70527` and source `575f070`; no stable tag/release exists.
- The separate PR Desktop run `40711072751` failed twice: screenshot transport
  closed through the tauri-driver proxy, then a rerun completed every assertion
  but portal shutdown recreated a file during temporary-profile cleanup. These
  runs remain failures. Repair `9214af0` uses direct native WebKit for both Linux
  packages and bounded cleanup retries, retaining exhausted/original failures.
  [Runtime-only 40716032967](https://github.com/w3ziqv/focus-flow/actions/runs/40716032967)
  PASS on the same verified production installers after an exact application
  source comparison. It intentionally skips packaging; it is not a new build.
  Full required PR checks are tracked in
  [PR #8](https://github.com/w3ziqv/focus-flow/pull/8).
- Web staging `dpl_8vXsRVKyQSCoMBfdZC6rms79Kxfw`: literal candidate SHA,
  production target/configuration, READY. Six HTTP headers exactly match
  `vercel.json`; task/timer identity after reload, configured Google UI without
  sign-in, PWA installation/offline navigation, 390px layout and no page errors
  PASS. Own fresh synthetic browser profile; no Google sign-in or cloud writes.
- Both custom domains still use `dpl_7kbjGztvYdG7HrryQyMG3boTXZMJ`.
  Production rules still differ from source. Rules/domain read-back on 28.10
  confirmed this; no live migration or publication was performed.
- Physical OAuth, two-device scenarios, revocation, credential-store fallback,
  OS integration and physical upgrade/rollback remain PENDING. Use
  [the exact procedure and result form](TESTING-UI-RELEASE-2026-10-28.md).

Implementation/local measurements: [UI report](modernization/2026-10-27-ui.md).
Raw staging evidence and screenshots remain in ignored
`test-artifacts/ui-architecture/staged-575f070/`; access parameters and private
backups are outside Git/CI.

## 2026-10-18 candidate and final-version CI

Protected candidate PR #5 merged as `9a832e5dc95be8223fa1fb2069f22b36ad0955cf`
after source `8ff6e251ab7763e6b7db7c1b2a2905cc33330b36` passed CI, Security,
browser, all native packages and installed Linux/Windows checks. The Linux
WebKitDriver teardown connection closure was handled only during final deletion;
earlier assertions and transport failures still propagate. Production-configured
RC packaging/runtime run `39156763929` is in progress on the protected merge.

Final `3.0.0` metadata and draft notes are prepared. Their first source
`a22f05a594e80ba5d138e6e354ec49645d9d4110` passed application CI and Security;
final native/runtime checks and publication remain pending. The owner reported
revocation/reconnection, account switch, unavailable credential storage and Linux
backup rollback as not yet tested, then requested the application be opened.
The verified alpha.2 AppImage was started on the previous local profile after
a full native backup. A private comparison confirmed all prior session IDs and
unchanged history/minute totals; only calendar-dependent week/streak changed.
This is profile-retention evidence, not rollback or production OAuth acceptance.

## 2026-10-18 physical Windows owner acceptance

The owner answered “Tak — wszystko działa” to the explicit question about real
Windows Google login, synchronization and operation after restarting the app.
Those three scenarios are accepted as owner-reported physical Windows results.
The question referred to the current `3.0.0-alpha.2` candidate; an exact installer
hash and Windows version were not supplied. This is user acceptance, not a new
automated run or independent verification of token refresh internals.

The owner subsequently answered “Tak — wszystkie wymienione działają” to the
explicit remaining-hardware question covering Windows and Linux notifications,
autostart after login, sleep/resume, tray/mini and screen-reader operation. These
are accepted as owner-reported checks on the preceding candidate; exact OS/reader
versions and installer hashes were not supplied. Production OAuth, revocation,
unavailable credential storage and update/backup rollback remain separate gates.

## 2026-10-18 production preparation and private migration acceptance

- Authenticated inspection verified both current databases as Standard edition,
  Firestore Native, `europe-west1`. Test rules exactly match source; production
  rules still omit `daily_history`. Production was not migrated or overwritten.
- A private local snapshot of current production documents and the exact deployed
  rules/release was saved with restrictive permissions. The application adapter
  successfully migrated that real older snapshot in the loopback emulator with
  v3 rules: history totals, session identities, retained legacy source, a fresh
  local profile and JSON export/restore all passed. No real fixture or user
  contents are committed. The explicit `test:migration` command fails without a
  private snapshot and loopback emulator.
- Java 21 was provisioned temporarily from the official Temurin distribution,
  with its SHA-256 checked. All 50 rule authorization checks and the 1105-session
  adapter integration passed locally. The ordinary suite passed 817 tests; its
  two optional acceptance tests are skipped outside their configured runs.
- npm audit returned zero advisories. TypeScript, ESLint and five Node desktop
  configuration/metadata regressions passed. New production mode requires a
  protected main or dedicated release-candidate branch,
  consistent production Firebase/client identifiers and exact installer source
  metadata. Fresh native/installer results are still required for these changes.
- GitHub `Production` now permits only protected branches; main protection was
  read back with the required PR and CI/security/Linux/Windows checks. Six public
  production Firebase build variables were configured there and read back by name.
- With explicit owner approval, `Focus Flow 3 Desktop Production` was created in
  the production Google project. Its ID and issued parameter were saved only in
  GitHub `Production`; the private temporary parameter file was removed. Google's
  token endpoint returned `invalid_grant` for a deliberately invalid code,
  verifying client configuration without user authorization. Actual production
  installer Google login/restoration still needs acceptance.
- With explicit owner approval, a conditional Token Creator grant was added only
  to the test project service account, with a one-hour expiry. It was removed and
  read back immediately after minting the short-lived synthetic test identity.
  No service-account key was created.
- Live test-cloud acceptance passed in 98.71 seconds using two independent
  authenticated SDK clients and the real application adapter: 1105 sessions,
  retained legacy totals, settings convergence, conflicting edits, a simulated
  transport failure and retry, permanent deletion and masking beyond 1000 records.
  This verifies real backend behavior; it does not substitute for physical
  two-device or Google OAuth acceptance. The synthetic Auth user and all tested
  document collections were confirmed absent afterward; the temporary IAM grant
  was confirmed absent and the local token fixture was deleted.
- Fresh candidate Security run `39153617792` passed Firestore checks but failed
  Cargo audit on rustls 0.23.45: RUSTSEC-2026-0346/0347/0348/0349, all patched
  in 0.23.46. The lockfile is updated to 0.23.46 and must pass a new audit before
  release. Four unmaintained dependency notices remain visible; no threshold or
  advisory-ignore change was made. This supersedes older clean-audit evidence.
- Production desktop now uses a separate public API key limited to Identity
  Toolkit, Secure Token and Firestore. Its invalid synthetic-token probe reached
  token validation without signing in or creating a user. The web key was not
  modified. Its browser-restriction object had an empty allowed-referrer list,
  so object presence alone did not establish blocked native requests.

See [the production rollout](PRODUCTION-ROLLOUT-3.0.md) for the remaining sequence
and rollback boundaries. Earlier local-only limitations below describe the
initial recheck; the emulator/npm audit follow-up above supersedes those items.

## 2026-10-18 stable-readiness recheck

Baseline: `4f16423652445e94066fd4e8ca8d20f357753198` (`3.0.0-alpha.2`).
This recheck prepares stable 3.0; it does not close unobserved hardware/cloud gates.

- Local application suite: **817 passed**, one emulator-only test skipped.
- TypeScript, ESLint, web/desktop frontend builds and build isolation passed.
  ESLint now excludes ignored `test-artifacts/`: downloaded installer/test profiles
  contained external plugin code that incorrectly caused local lint failures.
  Application source and repository scripts remain in the lint scope.
- Three desktop cloud configuration/metadata regressions passed.
- Real Chromium: timer start/pause, task persistence, navigation, mobile width,
  WebRTC pairing and bidirectional offline edit/delete convergence passed.
- Production PWA: offline reload/navigation/settings, rain/waves decoding and
  attribution passed. Retired-asset recovery preserved task/history and respected
  the automatic reload limit; manual retry passed. No page errors were reported.
- Production-preview accessibility: Polish timer/statistics/cloud, enabled axe
  A/AA checks, modal keyboard focus/return and 200% CSS zoom passed. Screenshots
  and the report are in ignored `test-artifacts/stable-readiness-oct18/`.
  A real screen reader and physical OS scaling still require acceptance.
- GitHub API read-back confirmed successful CI `38128408761`, Security
  `38128408852` and offline Desktop `38128408764` on the baseline commit.
  These results predate the local lint-scope/documentation changes. Fresh Rust,
  dependency audits, emulator and installer checks were not run locally: this
  environment has no Cargo/npm command. Frontend checks used the bundled Node
  executable and installed project dependencies directly.

Remaining work before stable publication:

1. Verify the production-configured candidate; preceding Linux/Windows hardware
   checks and the explicitly listed screen-reader scenarios are owner-accepted.
2. Complete live two-device, revocation/credential-store, older-export migration
   and backup/update/rollback acceptance via [TESTING-CLOUD.md](TESTING-CLOUD.md)
   and [INSTALL-UPDATE.md](INSTALL-UPDATE.md).
3. Keep the owner-reported notifications, autostart, sleep/resume, tray/mini and
   screen-reader acceptance with its candidate/version limitations.
4. Review production cloud migration/configuration; alpha.2 installers currently
   target the isolated test project. Repeat required CI on the release changes
   and verify final installer hashes before publishing `v3.0.0`.

## 2026-10-11 live Linux desktop acceptance

- The owner confirmed real Google login and synchronization in the SHA-256-verified
  `5aa55b5` cloud AppImage on Arch Linux/Hyprland/Wayland. Native persisted metadata
  independently showed a connected account, `synced`, no error, and the isolated
  project `focus-flow-v3-test-20261010` at `2026-10-11T09:07:43.537Z`.
- A controlled restart retained the same isolated XDG profile, with complete data
  backups before stopping and before starting. The new native process restored the
  same account and synchronized at `2026-10-11T09:09:12.797Z` without another Google
  login. Native session serialization omits the access token and expiry, so this
  also exercises Firebase refresh from the system-stored credential. Only status,
  account equality and timestamps were recorded; credential values were not exposed.
- The owner also confirmed that the floating timer opens and that closing the
  main window with its close button leaves the app in the tray; choosing
  `Show Focus Flow` restores the window. This is physical Arch/Hyprland acceptance,
  in addition to the previously accepted timer, settings appearance and audio.
- The owner has access to Windows by switching operating systems. The exact
  cloud-configured Windows artifact and manual procedure are linked in
  [TESTING-WINDOWS.md](TESTING-WINDOWS.md); physical Windows results remain pending.
- Exact application source `5aa55b5bcf0852c79034bcff0a02362884f5de55` passed
  [CI](https://github.com/w3ziqv/focus-flow/actions/runs/38088756258),
  [Security](https://github.com/w3ziqv/focus-flow/actions/runs/38088756248),
  [cloud Desktop](https://github.com/w3ziqv/focus-flow/actions/runs/38088756415) and
  [offline Desktop](https://github.com/w3ziqv/focus-flow/actions/runs/38088756239).
  All 817 application tests, emulator/security checks, native packaging,
  installed Linux/Windows and browser checks passed. Both installed Linux packages
  exercised the OAuth callback while the substitute browser remained alive.
- This accepts initial Linux desktop login, restart restoration and refresh.
  Revocation, unavailable-store fallback, live two-device scenarios, physical
  Windows OAuth and the other hardware/accessibility gates below remain open.

## 2026-10-10 isolated cloud and recording follow-up

- The final `f818220` cloud AppImage passed CI/Security and installed Linux/Windows
  runtime checks, matched its SHA-256 manifest, and was launched after another
  complete isolated-profile backup. Real owner login then failed with
  `sync-failed` before an account was connected. The test profile's default HTTPS
  handler was `chatgpt.desktop`, whereas the host uses `firefox.desktop`; only
  the test-profile browser associations were corrected. Process-tree inspection
  also showed the native OAuth worker waiting for `xdg-open` and its still-running
  ChatGPT child. Launcher supervision now starts callback handling independently
  of a long-lived browser, while retaining immediate-failure fallback and private
  output. Two Rust regressions and the installed Linux callback probe cover this
  lifecycle. Previously omitted native diagnostic codes now survive safe
  normalization; cancellation and login failures are classified explicitly.
  Real Google desktop login was pending at this stage; acceptance is recorded above.
- The owner launched the cloud-configured `67da862` AppImage and reported
  `oauth-browser-error`. On the owner's Arch Linux, running host `gio version`
  with the AppImage environment failed with a GLib symbol error, and Firefox's
  version probe failed because bundled NSS lacked `NSS_3.101`. Both probes passed
  after excluding AppImage paths from the child environment. The fix applies
  only to browser child commands, with Rust environment regressions and an
  installed Linux OAuth-launch probe. Rebuilt installer CI and real Google
  sign-in were pending at this stage; the previous CI did not test this boundary.
- A token-endpoint probe using a deliberately invalid diagnostic code returned
  `invalid_request` / `client_secret is missing` for the created Desktop client.
  No user code/token was supplied or received. The Rust exchange now includes
  this parameter alongside PKCE; build validation rejects missing values and
  metadata excludes it. Google only displays issued secrets once, and the original
  creation value was not retained. A replacement was created with owner approval and
  saved as the Actions secret. The endpoint now returns `invalid_grant` for the
  deliberately invalid code, confirming client validation; no user token was
  obtained. Launcher CI at `8f60301` does not prove a successful token exchange.
- At `8f60301`, native packaging and installed Windows passed, but the installed
  Linux launch probe failed during cleanup because headless CI has no usable
  credential store (`credential-delete-failed`). The probe now simulates declined
  consent on the actual loopback listener instead of invoking logout; it still
  asserts host runtime isolation, PKCE, state, callback handling and a signed-out
  result. Credential-deletion failures remain strict and visible in the product.

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
   2026-10-10. Real system-browser login and credential restoration/refresh after
   restart passed on the owner's Linux on 2026-10-11. The owner accepted physical
   Windows Google login, synchronization and operation after app restart on
   2026-10-18. Consent revocation and memory-only fallback remain open. Then run the
   documented two-device scenarios against
   staging/live configuration, not just emulator-authenticated profiles.
2. **Older data:** compare real exports before/after migration. Unknown overlap
   in legacy aggregates and time-zone changes cannot be inferred perfectly from
   missing historical session IDs. Keep the versioned source backup and verify
   conservative totals before tightening production rules.
3. **Linux/Windows acceptance:** fresh CI installation and timer/mini/IPC tests
   pass on Ubuntu and Windows runners. The owner's Arch Linux window/timer,
   audible playback, floating timer and tray restoration have been accepted.
   Remaining physical Windows controls, installer update/rollback with backups, audio migration,
   notification delivery, login-cycle autostart and hardware suspend/resume remain
   open. CI smoke does not reproduce a physical desktop.
4. **Accessibility:** test real screen readers, browser/OS zoom, high contrast and
   keyboard on supported systems. Some axe contrast nodes require manual checks.
5. **Production configuration:** production Firebase rules and Vercel policy
   remain uncertified. On 2026-10-10 GitHub API read-back verified `main` protection:
   required PR, up-to-date trusted CI/security/browser/installed Linux/Windows
   checks, administrator enforcement and blocked force pushes/deletion. This
   closes only the repository-policy portion. Deploy after staging review.
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

The final native-cloud preparation source `67da862` also fixes disconnect before
the lazy native transport loads: OS credentials must be removed before local
login state is cleared, and removal failures stay visible. Its 799 application
tests pass locally (one emulator-only skip), with TypeScript/ESLint passing.
GitHub CI `38067563930` and Security `38067563906` pass. The Node configuration
regressions run explicitly with Node, avoiding the corrected initial Node/Vitest
runner conflict. Cloud-configured Desktop run `38067589265` and offline Desktop
run `38067563901` are still packaging/testing; live OAuth is not accepted yet.
