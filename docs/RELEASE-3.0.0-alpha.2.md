# Focus Flow 3.0.0-alpha.2 — cloud-enabled desktop test prerelease

This alpha includes every change from the 3.0 test branch. It is intended for
owner testing before stable 3.0. Production web/Firebase configuration remains
unchanged; these desktop installers use the isolated **focus-flow-v3-test-20261010**
project, shared with the [web Preview](https://focus-flow-git-test-v30-cloud-w3ziqvs-projects.vercel.app/).
Use the same Google account to compare web and desktop history/settings.

## Changes since alpha.1

- Cloud-enabled installers: Google sign-in now uses the system browser with
  PKCE, state verification and a one-time random-port loopback callback. Firebase
  traffic and tokens stay in Rust; refresh tokens use the OS credential store,
  with a visible memory-only fallback when storage is unavailable.
- Fixed AppImage browser launch failures caused by bundled GLib/NSS/interpreter
  paths leaking into host applications. Browser children use host dependencies;
  Focus Flow retains its bundled audio runtime.
- Fixed login waiting for the browser process to exit. Callback handling proceeds
  while the browser remains open, with immediate-failure fallback and background
  child cleanup. Native login/cancellation error codes remain visible safely.
- Account and local-data consent are scoped to Firebase project identity.
  Changing cloud environments requests reconnection without deleting local data
  or queued changes. Web startup waits for authenticated account restoration.
- Bundled offline rain/ocean recordings curated by Moodist, with pinned hashes,
  separate audio/code attribution, bounded assets, smooth switching and procedural
  fallback. Linux AppImage includes the required GStreamer plugins/scanner.
- Desktop settings now match the application's existing cards and navigation.
  Experimental local pairing lives in Advanced integrations; unavailable WebRTC
  controls are disabled with an explanation.
- Retired web view chunks recover through one guarded online reload and a
  localized manual retry. Startup/view errors preserve local data and expose safe
  messages instead of raw developer errors.
- More regression coverage for audio/network/codec failures, cloud-environment
  changes, auth restoration, lazy-chunk recovery and long-lived OAuth browsers.

## Included 3.0 foundation

- Durable bounded sync batches and retries, validated daily-history migration
  with source backups, permanent deletions, full-history task/checklist masking,
  account isolation and preserved totals beyond the 1,000 visible-session limit.
  Completed history/settings/goals synchronize; active timers and custom audio
  files stay device-local. Offline use and optional accounts remain available.
- Tauri desktop shell, atomic local snapshots/recovery, tray, floating timer,
  shortcuts, optional autostart, notifications and wake inhibition. Windows
  floating-window construction runs outside the UI thread.
- Security fixes: documented upstream GLib iterator backport with an optimized
  regression, patched dependencies, bounded Firestore validation and main/mini
  IPC isolation. Cargo retains a documented unmaintained dependency notice.
- Polish/English sync states and retry errors, improved empty statistics,
  accessibility fixes, backup/update instructions and a realistic gated roadmap.
  P2P and macOS remain experimental.

## Downloads and testing

[Download alpha.2](https://github.com/w3ziqv/focus-flow/releases/tag/v3.0.0-alpha.2).
Windows x64 uses the NSIS `.exe`; Linux x64 uses Ubuntu `.deb` or `.AppImage`.
The Apple Silicon `.dmg` is experimental. Installers are **unsigned**. Compare
the exact download against the published `SHA256SUMS.txt` before installation;
hashes establish file integrity, not publisher identity.

Export a full JSON backup, Quit the running app, copy its complete data directory
and keep the previous installer before updating. See
[installation/backup/rollback](INSTALL-UPDATE.md) and
[Windows manual testing](TESTING-WINDOWS.md).

On the preceding source-equivalent Linux cloud candidate, the owner accepted
timer/audio/settings, real Google login/sync, account restoration and Firebase
refresh after restart, floating timer and restoring the main window from tray.
The version-bumped alpha.2 installers must pass their own CI and installed-runtime
checks before publication; exact run links are recorded in the GitHub release.
Physical alpha.2 Windows results remain pending.

Stable `v3.0.0` still requires physical Windows Google/runtime acceptance,
Linux/Windows update/rollback, notifications, login-cycle autostart, sleep/resume,
revocation/unavailable-store/logout, full live two-device scenarios and older-data
migration, real accessibility and production configuration review. See
[verification](VERIFICATION-3.0.md), [roadmap](ROADMAP.md) and
[PR #4](https://github.com/w3ziqv/focus-flow/pull/4).
