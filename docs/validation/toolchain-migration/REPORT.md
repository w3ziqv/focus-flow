# Toolchain migration validation

Checked: 2026-11-07 (Europe/Warsaw). Application version: 3.1.2.

Baseline: `e29b5278a66c17933b6195aedc7f275b9c22ca45` (`main`, published tag `v3.1.2`). Candidate application source: `2a15c22dc6fe459d49ef832d9481e9f1aa5a9b59`. Validation harness and CI source: `cce26bcf975864f566101344b21a34169bdb58aa`; the final report commit also makes the isolated CLI engine check explicit. Application code and dependency locks are unchanged by that follow-up. The initial working tree contained only untracked `docs/prompts/`; those maintainer files are excluded from this PR.

## Status

Implementation and local validation are complete. Passing CI runs are linked below; the PR checks page records results for the latest head. Visual comparison covers 105 pairs across five themes, seven states and 320/393/1440 px; image dimensions match and changed pixels stay below 0.26%, mainly from the randomized greeting. No release installer has been published; CI packages are test artifacts. The reference tag and release assets are unchanged.

## Runtime and compiler selection

| Component | Baseline | Latest stable | Selected | Constraint and primary source |
| --- | --- | --- | --- | --- |
| Node.js | 24; baseline measured on 24.22.2 | 26.13.0 LTS | 26.13.0 | Newest LTS; Vercel supports 26.x and package engines override its 24.x project setting. [Node](https://nodejs.org/en/about/previous-releases), [Vercel](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions). |
| npm | 11.19.1 in baseline runtime | 12.2.2 | 12.2.2 | Node engines supported; CI and preview install it explicitly. [Registry](https://registry.npmjs.org/npm/12.2.2). |
| Rust compiler | CI stable, 1.99.1 at validation time | 1.99.1 | 1.99.1 | Pinned in rust-toolchain.toml and CI; edition 2021 and MSRV 1.90 remain valid. Full resolved Cargo metadata declares no higher MSRV. [Release notes](https://doc.rust-lang.org/stable/releases.html). |
| JavaScript target | ES2022 type library; Vite 7 browser defaults | Vite 8 defaults raise browser versions | ES2022; Chrome/Edge 107, Firefox 104, Safari 16 | Explicit build.target and cssTarget preserve the previous syntax floor; Tailwind 4 retains its existing CSS floor of Chrome 111, Safari 16.4 and Firefox 128; the syntax target does not lower that CSS requirement. [Vite migration](https://vite.dev/guide/migration), [Tailwind compatibility](https://tailwindcss.com/docs/compatibility). |

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
| `base64` | 0.22.1 (direct) | 0.23.1 | 0.23.1 | Direct application dependency upgraded; older ABI versions may remain under upstream dependencies. [Registry](https://crates.io/crates/base64/0.23.1). |
| `getrandom` | 0.3.4 (direct) | 0.4.3 | 0.4.3 | Direct application dependency upgraded; older ABI versions may remain under upstream dependencies. [Registry](https://crates.io/crates/getrandom/0.4.3). |
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
| Java (emulator runtime) | 21 → Temurin 27.0.1.0.2+1 | [Latest stable release](https://github.com/adoptium/temurin27-binaries/releases/tag/jdk-27.0.1.0.2%2B1); rules and integration passed locally on 21 and 27. |
| firebase-tools | 15.32.1 → 15.35.0; isolated Node 24.22.2 | [Registry](https://registry.npmjs.org/firebase-tools/15.35.0), [superstatic engines](https://registry.npmjs.org/superstatic/10.0.0). |

npm 12 enforces allowScripts. Project engine-strict rejects npm 11 before installation; an isolated probe rejected bundled npm 11.20.0 and accepted npm 12.2.2. The strict clean install leaves the lockfile unchanged. The obsolete esbuild approval is removed because the final tree no longer contains esbuild. Firebase util's environment-driven postinstall configuration is unnecessary because this application initializes Firebase explicitly; protobufjs's version-scheme warning and optional fsevents build are also denied. There are no pending lifecycle approvals. [npm script policy](https://docs.npmjs.com/cli/v12/commands/npm-approve-scripts/).

Firebase CLI 15.35.0 still requires superstatic ^10, whose engines allow Node 20/22/24. superstatic 11.1.0 supports Node 26, but the CLI has not adopted that major. The security job installs the CLI under supported LTS Node 24.22.2 in a separate temporary prefix, with lifecycle scripts disabled, then switches the application and test processes back to Node 26.13.0. The CLI is invoked with its absolute Node 24 executable; its emulator child command logs Node 26 before running application tests. Both runtime constraints remain enforced. This auxiliary exception does not affect npm ci, the app build or hosting. [CLI dependency metadata](https://registry.npmjs.org/firebase-tools/15.35.0), [new superstatic engines](https://registry.npmjs.org/superstatic/11.1.0).

Normal npm install followed by npm ci succeeds without force, legacy peers or blanket compatibility overrides. npm 12.2.2 --package-lock-only hits EALLOWREMOTE while inspecting Tailwind's bundled optional WASI package; normal npm install avoids that tooling bug and preserves cross-platform optional entries. The existing gRPC security override remains necessary: current @firebase/firestore 4.19.1 still declares ~1.9.0. It now resolves 1.14.7, preserving the baseline remediation. Removing it was tested and reproduced five high audit entries; reinstating the targeted override restores zero high/critical entries. [Firestore metadata](https://registry.npmjs.org/@firebase/firestore/4.19.1), [gRPC advisory](https://github.com/advisories/GHSA-m9gg-hp2v-232j).

Dependabot PRs #11 through #25 were inspected through metadata/checks; #23 fails normal installation on the TypeScript peer constraint, #25 supplies a compatible mDNS manifest change, and #24 upgrades notification JS without the matching native crate. This migration updates both halves. No other PR was merged or run cancelled. [PR 23](https://github.com/w3ziqv/focus-flow/pull/23), [PR 24](https://github.com/w3ziqv/focus-flow/pull/24), [PR 25](https://github.com/w3ziqv/focus-flow/pull/25).

## Validation evidence

- Baseline clean install, complete npm dependency tree, typechecks, lint, design tokens, UI boundaries, desktop configuration, 72 unit files / 910 tests, both builds and build isolation passed.
- Baseline browser/interactions/responsive/accessibility/motion/offline/stress passed. System Chromium 156 timed out in localization and guides; both passed unchanged in an isolated baseline checkout on Playwright Chromium 151 (420.794 s and 75.250 s).
- Node 26 exposed a test-environment mismatch: native sessionStorage did not share the Storage constructor used by prototype quota spies. Test setup now supplies one constructor with separate local/session stores. The original no-reload-on-quota assertion remains intact; all 910 tests pass.
- Candidate TypeScript compiler/API regression tests, normal peer resolution, lint, typecheck, 910 unit tests, both frontend builds and build isolation passed. 66 Firestore authorization checks and the integration suite passed using demo-focus-flow-security on the loopback emulator; no production account was used.
- Same-origin PWA update passed from the reference build to the candidate with the same active deadline, session ID, task, checklist, history, settings, theme and Polish locale. The profile and worker were retained between builds. A later offline reload loaded both unvisited lazy routes, all catalog cover sizes and decoded rain/wave recordings.
- Cargo formatting and audit passed. Baseline and candidate have zero vulnerability advisories; four upstream unmaintained warnings remain, and the baseline yanked warning is absent in the candidate. Full local native tests/Clippy/optimized application regression are unavailable because webkit2gtk-4.1 development metadata is missing. The exact existing GLib test was also copied into an isolated glib-only crate and passed with --release (10,000 traversals); platform CI covers the full application regression.

The first candidate CI passed the main checks, Firestore, Rust audit, PWA update and macOS ARM64 packaging. Updated axe 4.14 detected an existing visible-label/ARIA-name mismatch on guide return buttons. Both names now include their visible localized destination; no visible UI string changed. Locale selectors use the translated back prefix. The fixed guide suite passed all 80 language/theme/viewport cases and 30 WCAG A/AA audits. No accessibility rule was disabled.

Native smoke coverage exercises JSON export to a real scoped native file, import of a changed setting and restoration of the exported value. Only the OS save picker is redirected; serialization, filesystem IPC and the import UI remain real. Linux and Windows also relaunch the same installed candidate and assert a UI-created task survived. The initial native run exposed a harness error: Tauri makes invoke immutable, so replacing that property did not redirect the picker. The test now intercepts only the save-dialog response at the fetch boundary, preserving invoke and all real filesystem requests. A local transport probe passed both Linux and Windows IPC URL forms; the installed Windows and Linux reruns passed, including the portable AppImage with host media plugins excluded.

The first-worker update test also exposed an activation race: a registration can have an active worker whose state is still activating. Reloading its first client at that point occasionally preceded clientsClaim. The harness now waits for the activated worker and its controller before the first reload, retains all update assertions and records worker/cache state on failure. Ten consecutive fresh-profile updates passed locally, followed by a passing CI update. No application worker or cache reset was added.

| Validation | Command / environment | Result and evidence |
| --- | --- | --- |
| Clean install and peers | `npm ci`, `npm ls --all`; Node 26.13.0, npm 12.2.2 | Passed; npm lockfile v3 unchanged after installation. |
| Compiler/API, lint, design and boundaries | `npm run test:toolchain`, `typecheck`, `typecheck:node`, `lint`, `design:check`, `test:ui-boundaries` | Passed; three focused compiler/API tests. Every build/typecheck uses tsc 7. |
| Unit and desktop configuration | `npm run test:run`; `node --test scripts/test-desktop-cloud-config.mjs` | Passed; 72 unit files, 910 tests; configuration tests passed. |
| Production frontend output | `npm run build`, `build:desktop`, `verify:builds` | Passed; separate web/desktop outputs, localized manifests, font preloads and cloud boundaries. |
| UI, responsiveness and accessibility | `npm run test:browser`, `test:ui-interactions`, `test:responsive`, `test:a11y`, `test:guides` | Passed locally and in platform CI. Guides: 80 cases and 30 WCAG A/AA audits. |
| Content and motion | `npm run test:localization`, `test:motion` | Passed; seven categories, 48 articles, 192 localized article views, 20 localization accessibility audits; OS/manual reduced motion and interrupted navigation retained. |
| Offline and stress | `npm run test:web-offline`, `test:stress` | Passed; lazy content, 14 decoded covers, rain/wave recordings and retired-chunk recovery. |
| Actual reference update | `FOCUS_FLOW_REFERENCE_DIST=<reference-dist> npm run test:dependency-migration` | Passed locally ten times after the harness fix and in CI; same origin/profile and retained running session, followed by offline navigation. |
| Firestore | Isolated Firebase CLI 15.35.0, Node 24.22.2; Java 27; child tests on Node 26 | Passed: 66 authorization checks and one emulator integration test. No production connection. |
| Snapshot migration | `npm run test:migration` with the existing test-project snapshot on a demo loopback emulator | Passed: migration, restart and JSON export/restore. Private fixture excluded. |
| Rust | `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`; locked tests; Clippy `--all-targets -- -D warnings`; optimized GLib regression | Linux CI passed 21 native tests and the optimized regression; Windows/macOS native checks also passed. Local full builds require missing WebKit development packages. |
| Installers | Existing Desktop workflow and installed-app wrappers | Linux deb/AppImage, Windows NSIS and ARM64 macOS DMG built. Installed Linux/Windows checks passed; protected production upgrade/backup rollback remains skipped by design. |

Passing implementation runs: [CI, including the fixed worker update](https://github.com/w3ziqv/focus-flow/actions/runs/42369289173), [Security, including isolated Firebase CLI](https://github.com/w3ziqv/focus-flow/actions/runs/42369289177), and [Desktop](https://github.com/w3ziqv/focus-flow/actions/runs/42368465847). The Desktop run passed all three builds and both installed-app jobs with the final application code and native harness (`b4bca1f`); the subsequent `cce26bc` changes affect the browser harness and emulator orchestration. Results for the latest PR head are visible on the [checks page](https://github.com/w3ziqv/focus-flow/pull/30/checks).

Installer artifacts contain `SHA256SUMS.txt` and `desktop-build.json`. Installed jobs verify both the hash and exact GitHub source SHA before launching the binary, with offline mode and null cloud/client IDs. Pull-request builds use GitHub's synthetic merge SHA. For example, downloaded ARM64 DMG metadata records `5d7db3234d98b167087393bc59d1acad47107d5b`; its complete tree equals candidate application commit `2a15c22` (`efad96ba04a0ed18f129d104feab0de0e5cd1e5a`). The DMG checksum passed locally. A merge SHA in this metadata is expected, and does not identify a different application source.

[Vercel preview](https://focus-flow-ajq89qxk0-w3ziqvs-projects.vercel.app) is ready for `cce26bc`. Build logs confirm Node 26.13.0 and npm 12.2.2, despite the unchanged production project's 24.x setting. The protected preview was exercised through temporary authenticated access: running timer, lazy guide navigation and reload retained the same session ID/deadline without page or console errors. The access token is excluded from this report and artifacts. The [branch preview](https://focus-flow-git-codex-toolchain-migration-w3ziqvs-projects.vercel.app) follows subsequent PR commits.

## Audit findings and deferred transitive updates

`npm audit --audit-level=high` passes. Baseline and candidate each report 15 development-tree findings (two low, 13 moderate); `npm audit --omit=dev` reports zero findings for the candidate. Current ESLint 10.14.0 and typescript-eslint 8.72.1 own minimatch 10.2.6, while the latest major is 11.0.5. Workbox 7.4.1 owns glob ^11 (resolved 11.1.0), while the latest major is 14.0.4. deepmerge remains 4.3.1 with an unfixed low finding. These packages cannot be moved to unrelated majors through their current owners' declared ranges. No new broad override or audit-force upgrade was added. [ESLint metadata](https://registry.npmjs.org/eslint/10.14.0), [Workbox metadata](https://registry.npmjs.org/workbox-build/7.4.1), [deepmerge](https://registry.npmjs.org/deepmerge/4.3.1).

`cargo audit --file src-tauri/Cargo.lock` reports zero vulnerability advisories and four unmaintained warnings: proc-macro-error 1.0.4 ([RUSTSEC-2024-0370](https://rustsec.org/advisories/RUSTSEC-2024-0370.html)) remains under GLib macros 0.18; zbus_names 4.3.5, zvariant 5.15.1 and zvariant_derive 5.15.1 ([RUSTSEC-2026-0371](https://rustsec.org/advisories/RUSTSEC-2026-0371.html), [RUSTSEC-2026-0370](https://rustsec.org/advisories/RUSTSEC-2026-0370.html), [RUSTSEC-2026-0372](https://rustsec.org/advisories/RUSTSEC-2026-0372.html)) remain under zbus 5.19.0, used by current keepawake/notification/single-instance dependencies. These owners already resolve their latest releases. The baseline's yanked-package warning is gone. GLib and keyring exceptions are recorded in the Cargo matrix above.

## Visual and performance comparison

Measurements ran sequentially on one Linux x86_64 host (Ryzen 7 5700G, 16 logical CPUs), with a warm filesystem. Compiler/build figures are medians of five alternating baseline/candidate pairs. The baseline uses its Node 24.22.2/npm 11.19.1 toolchain; the candidate uses Node 26.13.0/npm 12.2.2. These measurements compare the complete migration, including the compiler and bundler changes.

| Measurement | Reference 3.1.2 | Candidate | Conditions |
| --- | --- | --- | --- |
| Typecheck | 3.7660 s | 0.5223 s | `npm run typecheck` |
| Web build | 7.8428 s | 2.1445 s | `npm run build`, including typecheck and worker generation |
| Desktop frontend build | 6.8097 s | 1.1013 s | `npm run build:desktop`, including typecheck |
| Initial JavaScript | 139,748 bytes | 149,550 bytes | gzip response bodies; entry and initial lazy App/theme chunks plus worker registration |
| Initial CSS | 13,330 bytes | 13,426 bytes | Same gzip server and viewport |
| Startup LCP, CPU 1x | 108 ms (100 to 112) | 112 ms (108 to 116) | Median and range, six alternating AB/BA pairs |
| Startup LCP, synthetic CPU 4x | 352 ms (352 to 404) | 382 ms (344 to 412) | Median and range, six alternating AB/BA pairs |

Startup measurements use one Chromium 156.0.8078.79 process and Node 26 gzip server for both builds, fresh browser contexts, a 393×852 viewport, blocked service workers, reduced motion, fixed greeting randomness and no network throttle. The initial separate five-context measurements and a common-server repeat are retained in the artifact evidence; the counterbalanced 24-trial comparison above reduces ordering and server-runtime differences. No trial was dropped.

JavaScript grows by 9,802 bytes (7.0%); CSS grows by 96 bytes (0.7%). Staged build logs show most of the JS growth after the React/Firebase upgrade (entry gzip 92.86 kB before that group, 101.63 kB afterward). The Vite-only stage did not produce that increase. The candidate retains the new stable runtime dependencies and existing lazy boundaries. The synthetic 4x LCP median increases by 30 ms with overlapping ranges; this cost is recorded alongside the faster builds. No new animation framework, runtime polyfill or eager guide import was added.

The 105 screenshot pairs cover timer, guide index/category/article, settings, nested language dialog and export, in all five themes at 320/393/1440 px. Browser, motion setting and screenshot procedure are the same. Dimensions match; maximum changed pixels are 0.2544%, chiefly timer greeting variation. Contact sheets and representative full images were inspected. The interaction/motion suites separately cover a running timer, rapid forward/back navigation, focus/scroll restoration and reduced motion. These headless results do not establish physical iPhone frame rate or OS integration.

Raw timing/startup samples and visual summary are committed in [measurements.json](measurements.json). Bulky logs, screenshots and the measurement helpers are preserved locally under ignored `test-artifacts/toolchain-migration/evidence/`; CI evidence is attached to the linked workflow runs. No production snapshot, browser account profile or temporary preview-access token is included.

## Rollback and release limits

This change preserves application version 3.1.2, identifier ink.focusflow.desktop, storage keys, backup/sync schemas, capabilities and IPC boundaries. It introduces no data migration. Before release, retain an independent JSON backup and the previous installer as described in [installation and rollback](../../INSTALL-UPDATE.md). To revert the toolchain, revert this PR as a unit, including source/test adaptations, manifests, configuration and both lockfiles. Run the parent Node 24 clean install, checks and both builds together; restoring only dependency manifests would leave incompatible compiler and test entry points. A deployed PWA rollback also requires verifying its worker update on the retained profile; do not clear user storage as a rollback step. Keep the published v3.1.2 tag and assets unchanged.

Production promotion, merge and installer publication are outside this PR. The protected production Windows upgrade/backup rollback job stays gated and cannot be claimed by a feature-branch test. Physical iPhone frame rate, real-device OS integration, production OAuth/credential-store retention and macOS platform acceptance remain release-stage checks; macOS remains experimental. The existing isolated test-project snapshot passed the migration/restart/export/restore harness on the loopback emulator (12 documents and two summaries). The snapshot itself is private and excluded from artifacts and this PR. The adjacent production snapshot was not used; production-data replay remains outside this task.
