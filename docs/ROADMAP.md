# Focus Flow — roadmap from 3.0

Status: `3.0.0-alpha.1` is available for testing. Stable 3.0 remains blocked by
live cloud acceptance and manual desktop acceptance. Automated fresh-install
runtime checks passed on Windows and Ubuntu; remaining gates are listed below.
Previous specification: [archive](archive/ROADMAP-before-3.0.md).
Evidence and limitations: [verification](VERIFICATION-3.0.md).

Direction: a calm offline-capable timer, optional accounts and reliable cloud.
History, settings, goals and, by default, task/checklist content synchronize.
Active timers remain independent. Audio files remain local.
P2P and macOS are experimental. Do not add AI, a task manager or integrations
without a confirmed user problem. Schedule work after dependencies are resolved.

## 3.0 — reliable work across devices

**Problem:** older history can disappear from statistics, large uploads can fail,
private checklists can remain in cloud and desktop login can fail.
**Change:** batches of at most 400 writes, a durable offline queue, permanent
deletions, daily documents instead of arbitrary maps, migration backups and
account-switch consent. System-browser PKCE with random loopback and Rust tokens.
**Success:** all gates below pass on the exact release commit.
**Dependencies:** Desktop OAuth client, Firebase Auth/Firestore, credential store,
Linux/Windows access and installer CI.

- [ ] Two independent devices: first connection, >500 sessions, offline operation,
  partial-failure retry, conflict, permanent deletion, masking >1,000 records,
  account switch and older totals. Emulator tests supplement live cloud acceptance.
- [ ] Desktop: real login, refresh after restart and consent revocation; an
  unavailable credential store produces an explicitly reported memory-only session.
- [ ] Linux and Windows: installation, update with backup, rollback, tray, mini,
  audio, notifications, autostart and suspend/resume.
- [x] Unit tests, emulator, npm/Rust audits, optimized GLib regression, builds and
  browser tests pass in real CI for the alpha source. Repeat for any release change.
- [x] Alpha installers have SHA-256 manifests, unsigned status is explicit and
  downloaded files were verified. Fresh Ubuntu/Windows installed-runtime checks passed.
- [ ] UX: understandable errors and retry, offline/pending/syncing/last-success
  states, consistent PL/EN, keyboard, 200% zoom, contrast and screen-reader acceptance.

Stable publication order: branch → PR with evidence → CI → all acceptance gates
→ merge → `v3.0.0`, release notes and verified installers. An unavailable gate
keeps the PR open; passing automated tests alone does not authorize a stable tag.

## 3.0.x — fixes after release

**Problem:** real environments may expose regressions CI did not reproduce.
**Change:** small fixes, clear messages and data recovery without changing the
core flow. **Success:** every regression is reproduced and covered by a test;
update and rollback are verified. **Dependencies:** reports including version/OS,
sample data with user consent and no task content in telemetry.

## 3.1 — deliberate active-session handoff

**Problem:** changing devices during work requires manually restoring the session.
**Change:** optional, explicitly approved handoff with confirmation on the receiving
device. **Success:** one unambiguous owner and no double counting, including offline
and resume paths. **Dependencies:** stable 3.0, an ownership protocol and two-device
tests. Do not automatically start the timer on every device.

## 3.2 — history, summaries and recovering mistakes

**Problem:** empty statistics overwhelm users with badges; finding past work or
recovering an accidental deletion is difficult. **Change:** put summaries and the
first-session action before badges, improve history, add undo and predictable export.
**Success:** at least four of five testers independently find a workday, compare
periods and recover a mistake. **Dependencies:** a testable undo mechanism assigning
new session IDs so permanently deleted IDs are never resurrected.

## 3.3 — easier P2P and broader platform support

**Problem:** technical pairing is difficult, and some system WebViews lack WebRTC.
**Change:** native transport and simpler pairing; extend support only after platform
acceptance. **Success:** transport, network loss, re-pairing and conflicts are verified
on every declared platform. **Dependencies:** pairing security review, stable 3.0
and access to those operating systems.

## UX findings and verification

The audit (`/tmp/focus-flow-ux-audit`) found onboarding and the timer understandable.
Priorities are explaining cloud scope, recoverable errors and Polish messages.
Empty statistics begin with an action, and integrations belong in advanced settings.
Preserve the calm appearance and optional account. Screenshots demonstrate appearance;
accessibility requires separate keyboard, screen-reader, zoom and contrast checks.
