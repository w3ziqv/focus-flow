# Security audit — Focus Flow 3.0.0-alpha.1

Updated: 2026-10-10. Local audit baseline: 2026-10-03. Repository: `w3ziqv/focus-flow`, branch `feature/v3-desktop`,
base `a2f5f22`. Supersedes historical 2.x reports. Scope: source, local builds,
isolated browser/native tests and the official Firestore emulator. This is not a
production penetration certificate.

## Fixed boundaries

- Patched npm dependencies and removed unnecessary development tooling; audit
  includes dev dependencies. The Firebase Node gRPC override is explicit.
- Firestore defaults to deny, derives ownership from authenticated UID, restricts
  singleton identities and bounded list queries, and validates nested checklists,
  goals, milestones, preferences and numeric counters on both create and update.
- History migrated from an arbitrary map to schema-3 daily documents with bounded
  integer minutes and calendar-valid IDs. Repeatable migration preserves a local
  source copy per account. New rules reject writes of legacy summary history.
- Deletion markers permanently prevent session recreation. Privacy policy is
  server checked and masking replaces full session documents, including old
  checklist content outside the 1000-entry display window. Six-session batches
  respect the separate Firestore rule-access budget, without relying on caching.
- Durable upload queue preserves failed/in-flight edits. Account replacement
  requires consent even with no visible sessions, backs up the former profile
  including its queue, and clears account-owned state. Epoch guards reject stale
  replies after logout/account changes. The active timer stays device-local.
- Native OAuth: external browser, random single-use loopback listener, state and
  S256 PKCE. Firebase identity/refresh tokens remain in Rust; OS credential store
  or visible memory-only fallback. No plaintext token file or remote CSP allowance.
  Typed main-only commands validate account/path/collection, payload and batch
  bounds; HTTPS requests target fixed Google/Firebase hosts without redirects.
- Explicit Tauri command permissions and runtime guards isolate the mini window.
  Atomic snapshots are private before writing (Unix 0600), retain backups and
  preserve corrupted source. File access is limited to application sound files.
- Peer input rejects prototype identifiers, malformed archives and unbounded
  durations. Webhooks omit credentials/referrers, reject redirects and URL userinfo.
  Imports enforce UTF-8 byte limits and audio metadata bounds.
- Vercel/HTML/native CSP and security headers are checked into source. Actions are
  pinned, contents permissions read-only, checkout credentials not persisted;
  Dependabot and security workflows are included.
- GLib 0.18.5 is locally pinned with the exact upstream mutable-out-pointer fix
  for RUSTSEC-2024-0429; an optimized 10,000-iteration regression covers iterator
  operations. No advisory ignore or unsupported version substitution is used.
  See [vendor evidence](../../src-tauri/vendor/README.md).

## Follow-up dependency and CI boundaries

- Sync diagnostics preserve allowlisted structured Firebase error codes, including
  initial reconciliation, background polling and cached-error restoration. Raw
  SDK messages are excluded from persisted errors and visible error details.
- Both canonical and legacy break-duration aliases are independently validated.
  Previously a valid canonical value could hide a malformed legacy value (or
  vice versa) in the owner's own settings. Identity isolation remained enforced;
  replacement and partial-update regressions now reject both combinations.
  These rules have now been deployed and read back in the isolated test project;
  production retains its older rules pending migration acceptance.

- Live inspection on 2026-10-10 found that production v2.6 rules omit
  `daily_history`, explaining the owner's v3 `permission-denied` report for
  that path. The live rules source was backed up. With the owner's approval,
  `focus-flow-v3-test-20261010` was provisioned separately (Standard, default
  database, europe-west1, free tier). Syntax validation and source read-back
  passed. Six Vercel Preview overrides target only `test/v3.0-cloud`; production
  configuration/rules/data were preserved. Google login is enabled and only the
  exact stable Preview host plus local/default Firebase hosts are authorized.
  Auth preflight passed. Actual user login and two-profile sync remain open.
- Moodist-derived rain/wave loops are pinned, hashed, bundled locally and
  precached. No third-party audio host, new CSP destination or native command
  permission was added. Downloads have an eight-second timeout and a 2 MiB
  bound; failures retain a generated fallback. Selection/disposal guards prevent
  late recordings from restarting the wrong sound. Third-party audio licenses
  and the upstream's missing per-recording attribution are explicitly retained.

- Updated source-map-js 1.2.1 to patched 1.2.2 after the 2026-10-09 audit
  stopped on [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q).
  The lockfile change is scoped to that package; npm audit again reports zero
  vulnerabilities. Audit failure thresholds remain enforced.
- Installed CI tests consume checksummed .deb/NSIS artifacts with read-only
  Actions access. Runtime-only rechecks reject artifacts from differing source
  or lockfiles. Windows debug policies are scoped to focus-flow.exe on a
  disposable elevated runner and restored; no production debug switch is added.
- Mini-window construction runs off the UI thread and serializes concurrent
  requests. The async command retains main-window-only authorization; mini
  windows still cannot invoke privileged cloud/storage/quit/reset commands.

## Observed evidence

- TypeScript and ESLint passed; 755 unit tests passed. The one emulator-only test
  skips without an emulator and passed separately against real Firestore rules.
- 50 real authorization checks passed, including create/update, cross-account,
  anonymous, invalid daily dates/values, server masking and permanent deletion.
- The real adapter integration exchanged 1105 sessions between isolated profiles,
  migrated legacy totals, resolved edits, recovered a failed transport, preserved
  old sums and masked all pages. OAuth itself is not mocked into a claimed pass.
- npm audit: zero advisories. Cargo audit: 578 dependencies, zero vulnerability
  entries and one unmaintained notice: `proc-macro-error` (RUSTSEC-2024-0370).
- Rust tests, Clippy and optimized GLib regression passed. The vendored GLib emits
  compiler lifetime-style warnings on current Rust; no security notice is silenced.
- Browser timer/navigation/P2P/offline and automated accessibility checks passed.
  Native Linux smoke evidence and environment limits are recorded in
  [VERIFICATION-3.0.md](../../docs/VERIFICATION-3.0.md).

The 2026-10-09 full remote verification passed for
`bb110d5f981bee375dfd760085a9c6105780197a`: [CI](https://github.com/w3ziqv/focus-flow/actions/runs/37963102559),
[Security](https://github.com/w3ziqv/focus-flow/actions/runs/37963102580) and
[Desktop](https://github.com/w3ziqv/focus-flow/actions/runs/37963102681).
This includes real fresh-installed Windows/Ubuntu IPC isolation and the repaired
mini command/event paths. Four installer SHA-256 manifests were checked after
download. It does not close the live-cloud or physical OS acceptance gates.

## Remaining gates and risks

1. Isolated web Firebase is configured; live two-profile acceptance remains open.
   The Desktop OAuth client is still unavailable. Real desktop login,
   refresh/revocation/keyring behavior and two physical devices remain release
   gates. Deploy new rules only after staged migration/export comparison.
2. Older aggregate history lacks IDs for some sessions; unknown overlaps and
   time-zone changes cannot be perfectly reconstructed. Source backups are kept;
   real old profiles must be compared before stable publication.
3. Production Firebase IAM/App Check/API restrictions/authorized domains and
   Vercel headers were not deployed or certified. The earlier public site check
   returned Vercel 200/HSTS without the new headers; source changes alone do not
   change live services. GitHub protection/secret scanning policy is unverified.
4. Windows interactive acceptance and normal Linux installation/update/rollback,
   shell tray, actual audio/notification delivery, login-cycle autostart and
   hardware suspend/resume remain separate gates. macOS/P2P are experimental.
5. Automated axe/keyboard/zoom checks do not certify WCAG or a screen reader.
6. Native data/backups are unencrypted. Windows relies on the user app-data ACL;
   same-user compromise and deliberate webhook/paired-peer disclosure are outside
   this audit. SHA-256 detects corruption but does not authenticate an unsigned
   publisher. Installers are explicitly unsigned.

Rule-auditor assessment: [FIRESTORE_AUDIT_v3.0.json](FIRESTORE_AUDIT_v3.0.json).
Disclosure and repeatable commands: [SECURITY.md](../../SECURITY.md).

References: [Firebase rule testing](https://firebase.google.com/docs/rules/unit-tests),
[Google native OAuth](https://developers.google.com/identity/protocols/oauth2/native-app),
[GLib upstream fix](https://github.com/gtk-rs/gtk-rs-core/pull/1343),
[RustSec GLib advisory](https://rustsec.org/advisories/RUSTSEC-2024-0429.html),
[proc-macro notice](https://rustsec.org/advisories/RUSTSEC-2024-0370.html).
