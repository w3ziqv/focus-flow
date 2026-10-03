# Focus Flow 3.0 desktop

Development version: **3.0.0-alpha.1**, based on v2.6. The complete repository is
in this project, on `feature/v3-desktop`. Release acceptance is still in progress; this is
not a signed, stable release. See [ROADMAP.md](ROADMAP.md) and ADR-006 in
[ARCHITECTURE.md](ARCHITECTURE.md).

## Implemented

- Tauri 2 shell, desktop icons, single-instance activation, close-to-tray and
  explicit Quit after pending storage writes finish.
- Native data initialization before React and the audio singleton load. Existing
  `ff_*`, `ff2_*` and `ff3_*` values from the desktop WebView are migrated once.
  Browser/PWA storage belongs to another origin and must be moved with the
  existing backup export/import flow; it cannot be silently read by desktop.
- Serialized atomic `data.json` replacement in Tauri's application data directory
  for `ink.focusflow.desktop`. The previous valid snapshot is `data.json.bak`.
  A damaged source blocks overwriting; the startup recovery panel can restore the
  backup and preserves the damaged source as `data.json.corrupt`. File limits:
  16 MiB overall, 8 MiB per value. Unix snapshots use mode 0600.
- Native audio files in `sounds/`, addressed by a SHA-256 hash of the sound ID.
  Legacy IndexedDB blobs migrate on first access. Deletion also removes the
  migration source, preventing resurrection. Export uses the native save dialog.
- Tray countdown icon rasterized from SVG, minute updates, second-resolution
  tooltip, start/pause, skip, reset, main window, mini timer, preferences, Quit.
  Menu labels follow Polish/English. Skip never credits an unfinished session.
- One timer authority in the main window. The 220×80 floating window receives
  snapshots and sends actions; it has no storage access or independent timer.
  It is frameless, always on top, draggable, and fades when unfocused.
- Global Ctrl+Alt+Space/R/F on Windows/Linux; Cmd+Option on macOS. Registration
  failures are surfaced rather than aborting startup. Optional autostart,
  native notifications and an idle/display wake inhibitor while the timer runs.
- Separate web `dist/` and desktop `dist-desktop/`. Desktop embeds its assets and
  has no Service Worker, PWA manifest or registration. Web keeps its offline PWA.
- Opt-in mDNS presence discovery; manual offer/answer exchange authenticates the
  WebRTC fingerprint through codes received from the user's own device. WebRTC
  data channels encrypt transfers, use no STUN/TURN servers and reject relay or
  public-address candidates. Pairing is session-scoped: closing desktop settings
  stops discovery and disconnects; saved causal data survives.
- Cloud uses the shared adapter with a Rust Firebase REST transport, system-browser
  OAuth/PKCE and OS credential storage. The WebView receives public user details,
  never tokens. See [CLOUD-SETUP.md](CLOUD-SETUP.md). Active timers remain local.
- P2P sync covers completed sessions and timer settings. Active timers, accounts,
  credentials and audio stay local. Vector clocks and deterministic logical
  revisions converge concurrent edits; intentional null tasks remain null;
  deletions win permanently, including after long periods offline. Incoming
  archives are validated and chunked, bounded at 2 MiB/10,000 records/64 replicas.

## Build and run

Use Node.js **22.20+** (or a supported newer LTS), npm and Rust **1.90+**.
Install the [Tauri platform prerequisites](https://v2.tauri.app/start/prerequisites/)
first: WebKitGTK 4.1/GTK and D-Bus development libraries on Linux, MSVC and WebView2 on Windows, Xcode tools on
macOS. Dependency locks for npm and Cargo are included.

```bash
npm ci
npm run dev                    # web
npm run desktop:dev            # native window + Vite on port 1420
npm run desktop:build          # release executable and installers
npm run desktop:build -- --debug --no-bundle  # packaged debug smoke build

npm run typecheck
npm run lint
npm run test:run
npm run build
npm run build:desktop
npm run verify:builds
cargo fmt --manifest-path src-tauri/Cargo.toml --check
cargo clippy --locked --manifest-path src-tauri/Cargo.toml -- -D warnings
cargo test --locked --manifest-path src-tauri/Cargo.toml
```

For browser integration tests, install Chromium with
`npx playwright-core install --with-deps chromium`, then `npm run test:browser`.
`npm run test:web-offline` requires `npm run build` first. An existing Chromium
can be selected with `CHROMIUM_PATH`. The browser tests create isolated profiles
and close their own server/browser processes.

For native smoke tests, start `tauri-driver` with WebKitWebDriver (Linux) or the
matching Edge driver (Windows), using an **isolated test application-data profile**.
Optional `FOCUS_FLOW_TEST_AUTOSTART=1` exercises autostart registration and restores
its initial state. Set `FOCUS_FLOW_BINARY` to the absolute packaged executable and run
`python scripts/test-native.py`. `TAURI_DRIVER_URL` defaults to localhost:4444.
Optional `FOCUS_FLOW_SCREENSHOT` saves a screenshot. On X11,
`FOCUS_FLOW_TEST_HOTKEYS=1` additionally synthesizes Ctrl+Alt+Space via XTest.
The smoke changes test data; never run it against your daily profile.

## Verification and release gates

Detailed results and limitations: [VERIFICATION-3.0.md](VERIFICATION-3.0.md).
The `Desktop` GitHub Actions workflow builds Ubuntu/Windows installers, generates
SHA-256 lists and exercises the installed Windows application. macOS builds and
P2P remain experimental. Installation, backups and rollback are documented in
[INSTALL-UPDATE.md](INSTALL-UPDATE.md).

Linux WebRTC availability depends on the distribution's WebKitGTK build. The
WebView tested here does not expose `RTCPeerConnection`; settings explain this
and disable pairing. Chromium P2P transfer/convergence passed. This experimental
feature does not replace cloud sync or block the intended 3.0 cloud scope.

Stable release requires live desktop Google/Firebase login and token refresh,
two-device cloud acceptance, Windows/Linux installation and update/rollback,
actual tray/audio/notifications, autostart after login and hardware sleep/resume.
Xvfb, compilation and automated WebDriver checks cover only part of these gates.
Desktop CSP permits local IPC only; cloud network requests are made by Rust.
The version stays alpha until the release gates in the roadmap pass.
