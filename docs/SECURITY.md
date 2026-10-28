# Data protection and trust boundaries

Focus Flow is a personal application with optional cloud synchronization and
trusted-device pairing. Its main boundaries are untrusted files/peers, the
Firebase account and project, and the desktop WebView's access to Rust.

## Local data and backups

Web data is stored in localStorage and IndexedDB. Desktop snapshots and backups
are unencrypted: Unix files use mode 0600; Windows uses the current user's
application-data directory permissions. Another process running as the same
system user may read them. Local storage is not an independent backup.

Native writes retain the previous valid snapshot and preserve a damaged source
instead of silently replacing it with empty data. Pending changes, migration
backups, account-switch copies and permanent deletion records are retained.
Web storage does not provide a transaction spanning all keys or a formal
exactly-once guarantee. Keep an export before updates or changing accounts.

## Optional cloud

Google sync shares completed history, settings and goals. Task names and checklists
are included by default; masking removes their cloud content. Active timers and
custom audio files stay local. Changing account/project requires a decision about
merging or replacing local data, with a backup retained.

Firestore rules derive access from the authenticated UID, deny unknown paths and
validate types, sizes, singleton IDs and bounded list queries. Daily-history
records have calendar-valid IDs and bounded integer minutes. Session batches
contain at most six writes; other batches are bounded at 400. Permanent deletion
markers prevent recreation of a deleted session ID. Masking rewrites older pages
as well as controlling new writes.

Legacy summary maps are read and backed up for migration. The 3.0 rules reject
new legacy-map writes. An older client may therefore stop synchronizing after
the rules update. A web rollback alone does not reverse a migrated cloud schema;
restore client/data/rules together under a reviewed recovery procedure, while
preserving newer data separately. Never overwrite live data to test restoration.

## Desktop authentication and IPC

Desktop OAuth uses the system browser, S256 PKCE, a random loopback port and a
one-time state value. Firebase tokens and authenticated requests stay in Rust.
Refresh tokens use the OS credential store. If it is unavailable, the session
is explicitly memory-only and must reconnect after a restart.

Credentials and saved sessions are scoped to the Firebase project. A test build
cannot restore or delete production credentials. Logout reports a credential-store
deletion failure instead of pretending the operation succeeded.

The main window owns persistence, cloud access, exit and discovery. The mini
window receives timer display and limited timer controls. Typed IPC permissions
are checked again against the calling window. Filesystem access is limited to
application sound files. Guide links accept only an ID from a compiled HTTPS
source catalog, with access restricted to the main window.

The Google Desktop client's issued parameter is transported through a protected
CI secret and embedded only in Rust. Installed applications cannot keep that
constant confidential; PKCE, state, consent and private user tokens provide the
security boundary. Web/server secrets and service-account keys are not part of
the client.

## Imports, peers and external requests

JSON/audio imports enforce size limits and schemas and reject prototype keys.
Imported data is rendered as text rather than HTML. Very large allowed imports
can still put pressure on a low-memory device.

Peer sync requires manual identity-fingerprint exchange and private LAN candidates.
Pair only devices you trust. Frame limits, timeouts and validation reject malformed
input; authentication does not make a paired device's data truthful.

Optional webhooks disclose data to the configured receiver. Requests omit browser
credentials/referrers and reject redirects. Do not place secrets in URLs. The web
CSP permits only its configured connection destinations; arbitrary webhook hosts
are not enabled by the production policy.

## Service and build configuration

Firebase Web configuration is public. Provide the six `VITE_FIREBASE_*` values
from `.env.example` through the intended environment. Enable Google in Firebase
Auth and allow only controlled application domains. Keep production and test
projects separate; do not promote a test-cloud build into production.

Review API restrictions and App Check against actual client support before
changing enforcement. Deploy only the reviewed Firestore rules to an explicit
project. Preserve the previous rules and a fresh consistent data snapshot, then
verify migration/export/restore on the loopback emulator before rollout.

Vercel serves the CSP and other headers from `vercel.json`. Compare the deployed
headers and application cloud project with the release configuration. Protected
source integration requires CI, Firestore, Rust, browser and installed-runtime
checks. Actions are pinned and production configuration is limited to protected
release sources. Release installers have a flat checksum manifest and public
source/cloud metadata. Installers remain unsigned; hashes establish integrity,
not publisher identity.

## Verification limits

Automated unit, emulator, browser, accessibility and native runner checks cover
defined scenarios. They do not certify screen-reader operation, physical devices
or every OS credential-store/browser combination. macOS and P2P remain experimental.

For 3.0, current physical two-device/network-cut scenarios, real two-account
isolation, production desktop Google login/restart/revocation/credential-store
behavior, current physical OS integration and physical upgrade/rollback were not
completed. Publication with these checks unexecuted was explicitly accepted by
the owner. These results remain unverified; earlier physical acceptance applies
to preceding installers.
