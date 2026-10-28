# Focus Flow 3.0.0

Release source, production build metadata and installer SHA-256 values are
recorded with the GitHub release. Preserve a full backup before updating.

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

## Validation

The application passed 872 unit tests in 68 files, type/lint/token/boundary
checks, Firestore emulator/adapter tests, Rust audit, native packaging for three
systems, installed Linux/Windows runtime, browser and automated accessibility
checks. Localization checks covered 108 guide views in four languages, exports,
timer/history persistence, responsive layouts and localized PWA offline use.

The release process separately verifies the production web build, six headers,
Firebase project, literal source metadata and hashes for all four installers.
Windows CI also tests an in-place upgrade and recovery from a pre-update backup.
Exact final results are recorded in [verification](VERIFICATION-3.0.md).
The runtime npm audit is zero; the development audit has four low entries from
one unpatched deepmerge advisory. The existing high threshold remains unchanged.

## Verification limits

Physical two-device/network-cut scenarios, real two-account isolation,
production desktop Google login/restart/revocation/credential-store behavior,
and current physical OS/upgrade/rollback checks were not completed for this
release. Publication with those checks unexecuted was explicitly accepted by
the owner on 2026-10-28. Automated checks do not replace those results.
Earlier physical acceptance applies to preceding installers.

Use [installation and rollback](INSTALL-UPDATE.md) when updating. A web rollback
alone does not reverse a migrated cloud schema. Keep a pre-update export and
native data-directory backup, preserve newer data separately and keep older
clients offline while following a reviewed rollback. The remaining manual
procedure is in [the acceptance guide](TESTING-UI-RELEASE-2026-10-28.md).
