# Stable 3.0 production rollout

Status on 2026-10-18: preparation in progress; stable 3.0 is not published.
The production web deployment still uses source `a2f5f22` and Firebase
`focus-flow-70527`. The alpha.2 test cloud is `focus-flow-v3-test-20261010`.
Do not promote the test Preview into production.

## Verified preparation

- Both databases are Standard edition/Firestore Native in `europe-west1`.
- Auth authorizes the production custom domains. The test project's deployed
  rules match `src/lib/sync/firestore.rules`; production still has the older rules.
- Current production documents and the exact deployed rules/release were backed
  up locally under `test-artifacts/stable-readiness-oct18/focus-flow-70527/`.
  This private directory has mode 0700 and snapshots have mode 0600. It is ignored
  by Git; never attach it to a public PR, release or CI artifact.
- The private snapshot passed migration through the real application adapter
  against the loopback emulator with the v3 rules. History totals, session IDs,
  source backup, second fresh local profile and application export/restore were
  checked. This writes only to the emulator; production documents were not changed.
- Production desktop preflight rejects a test-project client, mismatched Firebase
  identifiers or an unprotected/unapproved branch. Only protected `main` and
  `codex/v3.0-release` are accepted. Installer metadata verification also
  rejects incorrect source SHAs, mode/project/client mismatches and extra fields.
- GitHub `Production` is restricted to protected branches. Its six public Firebase
  variables and production Desktop client ID/parameter are configured. The client
  was created with explicit owner approval; a deliberately invalid-code probe
  verified client configuration without user authorization. The temporary
  parameter file was removed. The existing main branch requires PR and
  CI/security/runtime checks.
- Desktop uses a dedicated public API key restricted to Identity Toolkit, Secure
  Token and Firestore. Five other Firebase identifiers match the current Web App
  SDK configuration. The web key was not changed. An invalid synthetic-token
  probe confirmed key acceptance without authenticating or creating a user.
- The first candidate audit found four newly published rustls advisories in
  0.23.45. The lockfile is updated to patched 0.23.46; fresh CI must verify it.
  Audit severity thresholds and advisory handling are unchanged.

- Two independent authenticated SDK clients passed the real test-cloud
  1105-session acceptance scenario, including legacy totals, conflicts, permanent
  deletion and masking all pages. Transport failure/retry was simulated.
  Synthetic documents/Auth identity were confirmed removed, the temporary
  test-only IAM permission was revoked and the local token fixture was deleted.
  Physical two-device acceptance remains a separate check.

## Repeat the private migration check

Use the project Firebase CLI and Java 21. Set `FOCUS_FLOW_MIGRATION_SNAPSHOT` to
the absolute private `firestore-snapshot.json` path, then run:

```bash
firebase emulators:exec --only firestore --project demo-focus-flow-security \
  "npm run test:migration"
```

The wrapper fails if the snapshot or loopback emulator is missing. The ordinary
unit suite skips this private acceptance test. Do not copy real snapshot contents
into a committed fixture. Keep any failure output private too.

## Release sequence

1. Complete the remaining physical acceptance checks listed in
   [VERIFICATION-3.0.md](VERIFICATION-3.0.md), and physical two-device cloud scenarios.
   Real test-cloud SDK and emulator acceptance are supplementary evidence.
2. Build and verify the production candidate on protected `codex/v3.0-release`
   using the configured production **Desktop app** client. Its ID/parameter are
   stored in GitHub `Production`; see [CLOUD-SETUP.md](CLOUD-SETUP.md).
3. Review production IAM/API/App Check configuration and the compatibility effect
   of the v3 rules: older clients cannot keep writing legacy history maps.
   Preserve the old rules and a fresh data snapshot before this change.
4. Prepare version `3.0.0` consistently in npm/Cargo metadata. Run required checks
   on that exact commit. Merge only after the outstanding acceptance is satisfied.
5. Stage the production web build with production variables. Verify it before
   assigning the custom domains; a test-cloud Preview is not the production build.
6. Deploy only the reviewed Firestore rules to the explicit production project.
   Read them back and compare with source. Keep the local source backup until
   real user migration totals have been checked. Do not delete legacy data first.
7. Dispatch Desktop on `main` with `cloud_mode=production`; await packaging and
   installed Linux/Windows runtime results. Check actual native cloud project and
   SHA-256 manifests, then verify production Google login and restoration.
8. Publish `v3.0.0` with exact-commit release notes, verified installers, public
   desktop build metadata and flat checksum manifest.

## Rollback boundary

The previous production web deployment is
`dpl_7kbjGztvYdG7HrryQyMG3boTXZMJ`. Preserve its configuration before promotion.
Restoring that web build alone does not roll back migrated cloud schemas.
Sign out/keep older clients offline while restoring the pre-update application
backup; preserve newer data separately. Restore old rules only together with a
reviewed data/client rollback. Never overwrite live user data with the snapshot
merely to test restoration. See [INSTALL-UPDATE.md](INSTALL-UPDATE.md).

## Still unverified

Production desktop Google login/restoration, physical two-device acceptance,
revocation and unavailable-store behavior, physical notification/autostart/sleep,
remaining Windows native controls, installer upgrade/rollback and real screen
readers remain distinct checks. The owner accepted Windows Google login/sync and
operation after app restart on the test candidate; Linux timer/audio/mini/tray and
Google login/restoration were accepted previously.
