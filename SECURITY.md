# Security

Security fixes target the 3.0 release line. Older versions and prereleases may
use different cloud schemas or test projects; their reports do not establish
current production behavior.

## Reporting a vulnerability

Private vulnerability reporting is enabled. Use **Report a vulnerability** on
[GitHub Security Advisories](https://github.com/w3ziqv/focus-flow/security/advisories)
to contact the maintainer privately. Do not open a public issue with secrets,
personal history, tokens or an unpatched exploit.

Include the affected version/platform, reproduction steps using synthetic data,
expected and actual behavior, impact and any proposed mitigation. Keep the report
limited to what is needed to reproduce the problem. Do not test against another
person's account or production data. The maintainer will triage privately and
coordinate a fix and disclosure; reporter credit can be agreed before publication.

### Supported versions

| Version | Security maintenance |
| --- | --- |
| Latest 3.0.x | Supported |
| Earlier 3.0 prereleases and 2.x | Upgrade; fixes are not backported by default |

A published dependency advisory is reviewed against actual exposure. Security
fixes can ship as 3.0.x patches ahead of the feature roadmap. No test suite or
language choice guarantees that a release has no vulnerabilities.

## Data and security boundaries

See [data protection and trust boundaries](docs/SECURITY.md) for local storage,
cloud consent, Firestore authorization, native OAuth/IPC and current limitations.
Back up data before updating; [installation and rollback](docs/INSTALL-UPDATE.md)
explains the client and cloud compatibility boundary.

Firebase browser configuration is public client configuration. Server credentials,
service-account keys, user tokens and private snapshots must never be committed,
attached to public issues or included in CI artifacts.

## Repeatable checks

Requires Node.js 24, Rust and Java 21 for the loopback emulator.

```sh
npm ci
npm audit --audit-level=high
npm run typecheck
npm run lint
npm run test:run
npx --yes firebase-tools@15.32.1 emulators:exec --only firestore --project demo-focus-flow-security "npm run test:rules && npm run test:integration"
cargo test --locked --manifest-path src-tauri/Cargo.toml
cargo test --locked --release --manifest-path src-tauri/Cargo.toml patched_glib_string_iterator_optimized_regression
cargo audit --file src-tauri/Cargo.lock
```

Emulator tests require a loopback address and a demo project. They do not read or
write production accounts. Native installation/runtime checks are separate from
frontend builds. Production installers must match the released source commit,
cloud project and published SHA-256 manifest.

Dependency audits include development dependencies. The Firebase Node transport
uses an explicit patched `@grpc/grpc-js` override; remove it only after the
upstream pin is compatible. The development toolchain currently has four low
entries from the unpatched [deepmerge advisory](https://github.com/advisories/GHSA-gcqx-w48m-w2h4).
The runtime npm audit reports zero; that does not certify the whole system.

## Native dependency backport

GLib 0.18.5 carries the minimal upstream mutable-out-pointer fix for
RUSTSEC-2024-0429. The optimized regression exercises forward/backward/skipping
iterator operations. See [the pinned patch](src-tauri/vendor/README.md). Absence
of a path dependency from cargo-audit is not proof of remediation. Unmaintained
dependency notices remain visible; no blanket advisory ignore is used.
