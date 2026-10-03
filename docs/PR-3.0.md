# Prepare Focus Flow 3.0 cloud sync, desktop security and release gates

Large cloud histories previously exceeded batch limits, masking could retain old
checklist content, and desktop Google login lacked a native transport. This change
adds a shared reconciler with a durable queue, daily-history migration/source
backups, full-page privacy erasure, permanent deletions and explicit account
replacement. Desktop uses system-browser PKCE and a Rust-only Firebase transport
with OS credential storage or a visible memory-only session.

Also adds Tauri main/mini/tray/storage integration, Linux/Windows installer and
checksum workflows, the minimal upstream GLib security backport with an optimized
regression, Polish/English user messages, modal keyboard/zoom/contrast fixes and
an archived/rebuilt roadmap. Active timers and audio files remain device-local;
P2P/macOS remain experimental.

## Validation

- TypeScript, ESLint, frontend builds/isolation; 753 unit tests.
- 50 official Firestore emulator authorization checks and real two-profile
  integration with 1105 sessions, legacy totals, offline retry, conflict,
  deletion and full-history masking. Partial batch retry covered separately.
- Seven Rust tests, Clippy and optimized GLib iterator regression.
- npm audit zero advisories; Cargo zero vulnerability entries with the retained
  proc-macro-error unmaintained notice documented.
- Real Chromium UI/P2P/offline PWA and automated axe/keyboard/200% CSS zoom checks.
- Linux Xvfb native timer/mini/IPC/files/hotkey/autostart smoke; unsigned .deb and
  SHA-256 built locally. See docs/VERIFICATION-3.0.md for environment limits.

## Draft / remaining stable gates

Keep this PR open and version 3.0.0-alpha.1. Do not merge/tag v3.0.0 yet.
Required: live Desktop Google OAuth/refresh/keyring/revocation and two-device
Firebase acceptance; staging migration comparison of real older exports;
Linux/Windows installation/update/rollback and actual tray/audio/notifications,
login-cycle autostart and hardware sleep/resume; screen-reader acceptance and
production rule/header review. GitHub CI must run on the published commit;
workflow preparation alone is not verification. Installers are unsigned.

Once write access is available, push feature/v3-desktop and create a draft PR
against main with this body. Run CI, resolve failures and record exact run links
before moving toward the stable release.
