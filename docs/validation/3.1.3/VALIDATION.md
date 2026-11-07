# Focus Flow 3.1.3 validation

Checked on 2026-11-07. Release 3.1.3 adds the version and release documentation
to the dependency migration in [PR #30](https://github.com/w3ziqv/focus-flow/pull/30).
The migration's [compatibility matrix and evidence](../toolchain-migration/REPORT.md)
record the selected versions, upstream exceptions and baseline comparisons.

## Release candidate checks

The release candidate uses Node 26.13.0, npm 12.2.2 and TypeScript 7.0.2.
The npm package/root lock entries and Cargo package/lock entry all use 3.1.3.
Tauri reads the application version from package.json. Only these version fields
change in the dependency locks; dependency resolutions remain as validated.

| Check | Result |
| --- | --- |
| Clean install and dependency tree | `npm ci` and `npm ls --all` passed; both lockfiles retained their pre-install SHA-256 digests. |
| Compiler and AST API | `npm run test:toolchain` passed all three tests; both typecheck scripts passed. |
| Lint, tokens and UI boundaries | `npm run lint`, `design:check` and `test:ui-boundaries` passed. |
| Application and cloud configuration | 910 tests in 72 files passed; desktop cloud-configuration tests passed. |
| Production frontend builds | Web and desktop builds passed; `npm run verify:builds` confirmed version agreement, localized assets and output isolation. |
| Production offline behavior | `npm run test:web-offline` passed, including lazy content, covers, recordings and retired-chunk recovery. |
| Reference PWA update | The same-origin 3.1.2 to 3.1.3 update passed with the same running session ID/deadline, task, checklist, history, settings, theme and Polish locale; lazy routes and media loaded offline. |
| Diff formatting | `git diff --check` passed. |

Local release logs are preserved in `test-artifacts/v3.1.3/release/` and the
toolchain migration evidence directory. PR checks cover the complete release
candidate; the [checks page](https://github.com/w3ziqv/focus-flow/pull/30/checks)
records the exact checked head.

PR acceptance also exercises the retained Windows installer and synthetic
upgrade/backup rollback with an offline candidate. The protected production
scenario runs separately before publication. The native fixture explicitly
selects English through the UI and asserts that the saved locale survives
restart, upgrade and rollback; this avoids the old exporter's unsaved-language
fallback to Polish.

## Production release checks

The GitHub release entry records the final source commit, main CI/Security runs,
protected production Desktop run, installer SHA-256 verification and public web
deployment. Release installers must come from that production run, with matching
source and cloud-target metadata. Offline PR artifacts are not release installers.
The protected workflow includes the disposable Windows upgrade/backup rollback
scenario in addition to installed Linux/Windows smoke tests.

A separate disposable public-browser profile starts on production 3.1.2 and
retains its running timer and representative synthetic data through the deployed
3.1.3 worker update. The release entry records its online/offline result. This
profile does not sign in to an account or modify cloud data.

## Limits

Physical iPhone/Safari rendering, real-account/two-device synchronization,
credential-store combinations and physical OS integration remain separate
acceptance. macOS ARM64 is experimental and not notarized; installers are
unsigned. Virtual Linux runners can report unavailable sleep prevention while
the timer remains usable. Automated checks do not replace manual screen-reader
or physical-device acceptance.

Storage, backup and synchronization schemas remain unchanged. Preserve a JSON
backup, the native data directory and the previous installer as described in the
[installation and rollback guide](../../INSTALL-UPDATE.md).
