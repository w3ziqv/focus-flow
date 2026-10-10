# Security

The actively developed version is 3.0.0-alpha.1. The 2.x reports in
`specs/security` describe historical revisions and do not certify current code
or deployed services. See [the current audit](specs/security/SECURITY_REPORT_v3.0.md).

Do not post secrets, personal session data, or working exploit details in a
public issue. If GitHub private vulnerability reporting is enabled, use the
repository's [Security page](https://github.com/w3ziqv/focus-flow/security).
Otherwise arrange a private channel with the maintainer before sharing details.

## Verification

```sh
npm ci
npm audit --audit-level=high
npm run typecheck
npm run lint
npm run test:run
npx --yes firebase-tools@15.32.1 emulators:exec --only firestore --project demo-focus-flow-security "npm run test:rules && npx vitest run src/lib/sync/adapter.emulator.test.ts"
cargo test --locked --manifest-path src-tauri/Cargo.toml
cargo test --locked --release --manifest-path src-tauri/Cargo.toml patched_glib_string_iterator_optimized_regression
cargo audit --file src-tauri/Cargo.lock
```

The emulator needs Java 21. Tests require a loopback emulator and use only the
`demo-focus-flow-security` project. They never authenticate to or deploy to a
production Firebase project. npm audits include development dependencies; the
Firebase Node transport is patched with an explicit `@grpc/grpc-js` override.
Review and remove that override when Firebase ships a compatible patched pin.

## Boundaries

- Firestore denies access by default and isolates each account by authenticated
  UID. Settings are singletons; sessions require bounded list queries. Nested
  checklists, milestones, goals, and preferences have explicit schemas.
  Canonical and legacy break-duration aliases are each validated, including when
  both are supplied; a valid alias cannot hide an invalid second value.
- New cloud history uses versioned daily documents with calendar-valid IDs and
  bounded integer minutes. Legacy summary maps are read for migration, backed up
  locally per UID, and cannot be written under the new rules. Compare exports on
  staging before tightening production rules; unknown overlaps in old aggregate
  history cannot be reconstructed from session IDs that no longer exist.
- Permanent deletion markers prevent recreation of a deleted session ID. Cloud
  masking enforces empty tasks/checklists on new writes and rewrites older pages.
  Session batches contain at most six writes, respecting Firestore's additional
  rule-access budget; other batches are bounded at 400.
- Desktop OAuth uses the system browser, S256 PKCE, random loopback port and state.
  Firebase tokens and authenticated requests stay in Rust. Refresh tokens use the
  OS credential store; its absence means a visibly memory-only session. Only the
  main window can call typed, account-scoped cloud commands.
  Credential entries and serialized sessions are scoped to the Firebase project;
  legacy entries without project identity require reconnection. Test installers
  cannot restore or delete a production project's saved session.
  Cloud-enabled CI candidates require an explicit test-mode dispatch on the
  isolated test branch. Ordinary CI remains offline; frontend and Rust receive
  the same validated public project configuration.
- The desktop main window owns persistence, exit, and discovery. Mini receives
  only timer display and start/pause/show actions. Filesystem access is restricted
  to application sound files. Native builds have no remote network CSP allowance.
- Native snapshots and backups are unencrypted. Unix files use mode `0600`;
  Windows relies on the current user's application-data directory ACL. OS-level
  compromise or another process running as the same user is outside this boundary.
- Peer sync requires manually exchanged identity fingerprints and a private LAN
  candidate. Pair only devices you trust; peer authentication does not make the
  paired user's data truthful.
- Webhooks are user-specified HTTP(S) destinations. They omit credentials and
  referrers and reject redirects. Do not put secrets in webhook URLs.

Firebase browser configuration is public client configuration, not a service
account credential. Never commit server keys. Deployment still requires a review
of the live Firebase rules, authorized domains, API restrictions/App Check, Vercel
headers, and GitHub repository policy. Local files do not update those services.

Cloud error details expose only allowlisted error identifiers. Structured SDK
codes survive retries and reopening without retaining arbitrary SDK messages,
URLs or credentials. Access-denied errors are distinguished from network errors.

## Native dependency backport

GLib 0.18.5 is pinned locally with the minimal upstream mutable-out-pointer fix
for RUSTSEC-2024-0429. The optimized regression exercises front/back/skip/final
iterator operations; see [patch evidence](src-tauri/vendor/README.md). A path
package's absence from cargo-audit results is not proof of remediation. The
unmaintained `proc-macro-error` notice remains visible; no blanket advisory ignore
is used. Current results and open release gates are in
[VERIFICATION-3.0.md](docs/VERIFICATION-3.0.md).
