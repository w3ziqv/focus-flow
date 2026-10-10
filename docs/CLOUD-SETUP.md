# Cloud configuration and acceptance for 3.0

Web/PWA uses the variables in `.env.example`, supplied through `.env.local` or
Vercel. Without configuration, accounts remain optional, cloud controls report
unavailability and data stays local. Firebase client configuration is public;
never include service accounts or private keys in the repository or application.

Desktop requires `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID` and a separate
`FOCUS_FLOW_GOOGLE_DESKTOP_CLIENT_ID` of type **Desktop app** from the same project.
Pass them to Cargo/Tauri at build time; Vite's `.env.local` alone does not configure
Rust. CI test builds read the seven `DESKTOP_TEST_*` public repository variables
only after an explicit `cloud_mode=test` Desktop workflow dispatch on
`test/v3.0-cloud`. Ordinary CI and main builds remain offline. The same environment
is passed to frontend and Rust compilation. A bundled `desktop-build.json` records
the public project/client identity and source commit; runtime smoke checks the
actual native cloud status against that target. No secret or token is recorded.
Enable the Google
provider in Firebase Auth, configure audiences/testers on the Google consent
screen and authorize the web application's domains in Firebase Auth.

OAuth uses the system browser, PKCE S256, random `state`, a single-use callback at
`127.0.0.1:<random-port>` and a deadline. Rust exchanges codes and tokens; the
WebView receives no tokens and retains a CSP restricted to local IPC.
Firebase refresh tokens use Secret Service/keyring on Linux or Credential Manager
on Windows. If storage is unavailable, the application explicitly reports a
memory-only session. Each Firebase project has its own credential entry, and
restored sessions must contain the matching project ID. Unscoped legacy sessions
require sign-in again; they are not automatically imported into another project.
Test both normal storage and the unavailable-store path.
Protocol reference: [Google OAuth for native applications](https://developers.google.com/identity/protocols/oauth2/native-app).

Test the new rules and client together in a test project before production
deployment. Arbitrary legacy history maps are no longer accepted for writes.
Migration reads the older document, preserves a local source copy, writes
validated daily documents in batches and only then marks the summary as schema 3.
Interrupted migration can be repeated. Do not manually remove legacy history or
its backup. Older clients may require offline operation after the rule change.

Sessions have permanent IDs. Rules reject recreating permanently deleted IDs.
Session batches contain at most six writes: separate tombstone checks and the
shared privacy policy must fit Firestore's 20 rule-access calls per batch without
assuming a shared read cache. Other batches contain at most 400 writes. The queue
retains unacknowledged sessions beyond the 1,000-row visible limit; server reads
use bounded pages. Masking also removes previously uploaded titles/checklists,
and rules enforce it on later writes. Disabling masking cannot restore content
that no device still retains locally. Deleted IDs stay deleted regardless of
offline duration. Switching accounts requires an explicit decision and preserves
a backup of the previous account's local data.

Acceptance requires two independent devices: Google login/logout/restart/refresh,
more than 500 sessions, offline operation and partial failure, title conflict,
deletion after extended offline use, masking more than 1,000 records, account
switching and older totals. The emulator exercises the adapter against real
Firestore emulation; it does not verify production Google OAuth, API restrictions,
authorized domains or the deployed project's configuration.

Legacy aggregates without session IDs cannot establish whether independent copies
of older totals describe the same work. Migration preserves sources and merges
overlapping totals conservatively. Compare results with real user exports,
especially imported data and time-zone changes.

For the live web Preview and its acceptance status, see [TESTING-CLOUD.md](TESTING-CLOUD.md).

The test Desktop app client `Focus Flow 3 Desktop Test` was created on 2026-10-10
in `focus-flow-v3-test-20261010` with the owner's action-time approval. The public
client ID is stored in `DESKTOP_TEST_GOOGLE_CLIENT_ID`; no client secret is used.
This configures a test candidate, not production or successful OAuth acceptance.
