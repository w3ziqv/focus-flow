# Focus Flow 3.1 — security and stress review

Reviewed on 2026-11-04 against the 3.1 candidate. This is a source review and
bounded local test exercise, not an assurance that every vulnerability has been
found. Production was not load-tested and no real account data was accessed.

## Corrections included

| Finding | Impact before correction | Correction and regression coverage |
| --- | --- | --- |
| Import reports success after storage failure | A full/unavailable store could leave new settings with old history and a partially changed cloud outbox | Core fields and outbox now use a synchronous rollback boundary; storage errors are announced in all four languages; concurrent imports are blocked. Fifteen failure/observer tests plus a real browser quota failure cover the correction. |
| CSV formula injection | Titles starting with `+`, `-`, or whitespace/control characters before a formula marker were not neutralized for spreadsheet import | Prefix string formulas with an apostrophe, including whitespace/BOM/control prefixes. Ten CSV cases cover dangerous and ordinary values; numeric cells remain numbers. |
| Peer protocol framing and lifecycle | Valid quoted/backslash-heavy content exceeded the wire limit; an already queued callback could apply data after disconnect | Account for JSON escaping while retaining decoded chunk and 2 MiB transfer limits; detach and guard callbacks. Three deterministic channel tests cover valid escaping, stale delivery and oversized input. |
| Mask preference evaluated before a batch | A batch could enable cloud title masking and upload a title/checklist under the previous preference | Evaluate the preference with `getAfter()`. Test initial and updated preferences, title/checklist rejection, stripped/nullable content and intentional disabling. |
| Deletion evaluated before a batch | A batch could create both a deletion marker and the same session | Require absence of the marker before and after the batch. Test deletion dominance, ordinary atomic deletion and attempted marker deletion plus resurrection. |

The last two issues affect an owner's own data and privacy preferences; the
tests did not demonstrate access to another account. Existing owner-only access,
schema validation and query limits remain enforced. Backup formats and cloud
document schemas are unchanged. No new telemetry or external service was added.

Import rollback is best effort: it defers the current page's application events
and restores touched keys when synchronous writes fail. It is not a cross-tab or
crash-safe database transaction. A store that also blocks restoration can retain
partial changes; the UI therefore asks the user to export current data and check
space. Audio blobs are prepared separately and are not rolled back with core
metadata. Browser local storage is not encrypted.

## Executed verification

| Area | Result and workload |
| --- | --- |
| Unit suite | 72 files, 906 tests passed, including 34 added tests. TypeScript and ESLint passed. |
| Import/parser stress | 1,000 malformed envelopes, object-valued counters, 20 backup roundtrips of 1,000 Unicode/formula-titled sessions. |
| Merge/native queue stress | 40,000 merge comparisons; 5,000 queued persistence changes with simulated disk failure and retry. |
| Browser stress on production build | 1,000 stored sessions; 40 audio start/pause cycles, 30 timer/statistics/guides cycles, 30 sound changes; active deadline retained, history DOM bounded to 50 rows, inert HTML-like text, CSV/JSON download, secret exclusion, quota rollback and 320 px overflow check. One AudioContext, zero remaining audio sources and object URLs at completion; no page errors. |
| Firestore authorization | 66 checks against the actual rules in a loopback emulator, including anonymous/foreign-user get/list/write/delete denial, schema/update limits, date validation and batch privacy/deletion regressions. |
| Real sync adapter | Two isolated local profiles, 1,105 sessions; migration, offline recovery, totals, deletion and title masking across all pages passed using the Firestore SDK and emulator. |
| Migration rehearsal | Passed on a synthetic two-user legacy fixture. This is not a rehearsal with a private production snapshot. |
| Native Rust core | 12 tests passed in an isolated crate loading the actual storage, browser-environment/launcher, OAuth-token-parameter and guide-source modules. Includes eight threads performing 80 atomic save/read cycles, valid backup/private Unix permissions and rejection of an 18 MiB snapshot without replacing valid data. |
| Frontend builds | Web and desktop frontend builds passed, with PWA/native bundle isolation verified. |
| Responsive regression | 16 language/viewport cases, five themes, injected PWA safe insets, sticky guide return and retained task/checklist/deadline passed again after the import changes. Earlier desktop header checks cover 36 language/width cases from 320 to 1920 px. |
| Accessibility/interactions | Polish axe WCAG A/AA checks, modal focus/keyboard behavior, 200% CSS zoom, five themes and narrow screens passed. A screenshot timeout occurred on the first run; the unchanged rerun passed. Nested dialogs, resize, audio/language/sync/offline/reconnect checks passed. |
| Production-build offline behavior | PWA reload/navigation/settings, full rain/wave decoding and attribution offline passed; retired asset recovery retained task/history without page errors. |

The isolated native crate pins the same three direct library versions as the
application. It does not compile or exercise the complete Tauri application.
The two new storage stress tests also live in `src-tauri/src/storage.rs` so the
existing native CI test command can execute them in a provisioned environment.

Repeatable entry points: `npm run test:security`, `npm run test:stress` after
`npm run build`, `npm run test:run`, and the emulator/native commands in
[SECURITY.md](../SECURITY.md). The browser stress suite is added to CI; the
existing security workflow runs the expanded authorization tests. The browser
suite uses Chromium and synthetic data; it does not benchmark production capacity.

## Dependencies and deployed headers

- Runtime npm audit: **0** findings. Full audit: **0 critical/high, 13 moderate,
  2 low** entries, all in developer/build tooling. These are dependency-tree
  entries, not 15 independent exploits. `minimatch`, `glob` and `deepmerge` are
  the underlying advisories. The resolver's proposed ESLint/typescript-eslint
  major downgrades and unverified major transitive overrides were not applied.
  Keep builds isolated from untrusted configuration and track upstream fixes.
- `cargo-audit` 0.22.2: **0 vulnerability advisories** across 578 dependencies,
  using RustSec database commit `965bf9ad083b58e6340d65829d85217b18be9290`
  (2026-11-03). Four unmaintained notices remain: `proc-macro-error`,
  `zbus_names`, `zvariant`, `zvariant_derive`. These require upstream migration
  work; no advisory ignore was added.
- The vendored GLib mutable-out-pointer fix was compared against upstream
  0.18.5 source. The expected minimal patch is present. Its optimized native
  regression could not run here without GLib development packages.
- A read-only request to `https://focusflow.ink` observed CSP with
  `frame-ancestors 'none'`, HSTS, `nosniff`, `DENY`, `no-referrer` and disabled
  camera/microphone/geolocation. This observes the existing deployment's
  headers, not deployment of this candidate or its Firestore rules.

Raw npm/Rust audit output, browser counters and a machine-readable assessment
are in [validation/3.1/security](validation/3.1/security). Detailed local logs and
synthetic fixtures are included in the delivery archive's security evidence.
Expected permission-denied logs in negative authorization tests are successful
rejections, not application failures. Earlier failed reproductions are retained
separately from final passing results.

## Review boundaries and release status

Static review covered import/render/export paths, storage/outbox/sync, Firestore
authorization, CSP/Tauri capabilities, mini-window IPC restrictions, native
OAuth PKCE/state/loopback handling, project-scoped keyring storage, sound file
names/limits, fixed guide destinations and HTTPS/no-redirect requests.

The following remain unverified in this environment:

- Physical iPhone 16 installed PWA/Safari and another mobile device, including
  real safe-area values, keyboard, rotation and operating-system behavior.
- Complete native installers, GUI/WebView runtime, optimized GLib regression,
  real OAuth login/revocation/restart, keyring failure behavior and OS integration.
  GTK/WebKit/GLib development packages and a desktop GUI were unavailable.
- Actual two-device WebRTC transport. Two-context Chromium attempts timed out
  with ICE still `new`; a blank-page transport probe behaved the same way.
  Protocol unit tests passed, but no real network pairing pass is claimed.
- Production Auth domain/API restrictions, App Check enforcement, deployed
  Firestore rule identity, real two-account login and private snapshot recovery.
  Local emulator results cannot establish these settings.
- Physical screen-reader/volunteer acceptance already required by the 3.1
  roadmap. Automated axe results do not replace those checks.

Updated rules are a reviewed candidate, not a production deployment. To retain
the Firebase rule-authoring workflow's explicit qualification:

> I've set up prototype Security Rules to keep the data in Firestore safe. They
> are designed to be secure for owner-isolated data with strict schema limits
> and batch-aware masking/deletion checks. However, you should review and verify
> them before broadly sharing your app. If you'd like, I can help you harden
> these rules.

The configured GitHub integration and Git push returned HTTP 403 earlier in
this session. The delivery contains local commits and an apply-tested patch;
no remote PR, production release or rules deployment is claimed. Restoring repo
write access and completing the outstanding physical/native checks are needed
to finish the remote release process.
