# Focus Flow 3.1.3: toolchain and dependency update

Focus Flow 3.1.3 updates the web, PWA and desktop dependencies. The timer,
interface, motion and four supported languages retain their current behavior.
Storage, JSON backup, account and synchronization schemas are unchanged.

## Changes

- Application builds use Node 26.13.0, npm 12.2.2 and the native TypeScript 7.0.2
  compiler. ESLint and content checks use the supported TypeScript 6 AST API.
- React and React DOM move to 19.3.1, Vite to 8.3.6, Vitest to 5.1.0 and Firebase
  to 13.2.0. Build targets retain the previous browser syntax floor.
- Tauri's JavaScript API/CLI move to 2.12.4 and the native crate to 2.12.5,
  with matching plugin updates. Rust 1.99.1 is pinned for reproducible builds.
- Guide return controls include their visible destination in the accessible
  name. Visible copy and layout are unchanged.
- Validation now checks a real service-worker update from 3.1.2, native JSON
  export/import and retained data after a desktop restart.

Keyring 3.6.3 retains the existing credential-store backend. The patched GLib
0.18 dependency remains required by Tauri's GTK/WebKit stack. The Firebase CLI
runs separately on supported Node 24; application builds and tests use Node 26.
The [compatibility matrix](validation/toolchain-migration/REPORT.md) records
these constraints, audit findings and measurements. Initial JavaScript grows by
about 9.8 KB gzip; the local median web build decreases from 7.84 to 2.14 seconds.

## Install and update

The web app and installed PWA are available at [focusflow.ink](https://focusflow.ink).
Desktop installers, per-platform source metadata and a flat SHA-256 manifest are
published on the [3.1.3 release page](https://github.com/w3ziqv/focus-flow/releases/tag/v3.1.3).
Use files from the same release and follow the [installation and rollback guide](INSTALL-UPDATE.md).
An ordinary update does not require clearing application data or browser storage.

Production installers use the protected production workflow. Linux packages
target x86_64, Windows uses an x64 NSIS installer, and macOS ARM64 remains
experimental and is not notarized. Installers remain unsigned.

The release entry records the exact source commit, production workflow, installer
verification and web deployment. The [release validation notes](validation/3.1.3/VALIDATION.md)
link the automated checks and retain the physical-device and real-account limits.
