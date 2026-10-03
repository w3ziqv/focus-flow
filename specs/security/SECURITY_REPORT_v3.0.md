# Security audit — Focus Flow 3.0.0-alpha.1

Date: 2026-10-03. Repository: `w3ziqv/focus-flow`, branch `feature/v3-desktop`,
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

## Observed evidence

- TypeScript and ESLint passed; 753 unit tests passed. The one emulator-only test
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

## Remaining gates and risks

1. Live Google/Firebase configuration is unavailable here. Real desktop login,
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
