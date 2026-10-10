# Cloud testing on a separate 3.0 branch

Branch: `test/v3.0-cloud`, created from verified `adea12b`.
Stable Vercel Preview:
<https://focus-flow-git-test-v30-cloud-w3ziqvs-projects.vercel.app>.
Vercel project: `focus-flow`; team: `w3ziqvs-projects`.
The Preview retains Vercel access protection; sign in as a team member.
Branch pushes produce Preview deployments. Do not promote them to production.

## Environment boundaries

The owner selected an isolated Firebase project for this branch on 2026-10-10.
Six public `VITE_FIREBASE_*` Preview overrides scoped exactly to
`test/v3.0-cloud` now target **`focus-flow-v3-test-20261010`**. Production and
other previews retain `focus-flow-70527`. The test database is `(default)`,
Standard edition, Firestore Native, `europe-west1`, with the free tier enabled.
Google sign-in and the exact stable Preview hostname are configured there.
Changing variables requires a new Preview build before the new project is used.
Sign in again after that rebuild: Firebase accounts and cloud history are
independent between projects. Existing production data was not copied or changed.
Use synthetic data for deletion, masking and migration acceptance.
Never commit private keys, service accounts, tokens or login credentials.

To redeploy reviewed rules to this test backend, use an explicit target:

```bash
npx -y firebase-tools@latest deploy --only firestore:rules \
  --project focus-flow-v3-test-20261010 --config firebase.test.json
```

Do not substitute the production project or deploy unrelated services.
The Standard edition deliberately mirrors the existing app's tested SDK/rules
behavior; this is not a migration to Firestore Enterprise or MongoDB.

## Observed results — 2026-10-10

Preview `dpl_HZJ4wuB32aKszZVJoBHSPZwzNcm8` for `adea12b` reached READY;
the subsequent Git deployment `dpl_Hc1Nf8BD7Hx2V1ZfLaLfsBSa5Xpp` for `267a85d`
also reached READY. Browser checks confirmed onboarding, start/pause, task and
paused-timer persistence after reload, and the configured Google sign-in control.
The first Start click immediately after editing the task did not start a session;
the next click did. Reproduce this in an ordinary browser before attributing it
to the product or automation.

Initially, the Preview hostname was absent from Firebase Auth authorized domains.
The SDK warning and recoverable account-connection message confirmed that blocker.
After the owner added the exact host, the read-only preflight returned PASS.
The in-app browser retry remained at Connecting, with no observable Google popup.
Actual Google sign-in and live synchronization remain **unverified**, pending
user login in an ordinary browser and acceptance on a disposable test account.
No user Firestore data was read or modified during these checks.

After the diagnostic UI was deployed, the owner confirmed `permission-denied`.
Authenticated inspection of production found deployed v2.6 rules with no
`daily_history` match; v3 requests to that path were therefore denied. The live
source was backed up locally. Replacing those rules would also reject legacy
v2 `stats.history` writes, so production rules were preserved.
The isolated test project now has the reviewed v3 rules. Firebase syntax
validation passed; an authenticated read-back exactly matched the repository
source. Actual Google login and two-profile sync against this new backend still
need acceptance; configuration and emulator results are not a live sync pass.

The owner subsequently reported “Could not synchronize. Check your connection
and retry. Changes remain saved locally.” This confirms a failed attempt, not
its cause. The earlier UI mapped permission and service failures to that same
network message and discarded structured Firebase codes from stored state.
The test branch now preserves an allowlisted error code across retries/reloads
and separates access, service, quota, login and network messages. Unknown errors
have a general message; raw SDK messages, URLs and account data are not displayed.

## Diagnosing a failed attempt

Reopen the updated Preview and use Sync Now. Expand **Error details** and report
only **Error code**, together with whether the account is connected. Do not
clear browser storage, delete cloud history or paste tokens/full console logs.

- `permission-denied`: inspect the live rules, authenticated UID and App Check/API
  restrictions. The code alone does not distinguish these causes. Repository
  rules and passing emulator checks do not prove the live rules match.
- `failed-precondition` or `not-found`: check database/service setup or any missing
  index reported privately by the SDK. Do not expose generated console URLs.
- `unavailable`, `cloud-timeout` or `cloud-offline`: check connectivity and retry.
- `unauthenticated` or an `auth/` code: inspect the sign-in/refresh path.

Vercel web client variables do not grant Firebase administrative access. Reading
the deployed rules required the maintainer's Firebase CLI authentication.
Do not deploy new rules blindly to the shared production project to remove an error.

## Configuration preflight

In the intended Firebase project, use Authentication → Settings → Authorized
domains → Add domain to authorize only the stable Preview host, without protocol
or port. Do not add wildcards or every random deployment hostname. This step
does not require changing production Firestore rules.

Manage Preview variables in Vercel. Rebuild the Preview after configuration
changes: Vite embeds public configuration at build time.
Read-only check (Node 20+):

```bash
FOCUS_FLOW_TEST_URL=https://focus-flow-git-test-v30-cloud-w3ziqvs-projects.vercel.app \
  node --env-file=.env.preview.local scripts/check-cloud-preview.mjs
```

`.env.preview.local` is an ignored local file containing public Firebase client
configuration; do not commit it. Preflight prints no key values, signs in no user
and writes nothing to Firebase. PASS does not prove login or synchronization.

## Test-account acceptance

1. Open Preview in two independent browser profiles. Use synthetic data only,
   such as tasks prefixed with `TEST`. The active timer stays device-local.
2. Complete Google login yourself. Confirm the intended account and local-data
   merge decision. Check last successful synchronization and refresh after reopening.
3. Transfer test history exceeding 500 sessions and settings. Compare totals and
   IDs between profiles, including history beyond the 1,000-row visible limit.
4. Disconnect one profile, edit a task and reconnect. Check pending changes,
   retry, conflict, permanent deletion and absence of duplicates.
5. On disposable data, check removal of previously uploaded titles/checklists
   through masking and isolation after logout/account switch.
6. If rules reject a request, record its error code and stop acceptance. Test new
   rules in a separate Firebase project before considering production deployment.

Vercel's web configuration does not include a Desktop OAuth client. Published
alpha installers remain offline; desktop login requires a separate Client ID
of type Desktop app and a new build. See [CLOUD-SETUP.md](CLOUD-SETUP.md).
