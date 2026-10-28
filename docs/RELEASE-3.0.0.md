# Focus Flow 3.0.0 — draft release notes

Publication is pending. The protected candidate is `e146fe3`; main remains a
draft PR. Complete the physical/account acceptance, refresh the private
snapshot/restore check, then verify the literal final main commit and its
production artifacts before publishing `v3.0.0`.

## History and synchronization

History, statistics, settings and goals synchronize through the same Google
account. Active timers and custom audio files remain local to each device.
Bounded batches, a durable retry queue and daily history retain older totals;
deletion and title/checklist masking cover records beyond the visible 1000-session
cloud log. Account/project changes require a local-data merge or replacement
decision, with backups retained.

History renders in batches of 50. Search, totals and export cover the complete
stored history. Session completion and wake recovery share date and identity
rules; deletion records and pending writes survive restarts.

## Interface and four languages

Polish and English have been revised, with Spanish and Simplified Chinese added.
Language selection covers the timer, settings, sounds, statistics, synchronization,
onboarding, narration, recovery, exports, document/PWA metadata, desktop menus
and the Windows installer. Changing the language preserves a running timer and
saved history. User task names and other custom labels retain their original text.

All 27 guides have been rewritten in four languages. Each distinguishes the
available evidence, a practical example and its limits, and links to reviewed
primary or institutional sources. The existing seven categories and routes remain.

Five semantic themes and shared controls cover timer, settings and history.
Nested dialogs retain parent drafts and keyboard focus. Timer ticks no longer
re-render navigation, task fields, the sync indicator or open settings/audio
unnecessarily. Component and state contracts are documented in
[the architecture map](UI-ARCHITECTURE.md) and [component guide](UI-COMPONENTS.md).

## Desktop and updates

Linux and Windows include system-browser Google sign-in with PKCE/loopback,
OS credential storage, tray controls, a floating timer and offline recordings.
Production builds use `focus-flow-70527`, the same backend as focusflow.ink.
Earlier alpha.2 installers use a separate test cloud; those histories are not
automatically copied to production.

Installers remain unsigned. macOS and P2P remain experimental. Preserve a full
JSON export, the native data directory and the previous installer before updating.
Use [installation and rollback](INSTALL-UPDATE.md). An older client supporting
only Polish/English may reject a new JSON backup containing `es` or `zh`; restore
that backup with a version supporting those languages.

## Validation and remaining acceptance

The localization PR passed 872 unit tests in 68 files, type/lint/token/boundary
checks, Firestore emulator/adapter tests, Rust audit, native packaging for three
systems, installed Linux/Windows runtime, browser and accessibility checks.
The exact clean source also passed 108 guide views in four languages, exports,
timer/history persistence, responsive layouts and localized PWA offline checks.

Production candidate web staging passed header, project, persistence, localized
manifest/guide, offline and mobile smoke checks without custom-domain assignment.
Production installer results, hashes and literal source metadata are recorded in
[verification](VERIFICATION-3.0.md). These are preparation results, not publication.
The runtime npm audit is zero; the full development audit has four low entries
from one unpatched deepmerge advisory, with the existing high threshold unchanged.

Physical two-device/network-cut acceptance, real two-account isolation,
production desktop OAuth/revocation/credential-store behavior and current
physical OS/upgrade/rollback checks remain open. Earlier owner results cover
preceding installers and do not certify this production build. Only one Google
test account is available. See [the test procedure](TESTING-UI-RELEASE-2026-10-28.md)
and [production rollout](PRODUCTION-ROLLOUT-3.0.md) for the remaining gates.
