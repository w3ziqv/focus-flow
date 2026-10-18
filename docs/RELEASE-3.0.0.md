# Focus Flow 3.0.0 — draft release notes

Publication is pending. This document and version metadata prepare the final
release; final CI, production installation/OAuth acceptance, rollout and exact
artifact checks must be recorded before publishing `v3.0.0`.

## Reliable history across devices

History, statistics, settings and goals synchronize through the same Google
account. Active timers and custom audio files remain device-local. Synchronization
uses bounded batches, a durable retry queue, daily-history records and retained
migration/account-switch backups. Deletion and title/checklist masking also cover
history outside the visible 1000-session list. Account/project changes require an
explicit local-data merge or replacement decision.

## Desktop

Linux and Windows include system-browser Google sign-in with PKCE/loopback,
OS credential storage, tray controls, a floating timer and offline recordings.
The production build connects to `focus-flow-70527`, the same backend as
focusflow.ink. Earlier alpha.2 installers use the separate test cloud; those cloud
histories are not automatically copied to production.

Installers remain unsigned. macOS and P2P remain experimental. Preserve a full
JSON export, the entire native data directory and the previous installer before
updating. Follow [installation and rollback](INSTALL-UPDATE.md).

## Validation evidence and remaining acceptance

The preceding source passed 817 application tests, desktop configuration/metadata
regressions, Firestore authorization/emulator checks, npm/Rust audits, browser,
automated accessibility and installed Linux/Windows runtime CI. A private older
production snapshot passed application migration/export/restore in the emulator.
Real test-cloud acceptance passed with two independent SDK clients and 1105
sessions, including conflicts, deletion, full-page masking and simulated transport
failure/retry. Synthetic test data/account and temporary IAM access were removed.

The owner accepted preceding Linux/Windows Google login/sync/restart and the
explicitly listed notifications, autostart, sleep/resume, tray/mini and screen-reader
checks. Revocation, account switch, unavailable credential-store fallback and Linux
backup rollback were subsequently reported as not yet tested. Production Windows
upgrade/backup rollback, physical Windows audio and production OAuth acceptance
remain pending. Exact final
source CI, production rollout and installer checksums must replace pending status
before this draft becomes the published release description.

See [verification](VERIFICATION-3.0.md) and [production rollout](PRODUCTION-ROLLOUT-3.0.md).
