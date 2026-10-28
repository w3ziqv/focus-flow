# Roadmap

Focus Flow stays centered on a quiet timer, useful history and optional sync.
Active timers belong to one device. Accounts are optional, and custom audio
remains local.

## 3.0

- Reliable history synchronization with bounded writes, offline retries,
  deletion markers and backups during migration or account changes.
- Desktop Google login through the system browser, with tokens held by Rust
  and refresh credentials stored in the operating system's credential store.
- Polish, English, Spanish and Simplified Chinese throughout the interface,
  exports and guides.
- Keyboard navigation, nested dialog focus, responsive statistics and history
  that can be searched beyond the first displayed page.
- Web/PWA and desktop installers, with checksums and backup/rollback guidance.

Current verification limits are described in [security](SECURITY.md). Automated
checks do not replace physical-device or real-account acceptance.

## 3.0.x — reliability and recovery

Prioritize reproducible data, synchronization and platform regressions. Extend
physical two-device, account-switch, credential-store and upgrade coverage.
Improve recovery messages without discarding pending changes or deletion records.

## 3.1 — moving an active session

Explore an optional handoff confirmed on the receiving device. Define one owner
of an active session and prevent double counting across offline and resume paths.
This depends on stable history sync and physical two-device tests.

## 3.2 — history and undo

Improve finding and comparing past work, exporting selected periods and recovering
an accidental deletion. Undo must create a new session identity so permanent
deletion markers cannot resurrect old records.

## 3.3 — pairing and platform coverage

Simplify trusted-device pairing and investigate native transport for WebViews
without WebRTC. Broaden platform support after testing network loss, re-pairing,
conflicts and operating-system integration on each declared platform.
