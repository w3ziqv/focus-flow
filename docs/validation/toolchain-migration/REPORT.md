# Toolchain migration validation

Checked: 2026-11-07 (Europe/Warsaw). Application version: 3.1.2.

Baseline: `e29b5278a66c17933b6195aedc7f275b9c22ca45` (`main`, published tag `v3.1.2`). Candidate implementation: `1e5271f1cfd25b00c2cca8dea06a1c8af6eccc83`; later commits record validation evidence. The initial working tree contained only untracked `docs/prompts/`; those maintainer files are excluded from this PR.

## Status

Implementation and local checks are complete except for the final browser pass, visual comparison and performance repetitions, which are running. GitHub native builds and installed-app acceptance will be recorded after the draft PR runs. No installer has been published and the reference tag and release assets are unchanged.

## Runtime and compiler selection

| Component | Baseline | Latest stable | Selected | Constraint and primary source |
| --- | --- | --- | --- | --- |
| Node.js | 24; baseline measured on 24.22.2 | 26.13.0 LTS | 26.13.0 | Newest LTS; Vercel supports 26.x and package engines override its 24.x project setting. [Node](https://nodejs.org/en/about/previous-releases), [Vercel](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions). |
| npm | 11.19.1 in baseline runtime | 12.2.2 | 12.2.2 | Node engines supported; CI and preview install it explicitly. [Registry](https://registry.npmjs.org/npm/12.2.2). |
| Rust compiler | CI stable, 1.99.1 at validation time | 1.99.1 | 1.99.1 | Pinned in rust-toolchain.toml and CI; edition 2021 and MSRV 1.90 remain valid. Full resolved Cargo metadata declares no higher MSRV. [Release notes](https://doc.rust-lang.org/stable/releases.html). |
| JavaScript target | ES2022 type library; Vite 7 browser defaults | Vite 8 defaults raise browser versions | ES2022; Chrome/Edge 107, Firefox 104, Safari 16 | Explicit build.target and cssTarget preserve the previous syntax floor; Tailwind 4 retains its existing CSS/webview requirements. [Vite migration](https://vite.dev/guide/migration), [Tailwind compatibility](https://tailwindcss.com/docs/compatibility). |

## npm compatibility matrix

Versions below are lockfile resolutions. Manifest ranges are separate; the two compiler packages are npm aliases.

| Component | Baseline | Latest stable | Selected | Constraints / source |
| --- | --- | --- | --- | --- |
| `@fontsource-variable/fraunces` | 5.3.0 | 5.3.0 | 5.3.0 | Already current; retained. [Source](https://registry.npmjs.org/@fontsource-variable/fraunces/5.3.0). |
| `@fontsource-variable/instrument-sans` | 5.3.0 | 5.3.0 | 5.3.0 | Already current; retained. [Source](https://registry.npmjs.org/@fontsource-variable/instrument-sans/5.3.0). |
| `@tauri-apps/api` | 2.12.1 | 2.12.4 | 2.12.4 | Tauri 2 API/CLI and plugin major pairs; native crates listed below. [Source](https://registry.npmjs.org/@tauri-apps/api/2.12.4). |
| `@tauri-apps/plugin-autostart` | 2.7.0 | 2.7.0 | 2.7.0 | Tauri 2 API/CLI and plugin major pairs; native crates listed below. [Source](https://registry.npmjs.org/@tauri-apps/plugin-autostart/2.7.0). |
| `@tauri-apps/plugin-dialog` | 2.8.1 | 2.8.4 | 2.8.4 | Tauri 2 API/CLI and plugin major pairs; native crates listed below. [Source](https://registry.npmjs.org/@tauri-apps/plugin-dialog/2.8.4). |
| `@tauri-apps/plugin-fs` | 2.6.0 | 2.7.1 | 2.7.1 | Tauri 2 API/CLI and plugin major pairs; native crates listed below. [Source](https://registry.npmjs.org/@tauri-apps/plugin-fs/2.7.1). |
| `@tauri-apps/plugin-notification` | 2.5.1 | 2.8.0 | 2.8.0 | Tauri 2 API/CLI and plugin major pairs; native crates listed below. [Source](https://registry.npmjs.org/@tauri-apps/plugin-notification/2.8.0). |
| `firebase` | 12.19.0 | 13.2.0 | 13.2.0 | Latest stable; clean peer resolution. [Source](https://registry.npmjs.org/firebase/13.2.0). |
| `lucide-react` | 0.539.0 | 1.70.0 | 1.70.0 | Latest stable; clean peer resolution. [Source](https://registry.npmjs.org/lucide-react/1.70.0). |
| `react` | 19.2.8 | 19.3.1 | 19.3.1 | React/DOM 19.3 and their matching type packages are upgraded together. [Source](https://registry.npmjs.org/react/19.3.1). |
| `react-dom` | 19.2.8 | 19.3.1 | 19.3.1 | React/DOM 19.3 and their matching type packages are upgraded together. [Source](https://registry.npmjs.org/react-dom/19.3.1). |
| `@eslint/js` | 10.0.1 | 10.0.1 | 10.0.1 | Already current; retained. [Source](https://registry.npmjs.org/@eslint/js/10.0.1). |
| `@firebase/rules-unit-testing` | 5.0.2 | 6.0.0 | 6.0.0 | Requires Firebase 13 and Node >=24.12.0. [Source](https://registry.npmjs.org/@firebase/rules-unit-testing/6.0.0). |
| `@tailwindcss/vite` | 4.3.3 | 4.3.5 | 4.3.5 | Declared Vite 5/6/7/8 peer range. [Source](https://registry.npmjs.org/@tailwindcss/vite/4.3.5). |
| `@tauri-apps/cli` | 2.12.1 | 2.12.4 | 2.12.4 | Tauri 2 API/CLI and plugin major pairs; native crates listed below. [Source](https://registry.npmjs.org/@tauri-apps/cli/2.12.4). |
| `@testing-library/dom` | 10.4.1 | 10.4.2 | 10.4.2 | Latest stable; clean peer resolution. [Source](https://registry.npmjs.org/@testing-library/dom/10.4.2). |
| `@testing-library/react` | 16.3.3 | 16.3.3 | 16.3.3 | Already current; retained. [Source](https://registry.npmjs.org/@testing-library/react/16.3.3). |
| `@types/node` | 26.4.0 | 26.6.6 | 26.6.6 | Node 26 types now match the Node 26 runtime (baseline used Node 26 types on Node 24). [Source](https://registry.npmjs.org/@types/node/26.6.6). |
| `@types/react` | 19.2.18 | 19.3.0 | 19.3.0 | React/DOM 19.3 and their matching type packages are upgraded together. [Source](https://registry.npmjs.org/@types/react/19.3.0). |
| `@types/react-dom` | 19.2.5 | 19.3.0 | 19.3.0 | React/DOM 19.3 and their matching type packages are upgraded together. [Source](https://registry.npmjs.org/@types/react-dom/19.3.0). |
| `@typescript/native` | absent | 7.0.2 | 7.0.2 | Native tsc for every typecheck and build; official side-by-side compiler setup. [Source](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/). |
| `@vitejs/plugin-react` | 4.7.0 | 6.2.1 | 6.2.1 | Requires Vite 8; optional Babel/compiler integrations are unused. [Source](https://registry.npmjs.org/@vitejs/plugin-react/6.2.1). |
| `axe-core` | 4.13.0 | 4.14.0 | 4.14.0 | Latest stable; clean peer resolution. [Source](https://registry.npmjs.org/axe-core/4.14.0). |
| `eslint` | 10.9.1 | 10.14.0 | 10.14.0 | Latest stable; clean peer resolution. [Source](https://registry.npmjs.org/eslint/10.14.0). |
| `eslint-plugin-react-hooks` | 7.1.1 | 7.1.1 | 7.1.1 | Already current; retained. [Source](https://registry.npmjs.org/eslint-plugin-react-hooks/7.1.1). |
| `eslint-plugin-react-refresh` | 0.5.5 | 0.5.7 | 0.5.7 | Latest stable; clean peer resolution. [Source](https://registry.npmjs.org/eslint-plugin-react-refresh/0.5.7). |
| `globals` | 17.11.0 | 17.14.0 | 17.14.0 | Latest stable; clean peer resolution. [Source](https://registry.npmjs.org/globals/17.14.0). |
| `jsdom` | 30.0.1 | 31.0.0 | 31.0.0 | Latest stable; clean peer resolution. [Source](https://registry.npmjs.org/jsdom/31.0.0). |
| `playwright-core` | 1.62.1 | 1.65.0 | 1.65.0 | Latest stable; clean peer resolution. [Source](https://registry.npmjs.org/playwright-core/1.65.0). |
| `tailwindcss` | 4.3.3 | 4.3.5 | 4.3.5 | Latest stable; clean peer resolution. [Source](https://registry.npmjs.org/tailwindcss/4.3.5). |
| `typescript` | 5.8.3 | 7.0.2 | 6.0.2 | Official @typescript/typescript6 6.0.2 API alias for ESLint and non-evaluating localization AST parsing; tsc is provided by @typescript/native 7.0.2. [Source](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/). |
| `typescript-eslint` | 8.68.0 | 8.72.1 | 8.72.1 | ESLint 8/9/10; TypeScript API >=4.8.4 <6.1.0. The API alias satisfies the supported range. [Source](https://registry.npmjs.org/typescript-eslint/8.72.1). |
| `vite` | 7.3.7 | 8.3.6 | 8.3.6 | Latest stable; clean peer resolution. [Source](https://registry.npmjs.org/vite/8.3.6). |
| `vite-plugin-pwa` | 1.3.0 | 2.0.0 | 2.0.0 | Latest stable; clean peer resolution. [Source](https://registry.npmjs.org/vite-plugin-pwa/2.0.0). |
| `vitest` | 4.1.12 | 5.1.0 | 5.1.0 | Latest stable; clean peer resolution. [Source](https://registry.npmjs.org/vitest/5.1.0). |

Workbox build/window remain 7.4.1, the latest stable versions and the PWA plugin's declared peer range. Vite 8 uses Rolldown/Oxc; no Rollup-specific bundler settings, manual chunks or esbuild options were retained. Existing font preloads, dynamic imports, localized manifests and desktop/PWA isolation pass build verification. Config dependencies use explicit .ts extensions for the supported native loader path. [PWA 2 release](https://github.com/vite-pwa/vite-plugin-pwa/releases/tag/v2.0.0), [Vitest migration](https://vitest.dev/guide/migration), [Vite configuration](https://vite.dev/config/).

## Cargo compatibility matrix

| Component | Baseline | Latest stable | Selected | Constraints / source |
| --- | --- | --- | --- | --- |
| `tauri` | 2.12.1 | 2.12.5 | 2.12.5 | Latest direct dependency; locked resolution. [Registry](https://crates.io/crates/tauri/2.12.5). |
| `serde` | 1.0.229 | 1.0.229 | 1.0.229 | Already current; retained. [Registry](https://crates.io/crates/serde/1.0.229). |
| `serde_json` | 1.0.151 | 1.0.154 | 1.0.154 | Latest direct dependency; locked resolution. [Registry](https://crates.io/crates/serde_json/1.0.154). |
| `atomic-write-file` | 0.3.1 | 0.3.1 | 0.3.1 | Already current; retained. [Registry](https://crates.io/crates/atomic-write-file/0.3.1). |
| `resvg` | 0.45.1 | 0.49.0 | 0.49.0 | Latest direct dependency; locked resolution. [Registry](https://crates.io/crates/resvg/0.49.0). |
| `mdns-sd` | 0.13.11 | 0.21.7 | 0.21.7 | Latest direct dependency; locked resolution. [Registry](https://crates.io/crates/mdns-sd/0.21.7). |
| `tauri-plugin-single-instance` | 2.5.2 | 2.5.5 | 2.5.5 | Latest direct dependency; locked resolution. [Registry](https://crates.io/crates/tauri-plugin-single-instance/2.5.5). |
| `tauri-plugin-global-shortcut` | 2.4.0 | 2.4.1 | 2.4.1 | Latest direct dependency; locked resolution. [Registry](https://crates.io/crates/tauri-plugin-global-shortcut/2.4.1). |
| `tauri-plugin-autostart` | 2.7.0 | 2.7.0 | 2.7.0 | Already current; retained. [Registry](https://crates.io/crates/tauri-plugin-autostart/2.7.0). |
| `tauri-plugin-notification` | 2.5.1 | 2.8.0 | 2.8.0 | Latest direct dependency; locked resolution. [Registry](https://crates.io/crates/tauri-plugin-notification/2.8.0). |
| `tauri-plugin-fs` | 2.6.0 | 2.7.1 | 2.7.1 | Latest direct dependency; locked resolution. [Registry](https://crates.io/crates/tauri-plugin-fs/2.7.1). |
| `tauri-plugin-dialog` | 2.8.1 | 2.8.4 | 2.8.4 | Latest direct dependency; locked resolution. [Registry](https://crates.io/crates/tauri-plugin-dialog/2.8.4). |
| `keepawake` | 0.6.1 | 0.6.1 | 0.6.1 | Already current; retained. [Registry](https://crates.io/crates/keepawake/0.6.1). |
| `reqwest` | 0.13.5 | 0.13.5 | 0.13.5 | Already current; retained. [Registry](https://crates.io/crates/reqwest/0.13.5). |
| `sha2` | 0.10.9 | 0.11.1 | 0.11.1 | Direct application dependency upgraded; older ABI versions may remain under upstream dependencies. [Registry](https://crates.io/crates/sha2/0.11.1). |
| `base64` | 0.21.7, 0.22.1, 0.23.1 | 0.23.1 | 0.23.1 | Direct application dependency upgraded; older ABI versions may remain under upstream dependencies. [Registry](https://crates.io/crates/base64/0.23.1). |
| `getrandom` | 0.2.17, 0.3.4, 0.4.3 | 0.4.3 | 0.4.3 | Direct application dependency upgraded; older ABI versions may remain under upstream dependencies. [Registry](https://crates.io/crates/getrandom/0.4.3). |
| `open` | 5.4.4 | 5.4.5 | 5.4.5 | Latest direct dependency; locked resolution. [Registry](https://crates.io/crates/open/5.4.5). |
| `keyring` | 3.6.3 | 4.2.0 | 3.6.3 | Deferred 4.2.0: it removes linux-native-sync-persistent and the existing combined Linux keyutils/Secret Service backend. Its v1 wrapper selects Secret Service only. Retain 3.6.3 to preserve credential-store behavior and existing refresh-token lookup; a backend migration needs dedicated retention acceptance. [Registry](https://crates.io/crates/keyring/4.2.0). |
| `tauri-build` | 2.7.1 | 2.7.4 | 2.7.4 | Latest direct dependency; locked resolution. [Registry](https://crates.io/crates/tauri-build/2.7.4). |
| `webkit2gtk` | 2.0.2 | 2.0.2 | 2.0.2 | Already current; retained. [Registry](https://crates.io/crates/webkit2gtk/2.0.2). |
| `glib` | 0.18.5 | 0.22.10 | 0.18.5 | Deferred 0.22.10: Tauri/GTK/WebKit still resolve the 0.18 ABI. Keep vendored 0.18.5 with the existing VariantStrIter security backport and optimized regression. [Registry](https://crates.io/crates/glib/0.22.10). |

[Keyring 4 v1 backend](https://docs.rs/keyring/4.2.0/keyring/v1/index.html) and [keyring 3 persistent backend](https://docs.rs/keyring/3.6.3/keyring/keyutils_persistent/index.html) explain the credential-store constraint. [GLib advisory](https://rustsec.org/advisories/RUSTSEC-2024-0429.html) and [upstream fix](https://github.com/gtk-rs/gtk-rs-core/pull/1343) remain applicable; an audit alone does not establish remediation.

## CI and installation policy

GitHub-hosted runners support the Node 24 action runtime. Checkout 7, setup-node 7, setup-java 6, upload-artifact 7 and download-artifact 8 retain their full verified SHA pins. Their configuration keeps checkout credentials disabled, named immutable artifacts, default hidden-file exclusion and explicit download run IDs. setup-node's removed dummy auth token is unused. The action runtime is independent of the application build's Node 26.

| Action/tool | Selected | Source |
| --- | --- | --- |
| `actions/checkout` | v7.0.1; `3d3c42e5aac5ba805825da76410c181273ba90b1` | [Upstream](https://github.com/actions/checkout/releases/tag/v7.0.1). |
| `actions/setup-node` | v7.1.0; `949feb2413d6458794dcd2491c4babbbce0c15c1` | [Upstream](https://github.com/actions/setup-node/releases/tag/v7.1.0). |
| `actions/setup-java` | v6.2.0; `77dd5b2ce225ea11469928ac317850245a74ae78` | [Upstream](https://github.com/actions/setup-java/releases/tag/v6.2.0). |
| `actions/upload-artifact` | v7.0.2; `cf430e030ddbb5b0abf93d22962f4752f3646cd9` | [Upstream](https://github.com/actions/upload-artifact/releases/tag/v7.0.2). |
| `actions/download-artifact` | v8.0.2; `9000827ccba6bdab643e8b6fd33ac0654aef8333` | [Upstream](https://github.com/actions/download-artifact/releases/tag/v8.0.2). |
| `Swatinem/rust-cache` | v2.9.3; `d1527c8f67ef9af357290475d4af4b0fab8f12e0` | [Upstream](https://github.com/Swatinem/rust-cache/releases/tag/v2.9.3). |
| `dtolnay/rust-toolchain` | stable; `b725eda525362e7cf34af9a7243cac1e3f01a7ec` | [Upstream](https://github.com/dtolnay/rust-toolchain/commit/b725eda525362e7cf34af9a7243cac1e3f01a7ec). |
| cargo-audit | 0.22.2 | [Registry](https://crates.io/crates/cargo-audit/0.22.2). |
| tauri-driver | 2.1.0 | [Registry](https://crates.io/crates/tauri-driver/2.1.0). |
| firebase-tools | 15.35.0 | [Registry](https://registry.npmjs.org/firebase-tools/15.35.0). |

npm 12 enforces allowScripts. The obsolete esbuild approval is removed because the final tree no longer contains esbuild. Firebase util's environment-driven postinstall configuration is unnecessary because this application initializes Firebase explicitly; protobufjs's version-scheme warning and optional fsevents build are also denied. There are no pending lifecycle approvals. [npm script policy](https://docs.npmjs.com/cli/v12/commands/npm-approve-scripts/).

Normal npm install followed by npm ci succeeds without force, legacy peers or blanket compatibility overrides. npm 12.2.2 --package-lock-only hits EALLOWREMOTE while inspecting Tailwind's bundled optional WASI package; normal npm install avoids that tooling bug and preserves cross-platform optional entries. The existing gRPC security override remains necessary: current @firebase/firestore 4.19.1 still declares ~1.9.0. It now resolves 1.14.7, preserving the baseline remediation. Removing it was tested and reproduced five high audit entries; reinstating the targeted override restores zero high/critical entries. [Firestore metadata](https://registry.npmjs.org/@firebase/firestore/4.19.1), [gRPC advisory](https://github.com/advisories/GHSA-m9gg-hp2v-232j).

Dependabot PRs #11–25 were inspected through metadata/checks; #23 fails normal installation on the TypeScript peer constraint, #25 supplies a compatible mDNS manifest change, and #24 upgrades notification JS without the matching native crate. This migration updates both halves. No other PR was merged or run cancelled. [PR 23](https://github.com/w3ziqv/focus-flow/pull/23), [PR 24](https://github.com/w3ziqv/focus-flow/pull/24), [PR 25](https://github.com/w3ziqv/focus-flow/pull/25).

## Validation evidence

- Baseline clean install, complete npm dependency tree, typechecks, lint, design tokens, UI boundaries, desktop configuration, 72 unit files / 910 tests, both builds and build isolation passed.
- Baseline browser/interactions/responsive/accessibility/motion/offline/stress passed. System Chromium 156 timed out in localization and guides; both passed unchanged in an isolated baseline checkout on Playwright Chromium 151 (420.794 s and 75.250 s).
- Node 26 exposed a test-environment mismatch: native sessionStorage did not share the Storage constructor used by prototype quota spies. Test setup now supplies one constructor with separate local/session stores. The original no-reload-on-quota assertion remains intact; all 910 tests pass.
- Candidate TypeScript compiler/API regression tests, normal peer resolution, lint, typecheck, 910 unit tests, both frontend builds and build isolation passed. Firestore rules and 32 integration assertions passed using demo-focus-flow-security on the loopback emulator; no production account was used.
- Same-origin PWA update passed from the reference build to the candidate with the same active deadline, session ID, task, checklist, history, settings, theme and Polish locale. The profile and worker were retained between builds. A later offline reload loaded both unvisited lazy routes, all catalog cover sizes and decoded rain/wave recordings.
- Cargo formatting and audit passed. Baseline and candidate have zero vulnerability advisories; four upstream unmaintained warnings remain, and the baseline yanked warning is absent in the candidate. Full local native tests/Clippy/optimized application regression are unavailable because webkit2gtk-4.1 development metadata is missing. The exact existing GLib test was also copied into an isolated glib-only crate and passed with --release (10,000 traversals); this supplements rather than replaces platform CI.

The final CI links, browser matrix, visual comparison and repeated timings will be recorded after their runs complete.

## Rollback and release limits

This change preserves application version 3.1.2, identifier ink.focusflow.desktop, storage keys, backup/sync schemas, capabilities and IPC boundaries. It introduces no data migration. Before release, retain an independent JSON backup and the previous installer as described in [installation and rollback](../../INSTALL-UPDATE.md). To revert the toolchain, restore this PR's parent manifests/configuration/lockfiles together and run the corresponding Node 24 clean build. Keep the published v3.1.2 tag and assets unchanged.

Production promotion, merge and installer publication are outside this PR. The protected production Windows upgrade/backup rollback job stays gated and cannot be claimed by a feature-branch test. Physical iPhone frame rate, real-device OS integration, production OAuth/credential-store retention and macOS platform acceptance remain release-stage checks; macOS remains experimental. The private production snapshot migration suite requires its separately supplied private snapshot and is not replaced by synthetic fixtures.
