# Focus Flow 3.0.0-rc.1 — production configuration candidate

Prepared on 2026-10-18. This candidate is not stable 3.0 and must not be confused
with the published alpha.2 test-cloud installers. Publication and exact artifact
checks are recorded separately after CI completes.

## Changes since alpha.2

- Explicit production desktop builds use `focus-flow-70527` and its dedicated
  Google Desktop client. The isolated test project remains a separate build mode.
- Production builds require protected `main` or `codex/v3.0-release`, consistent
  Firebase/project/client identifiers and the GitHub `Production` environment.
  Its variables/secret are configured; branch restrictions were verified.
- Installer verification checks the exact source SHA, cloud mode/project/client
  and expected metadata fields before installed-runtime smoke.
- A private current production snapshot passed application migration under the
  v3 Firestore rules in the emulator, preserving totals/session identities,
  retaining the legacy source, surviving a fresh profile and JSON export/restore.
  A repeatable migration command keeps user snapshots outside the repository.
- Local lint excludes downloaded test artifacts and external plugin/profile code.
- Updated rustls to 0.23.46 after the fresh candidate audit identified four
  advisories published on 2026-10-14. Audit checks remain enforced. Unmaintained
  proc-macro-error/zbus_names/zvariant/zvariant_derive notices remain documented.
- A dedicated production desktop API key is restricted to the three required
  Firebase services. The production web key is unchanged.
- The owner confirmed Google login, synchronization and operation after restart
  on physical Windows for the preceding test candidate.

## Validation so far

817 application tests, five desktop build/metadata regressions, 50 Firestore
authorization checks, 1105-session adapter integration and the private migration
check passed locally. TypeScript/ESLint and npm audit passed. Prior browser,
offline PWA/audio/recovery and automated accessibility checks passed; candidate
build and native CI results must be recorded for the new source/version.

The production OAuth client returned the expected `invalid_grant` for a deliberately
invalid diagnostic code, verifying client configuration without a real user login.
No user token or credential parameter is included in these notes or metadata.

## Before installing

Use the exact candidate metadata and SHA-256 manifest. Export a full JSON backup,
quit the app and copy the complete native data directory before changing versions.
The Firebase environment changes from the alpha's test project to production;
the app requests reconnection/consent while preserving local data and queued work.
Do not assume cloud histories are copied between projects. See
[installation/rollback](INSTALL-UPDATE.md).

## Remaining stable acceptance

Production installer Google login/restoration, live multi-client stress scenarios,
revocation/unavailable-store behavior, installer update/rollback, remaining physical
native checks and manual screen-reader acceptance remain unverified. Production
web and Firestore rules have not yet been migrated. P2P and macOS remain experimental;
installers are unsigned. See [rollout](PRODUCTION-ROLLOUT-3.0.md).
