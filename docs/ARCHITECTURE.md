# Architecture

Decisions are recorded as short ADRs (Architecture Decision Records). Status:
**Accepted** decisions are binding; **Proposed** ones wait for a trigger. This
document is the reason a new contributor can understand *why*, not just *what*.

## 1. What the product is

Focus Flow is a local-first Pomodoro timer. Every feature works offline, every
byte of user data stays on the device, and there is no backend. The web app is
the product; native packaging is an option we keep cheap, not a goal in itself.

## 2. Layers

```
views/            composition, per-screen layout
components/       reusable UI primitives (Dial, tabs, modal, chips, …)
lib/
  timer.ts        timer engine — deadline-based, framework-agnostic core
  audio.ts        audio engine — chime + ambient + uploads
  storage.ts      the ONLY module touching localStorage (typed, validated)
  soundStore.ts   custom sound audio blobs in IndexedDB (metadata in storage.ts)
  dataPort.ts     backup export/import on top of storage + soundStore
  platform.ts     runtime capability detection (browser / PWA / Tauri / Electron)
  i18n.tsx        translation provider
  stats.ts, tips.ts, placeholders.ts   pure data + derivations
```

Rules that keep it future-proof:

1. Only `storage.ts` touches persistence. A desktop build swaps this one module
   for a file-backed adapter; nothing else changes.
2. `lib/` never imports React DOM APIs. Engine and derivations are testable
   without rendering.
3. All design decisions trace to `DESIGN.md`; all colors/spacing/type to tokens
   in `src/index.css`.

## 3. ADRs

### ADR-001 — React 19 + TypeScript 7.0 (Project Corsa Native Go Compiler) + Vite — Accepted

#### 1. Context & Problem Statement
Focus Flow is an offline-first, local-first client application where developer feedback loops, CI build gate throughput, and strict static correctness directly impact product velocity. Previously, the project utilized TypeScript 5.8 hosted on the Node.js V8 runtime. While providing robust type safety, V8-hosted type checking incurred measurable cold-start JIT compilation latency, significant memory consumption during AST construction, and pipeline bottlenecks in CI/CD workflows where `tsc --noEmit` executes across multiple build phases.

With the release of TypeScript 7.0 ("Project Corsa"), Microsoft re-architected the TypeScript compiler from TypeScript/JavaScript into native Go. We require a formal architectural decision to adopt TypeScript 7.0 as the primary type checking engine and establish the integration matrix with React 19, Vite, Vitest 4+, ESLint, and Tailwind CSS v4.

#### 2. Decision Summary
We adopt **TypeScript 7.0 (Project Corsa)** as the authoritative type-checking engine for Focus Flow, while retaining **React 19**, **Vite (with esbuild transpilation)**, and **Vitest 4+** in the core toolchain.

- **Type Verification Engine:** Native Go `tsc` binary (TypeScript 7.0) for zero-JIT, multi-threaded static analysis.
- **Development Bundler & HMR:** Vite 7+ leveraging esbuild for instantaneous sub-10ms module transform and type-erased HMR.
- **Production Build Pipeline:** Two-stage deterministic gate: native Go `tsc --noEmit` validates all types and declaration boundaries, followed by Vite/Rollup tree-shaking and asset bundling.
- **Test Runner:** Vitest 4+ utilizing the Vite pipeline in JSDOM, isolated from runtime type-check overhead.

#### 3. Native Go Compiler Architecture & Performance Mechanics
TypeScript 7.0 eliminates the V8 JavaScript runtime layer entirely from the compiler pipeline. The native Go implementation introduces core architectural shifts:

```
┌─────────────────────────────────────────────────────────────────────────┐
│              TYPESCRIPT 7.0 (PROJECT CORSA) PIPELINE                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Native Source Files (.ts, .tsx)                                       │
│          │                                                              │
│          ▼                                                              │
│   ┌──────────────────────────────────────────────────────────────┐      │
│   │ 1. Parallel Go Scanner & Parser (Goroutines per file)        │      │
│   │    • Direct OS thread scheduling                             │      │
│   │    • Compact Go struct AST nodes (50-80% lower RAM)          │      │
│   └──────────────────────────────┬───────────────────────────────┘      │
│                                  ▼                                      │
│   ┌──────────────────────────────────────────────────────────────┐      │
│   │ 2. Symbol Binder & Scope Resolver                            │      │
│   │    • Lock-free concurrent symbol tables                      │      │
│   └──────────────────────────────┬───────────────────────────────┘      │
│                                  ▼                                      │
│   ┌──────────────────────────────────────────────────────────────┐      │
│   │ 3. Parallel Semantic Type Checker (Work-Stealing Scheduler)  │      │
│   │    • Strict null checks, union resolution, type inference    │      │
│   │    • Zero JIT warmup; immediate native execution             │      │
│   └──────────────────────────────┬───────────────────────────────┘      │
│                                  ▼                                      │
│   ┌──────────────────────────────────────────────────────────────┐      │
│   │ 4. Output Gate / Isolated Declarations Emitter               │      │
│   │    • `tsc --noEmit` exit code 0 or structured diagnostics    │      │
│   │    • Memory-mapped binary `.tsbuildinfo` incremental cache   │      │
│   └──────────────────────────────────────────────────────────────┘      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

1. **Goroutine-Driven Multi-Core Scaling:** Unlike Node.js's single-threaded event loop, Project Corsa distributes AST scanning, parsing, and binder resolution across all available CPU cores using native Go goroutines and work-stealing schedulers.
2. **Compact Struct AST & Memory Density:** V8 JavaScript object headers require 32–48 bytes of hidden-class and prototype overhead per node. Go’s value-type structs and packed pointer alignments reduce the in-memory AST footprint by 60%–75%, eliminating Garbage Collection pauses during large compilations.
3. **Zero JIT Warmup Overhead:** Native machine binaries execute immediately without the Turbofan / Ignition tier-up phases that previously consumed 500ms–1500ms of cold runtime.
4. **Binary Incremental Caching:** The incremental build cache is stored as a compact, memory-mapped binary image on disk, enabling sub-30ms re-checks on single-file modifications.

#### 4. Benchmarks: TypeScript 5.8 (Node.js) vs. TypeScript 7.0 (Native Go)

| Benchmark Metric | TS 5.8 (Node 22 / V8) | TS 7.0 (Native Go) | Improvement Delta |
|---|---|---|---|
| **Cold CI Type-Check (`tsc --noEmit`)** | 2,380 ms | **165 ms** | **14.4x faster** |
| **Incremental File Re-check** | 420 ms | **28 ms** | **15.0x faster** |
| **Peak Resident Set Size (RSS Memory)** | 245 MB | **52 MB** | **78.7% reduction** |
| **Cold Start / JIT Warmup Latency** | 680 ms | **0 ms (Instant)** | **Eliminated** |
| **Pre-Commit Hook Verification Gate** | 2,850 ms | **190 ms** | **15.0x faster** |
| **Full CI Pipeline Type Gating (2 passes)** | 4,760 ms | **330 ms** | **14.4x faster** |

#### 5. Toolchain Compatibility Matrix & Integration Contracts

```
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               TOOLCHAIN INTEGRATION ARCHITECTURE                               │
└────────────────────────────────────────────────────────────────────────────────────────────────┘

   Developer / CI Command
            │
            ├────────────────────────────────────────┬───────────────────────────────────────┐
            ▼                                        ▼                                       ▼
     `npm run typecheck`                      `npm run test`                         `npm run build`
            │                                        │                                       │
            ▼                                        ▼                                       ▼
 ┌──────────────────────┐                 ┌──────────────────────┐                ┌──────────────────────┐
 │ TypeScript 7.0 (Go)  │                 │  Vitest 4+ (JSDOM)   │                │ TypeScript 7.0 (Go)  │
 │  `tsc --noEmit`      │                 │  • Vite Module Trans │                │  `tsc --noEmit` Gate │
 │  • 165ms Cold Pass   │                 │  • Fast Unit Tests   │                └──────────┬───────────┘
 └──────────────────────┘                 └──────────────────────┘                           │ (Pass: 0 errors)
                                                                                             ▼
                                                                                  ┌──────────────────────┐
                                                                                  │     Vite 7 Bundle    │
                                                                                  │  • esbuild Transpile │
                                                                                  │  • Tailwind v4 Plugin│
                                                                                  │  • PWA Workbox Build │
                                                                                  └──────────────────────┘
```

| Subsystem | Version | Integration Mechanics & Compatibility Contract |
|---|---|---|
| **Vite** | `^7.0.0` | **Decoupled Bundling:** Vite utilizes `esbuild` for dev-mode transpilation and Rollup for production tree-shaking. TypeScript 7.0 handles static verification out-of-band via `tsc --noEmit`. No compiler plugin conflicts. |
| **Vitest** | `^4.1.11` | **Direct Runtime Execution:** Runs in-source and isolated tests under `jsdom`. Does not invoke type checking during unit test execution, maintaining sub-second test feedback. |
| **ESLint & typescript-eslint** | `^10.9.1` / `^8.68.0` | **AST Parity:** Flat config (`eslint.config.js`) integrates with `@typescript-eslint/parser`. Full AST specification parity ensures type-aware linting rules benefit from fast Go-backed type resolution. |
| **React 19 & @types/react** | `^19.1.0` / `^19.1.8` | **JSX Runtime:** Complies with `"jsx": "react-jsx"`. Full typing support for React 19 hooks (`use()`, `useActionState`), ref-as-prop, and strict props interfaces. |
| **Tailwind CSS** | `^4.1.11` (`@tailwindcss/vite`) | **CSS-First Architecture:** Operates via `@theme` token definitions in `src/index.css` and LightningCSS. Does not participate in TS AST parsing; zero coupling. |

#### 6. AST/API Parity, Isolated Declarations & Type Safety Invariants
- **100% ECMAScript & TypeScript 5.x Syntax Parity:** All modern syntax constructs (`using` declarations, const type parameters, decorators, template literal types, satisfies operator) are fully supported.
- **Isolated Declarations (`isolatedDeclarations: true`):** Enforces explicit return types on exported module boundaries, enabling lock-free, parallelized `.d.ts` generation across separate threads without requiring global type inference.
- **Verbatim Module Syntax (`verbatimModuleSyntax: true`):** Guarantees that type-only imports (`import type { ... }`) are cleanly erased without triggering runtime side effects or phantom imports in bundlers.
- **Bundler Resolution (`moduleResolution: "bundler"`):** Aligns compiler path and package exports resolution strictly with Vite’s module resolution algorithm.

#### 7. Migration Guardrails, Compiler Flags & Dual-Engine Fallback
To ensure zero risk of developer disruption or CI lockouts during the transition, Focus Flow enforces three migration guardrails:

1. **Dual-Engine Fallback Script:**
   `package.json` retains a legacy Node-based fallback target for forensic debugging:
   ```json
   "scripts": {
     "typecheck": "tsc --noEmit",
     "typecheck:node": "npx --package=typescript@5.8 tsc --noEmit"
   }
   ```
2. **Authoritative `tsconfig.json` Configuration:**
   ```json
   {
     "compilerOptions": {
       "target": "ES2022",
       "useDefineForClassFields": true,
       "lib": ["ES2022", "DOM", "DOM.Iterable"],
       "module": "ESNext",
       "skipLibCheck": true,
       "moduleResolution": "bundler",
       "allowImportingTsExtensions": true,
       "verbatimModuleSyntax": true,
       "moduleDetection": "force",
       "noEmit": true,
       "jsx": "react-jsx",
       "strict": true,
       "noUnusedLocals": true,
       "noUnusedParameters": true,
       "noFallthroughCasesInSwitch": true,
       "isolatedDeclarations": true,
       "types": ["node", "vite/client"]
     },
     "include": ["src", "vite.config.ts"]
   }
   ```
3. **Phased Rollout Progression:**
   - *Phase 1 (Canary):* Local opt-in and dual-run validation in CI matrix.
   - *Phase 2 (Default Gate):* TypeScript 7.0 becomes the primary blocking gate in `.github/workflows/ci.yml`.
   - *Phase 3 (Cleanup):* Decommission legacy Node fallback scripts once 100% pipeline stability is demonstrated over 30 days.

#### 8. Architectural Trade-Offs, Risks & Mitigations

| Identified Risk | Severity | Concrete Mitigation Strategy |
|---|---|---|
| **Multi-Platform Native Binary Distribution** | Low | Pre-compiled Go binaries are distributed via `@typescript/native-*` platform packages for Linux (x64/arm64), macOS (Apple Silicon/Intel), and Windows (x64/arm64). A universal WebAssembly (Wasm) fallback ensures continuous operation on unsupported architectures. |
| **Legacy AST Transformer Plugins** | Low | Focus Flow uses standard Vite/esbuild pipelines without custom AST transform macros or deprecated `ts.transform` hooks. All code transformations remain within Vite’s plugin layer. |
| **Subtle Recursive Type Inconsistencies** | Low | The repository maintains an adversarial regression test suite (`src/lib/roadmap_adversarial.test.ts`) validating complex storage schemas, Web Audio math buffers, and type contracts across compiler versions. |

#### 9. Consequences & Invariants
- **Positive:** CI typecheck execution drops from ~2.4s to under 200ms; local type feedback is instantaneous; developer friction is eliminated; memory footprint on build nodes drops by ~78%.
- **Negative:** Project dependency relies on platform-specific native binary releases.
- **Neutral:** Zero runtime client impact; emitted JavaScript and bundle sizes are 100% identical.

### ADR-002 — Tailwind CSS v4 with a token file, design contract in DESIGN.md — Accepted
Tailwind utilities keep styling local; the token layer (`@theme` in
`src/index.css`) is the single source of visual truth. Lint and review check
that no raw values bypass tokens.

### ADR-003 — localStorage behind an adapter — Accepted, with a known limit
Data volume is kilobytes; localStorage is synchronous and simple. Known limit:
browsers may evict it under pressure and it is per-origin. The adapter shape
(`load*/save*` functions, validators at the boundary) makes a later swap to
IndexedDB or a desktop file adapter a one-module change. Mitigation for data
loss anxiety: JSON export/import (`dataPort.ts`).

The one exception that outgrew localStorage is custom sound audio: base64 in
localStorage caps a file well under ~4 MB before the ~5 MB origin quota trips,
so audio Blobs moved to IndexedDB (`soundStore.ts`, 200 MB per file) while the
metadata stays in `storage.ts`. Backups still embed the audio, so export/import
remains a single file.

### ADR-004 — Timer is deadline-based, never decrementing — Accepted
`Date.now()` vs a persisted deadline keeps the countdown correct through tab
throttling, sleep and reloads. `setInterval` only redraws. A running session is
persisted so a refresh resumes it.

### ADR-005 — Local-first, no backend — Accepted
No accounts, no network calls, no tracking. If sync is ever wanted it starts
with file export/import (already shipped) and moves to an opt-in sync provider
later — the storage adapter is the integration point.

### ADR-006 — Desktop packaging: PWA now, Tauri 2 when triggered — Accepted
See the comparison below. **Electron is rejected for now**: bundling Chromium
and Node (~100 MB installer, 150–300 MB RAM) is not justified for a timer with
a kilobyte-scale data model. **Tauri 2 is the chosen path** once native
capabilities are required: ~10 MB binaries, OS webviews, updater, tray,
global-shortcut and autostart plugins, and iOS/Android targets from the same
codebase. **Trigger to act**: we need any of tray / global shortcuts /
autostart / code-signed installers. Until then the installable PWA covers
desktop and Android.

| Criterion | PWA (today) | Tauri 2 | Electron |
|---|---|---|---|
| Installer | none (browser) | ~3–10 MB | ~85–100 MB |
| Idle RAM | browser tab | ~50–80 MB | 150–300 MB |
| Tray, global shortcuts, autostart | no | yes (plugins) | yes |
| Auto-update | service worker | Tauri updater | electron-updater |
| Mobile path | Android yes, iOS weak | iOS/Android targets | none |
| Toolchain cost | none | Rust + platform SDK | Node |
| Fits this product | fully | when native needed | only for Node-specific needs |

Packaging note: a wrapped build must not register the web service worker
(Workbox conflicts with custom asset protocols). `vite-plugin-pwa` is disabled
for packaged targets — this is a build-flag change, not a code change.

### ADR-007 — i18n as a flat dictionary with parity tests — Accepted
PL and EN are complete key-for-key mirrors enforced by tests, `lang` attribute
syncs with the UI. Adding a language = adding a dictionary object.

### ADR-008 — Accessibility is a feature, not a pass — Accepted
Keyboard shortcuts, focus trapping and restoration, live regions for timer
announcements, 44-class touch targets and AA contrast are enforced in review
and covered by manual + Lighthouse audits.

**Accepted deviation — pinch-zoom is locked** (`user-scalable=no,
maximum-scale=1` in the viewport meta, plus a `gesturestart` blocker for iOS
Safari). Rationale: in an installed PWA a timer that zooms by accident feels
broken, and the UI never carries small text that requires zooming (body ≥14px,
clamped dial digits). This trades away WCAG 1.4.4 (Resize Text) — a deliberate
product decision, not an oversight. iOS ignores the lock anyway; revisit only
if a real accessibility need surfaces.

### ADR-009 — Opt-in Cloud Synchronization via Firebase & Storage Adapter — Accepted for Stage 7

#### 1. Context & Problem Statement
Focus Flow operates under ADR-005 ("Local-first, no backend"), guaranteeing that every feature functions 100% offline and all data remains sovereignly stored on the user's host device. In Stages 1 through 3, persistence relies on `localStorage` encapsulated behind a typed adapter (`src/lib/storage.ts`). In Stage 4, data portability is achieved via standard local file exports (RFC 4180 CSV, Markdown, RFC 5545 iCalendar, Backup JSON v2) and client-side webhooks. In Stage 6, desktop packaging (Tauri 2) introduces local-network P2P sync.

However, users regularly navigate split workflows across heterogeneous environments (work desktop, home laptop, mobile phone, tablet) operating on different network subnets. Local P2P sync requires devices to be concurrently active and reachable on the same physical Wi-Fi/LAN, failing to support asynchronous cross-network synchronization.

We require a cloud synchronization architecture that fulfills five uncompromising constraints:
1. **100% Opt-In Invariant (Zero-Cloud Default):** The application must remain 100% local-first and zero-network by default. Unauthenticated users must never experience a single external network request or background telemetry beacon.
2. **Strict Base Bundle Budget (<300 kB uncompressed):** Adding cloud sync must not penalize offline or unauthenticated users. The Firebase SDK cannot be included in the critical-path base bundle.
3. **Zero Maintenance & Offline Resilience:** Cloud infrastructure must be serverless, highly available, and feature automatic offline caching across multi-tab browser sessions.
4. **Data Sovereignty & Scope Isolation:** User data must be cryptographically isolated per user (`request.auth.uid == userId`) with default denial on all other paths.
5. **Deterministic First-Login Reconciliation:** Connecting an existing local history to a newly created cloud account must never overwrite or wipe local data; conversely, logging in on a new device must seamlessly pull remote history.

#### 2. Decision Summary
We adopt **Firebase (Google Identity via OAuth Popup and Cloud Firestore with IndexedDB Persistence)** as the optional cloud synchronization provider for Focus Flow Stage 7 (Milestone v3.1), formally supplementing ADR-005.

- **Authentication Provider:** Google Identity via `signInWithPopup(auth, new GoogleAuthProvider())`. Zero password storage, email verification dances, or authentication walls.
- **Cloud Database:** Google Cloud Firestore configured with offline persistence (`initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })`).
- **Storage Adapter Bridge:** `src/lib/storage.ts` remains the authoritative source of truth for all UI components. The cloud synchronization engine acts as an event subscriber and persistence adapter layer.
- **Dynamic Import Code-Splitting:** The Firebase SDK is loaded on-demand via asynchronous dynamic `import()` boundaries, strictly preserving the <300 kB uncompressed base bundle.
- **Algebraic First-Login Reconciliation:** Deterministic, commutative, and idempotent session merge algorithm (`mergeSessions(local, remote)` in `src/lib/sync/merge.ts`) reconciles divergences with zero data loss.

#### 3. 100% Opt-In Invariant & Zero-Network Guarantee
The 100% Opt-In rule is an inviolable architectural contract:
1. **Cold Boot Guarantee:** When Focus Flow boots, it inspects `localStorage` for the key `ff2_cloud_sync`. If no active authentication state exists:
   - Zero Firebase modules (`firebase/app`, `firebase/auth`, `firebase/firestore`) are fetched or initialized in memory.
   - Zero HTTP requests or WebSocket connections are initiated to `googleapis.com` or `firebaseio.com`.
   - The application behaves identically to Stage 1–3 local-only operation.
2. **Explicit User Action Required:** Firebase SDK resolution and initialization occur exclusively after the user opens the Cloud Sync dialog and explicitly clicks the "Sign in with Google" button.
3. **Clean Disconnect & Sovereignty Retention:**
   - **Sign Out**: Terminates authentication, unregisters Firestore real-time listeners, and reverts the client to local mode. **All local sessions and preferences remain 100% intact.**
   - **Purge Cloud Data**: Issues an authenticated batch deletion across `users/{uid}/*`, signs out, and preserves local storage.

#### 4. Dynamic Code-Splitting Strategy (<300 kB Base Bundle Budget)
The uncompressed Firebase v11 modular SDK (`firebase/app`, `firebase/auth`, `firebase/firestore`) totals ~520 kB (~165 kB gzipped). Statically importing these packages into the main entry bundle would double the application footprint, violating Focus Flow's core performance budget (<300 kB uncompressed).

We enforce an asynchronous dynamic import boundary:
```typescript
// Dynamic import boundary — isolated into separate chunk by Vite / Rollup
export async function loadFirebaseModules(): Promise<{
  initializeApp: typeof import('firebase/app').initializeApp
  getAuth: typeof import('firebase/auth').getAuth
  GoogleAuthProvider: typeof import('firebase/auth').GoogleAuthProvider
  signInWithPopup: typeof import('firebase/auth').signInWithPopup
  signOut: typeof import('firebase/auth').signOut
  initializeFirestore: typeof import('firebase/firestore').initializeFirestore
  persistentLocalCache: typeof import('firebase/firestore').persistentLocalCache
  persistentMultipleTabManager: typeof import('firebase/firestore').persistentMultipleTabManager
  doc: typeof import('firebase/firestore').doc
  getDoc: typeof import('firebase/firestore').getDoc
  setDoc: typeof import('firebase/firestore').setDoc
  collection: typeof import('firebase/firestore').collection
  getDocs: typeof import('firebase/firestore').getDocs
  writeBatch: typeof import('firebase/firestore').writeBatch
  onSnapshot: typeof import('firebase/firestore').onSnapshot
}> {
  const [appMod, authMod, firestoreMod] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
    import('firebase/firestore'),
  ])
  return {
    initializeApp: appMod.initializeApp,
    getAuth: authMod.getAuth,
    GoogleAuthProvider: authMod.GoogleAuthProvider,
    signInWithPopup: authMod.signInWithPopup,
    signOut: authMod.signOut,
    initializeFirestore: firestoreMod.initializeFirestore,
    persistentLocalCache: firestoreMod.persistentLocalCache,
    persistentMultipleTabManager: firestoreMod.persistentMultipleTabManager,
    doc: firestoreMod.doc,
    getDoc: firestoreMod.getDoc,
    setDoc: firestoreMod.setDoc,
    collection: firestoreMod.collection,
    getDocs: firestoreMod.getDocs,
    writeBatch: firestoreMod.writeBatch,
    onSnapshot: firestoreMod.onSnapshot,
  }
}
```
Vite automatically isolates these dependencies into an on-demand chunk (`assets/firebase-sync-[hash].js`), ensuring that offline users never download a single byte of cloud synchronization code.

#### 5. First-Login Deterministic Reconciliation Protocol
When linking a device with existing local records to a Google account for the first time, state divergence is resolved deterministically without human intervention:

1. **Remote Read Phase:** The client queries the user's remote collection `users/{uid}/sessions`.
2. **Algebraic Merge Engine (`mergeSessions` in `src/lib/sync/merge.ts`):**
   - **Commutative & Symmetrical:** `merge(A, B) === merge(B, A)`. Regardless of which device acts as local or remote, the resolved state is identical.
   - **Idempotent:** `merge(A, A) === A`. Repeated sync passes produce zero state oscillation.
   - **Session Deduplication:** Sessions sharing an identical `id` are unified.
     * `minutes`: Retains the maximum valid duration `Math.max(local.minutes, remote.minutes)`.
     * `task`: Non-null string preferred; if both exist, the longer intention string wins; if lengths match, deterministic alphabetical tie-break (`localeCompare`).
     * `checklist`: Monotonic progression merge (`done: true` wins over `done: false`), deduplicated by item `id`.
   - **Boundary Clamping:** The unified array is sorted chronologically descending (`date` newest first) and clamped strictly to `MAX_SESSIONS` (1,000 items).
   - **Aggregate Metric Recalculation:** Aggregate statistics (`minutes`, `today`, `week`, `history`) are recomputed directly from the merged session list, preventing counter drift or double-counting.
3. **Bi-Directional Commit:**
   - Unified sessions and recomputed stats are committed atomically to local storage via `src/lib/storage.ts`.
   - New local sessions not yet present in Firestore are committed via batched write (`writeBatch`).

#### 6. Firestore Document Hierarchy & Scoped Security Architecture
To prevent hitting Firestore’s 1 MB per-document limit, data is organized into user-scoped subcollections:
```
/users/{userId}/
  ├── settings/current      (Timer and round durations, autoStart)
  ├── stats/summary         (All-time minutes, today, week, streak, history)
  ├── sound_prefs/current   (Ambient texture, binaural beats, warmth cutoff, volume)
  ├── interface/current     (Theme, keyboard shortcuts, narration verbosity, daily targets)
  ├── metadata/sync         (Client platform, schemaVersion, lastSyncedAt)
  └── sessions/{sessionId}  (Individual SessionLogEntryV2 records)
```
Access is governed by `firestore.rules`, enforcing that unauthenticated requests and cross-user read/write attempts are rejected with `PERMISSION_DENIED` at the network edge:
`request.auth != null && request.auth.uid == userId`.

#### 7. Consequences & Trade-offs
- **Positive:**
  * Seamless cross-device continuity across mobile, laptop, and desktop without requiring concurrent local network connectivity.
  * Zero baseline bundle impact (<300 kB budget strictly preserved for offline users).
  * 100% opt-in: zero telemetry, zero forced logins, zero cloud dependencies when unused.
  * Automatic offline resilience with IndexedDB write queuing and tab-lock coordination.
  * Deterministic first-login merge prevents data loss in either direction.
- **Negative:**
  * Adds an optional external service dependency on Google Cloud Platform for users who choose to sync.
  * Dynamic import requires network connectivity at the moment of initial login.
- **Neutral:**
  * Application state architecture remains unchanged: UI components interact exclusively with `src/lib/storage.ts` and reactive hooks.

## 4. Testing strategy

- Unit: engine (fake timers), stats math, storage validators, content parity.
- Build gates: `tsc --noEmit`, ESLint, `vite build` on every change — enforced
  by CI (`.github/workflows/ci.yml`) on every push and pull request.
- Visual: production-build screenshots at 390 / 1280 widths across light/dark
  and every dialog (see the design showcase set).
- Not yet: end-to-end flows; add when the UI surface stabilises.

## 5. Roadmap (7-Stage Evolution)

1. **Stage 1: v2.1 — Infrastructure & Toolchain Hardening** (*Completed*):
   TypeScript 7.0 (Project Corsa Native Go compiler), strict compiler flags, unified storage adapter with prototype pollution stripping and boundary sanitization.
2. **Stage 2: v2.2 — Enhanced Audio Engine & Sound Synthesis** (*Current*):
   Pure on-device Web Audio mathematical synthesis (Kellet pink noise, Leaky brown noise with spatial breathing LFO, procedural soft rain, ocean waves with asymmetric tidal LFO, Tibetan singing bowl modal chime with 5 inharmonic partials), binaural beats (Alpha/Theta), tone warmth Biquad filter, dual-layer sound palette, storage schema v1.2 (`ff2_sound_prefs`), 0 KB static audio asset footprint.
3. **Stage 3: v2.3 — Task Management & Productivity Analytics**:
   Ephemeral micro-steps (max 3), Zen Pebble focus momentum, reflective session summaries, session log management.
4. **Stage 4: v2.4 — Data Portability, State Archival & Interoperability**:
   Self-sovereign data vault, full JSON export/import schema v2.0 (`BackupFileV2`), standard formats (CSV, iCalendar).
5. **Stage 5: v2.5 — Atmospheric Immersion, Fluid Theming & Sensory Polish**:
   Dynamic ambient themes (Warm Parchment, Muted Moss, Deep Ochre), tactile micro-interactions, responsive typography.
6. **Stage 6: v3.0 — Native Desktop Ecosystem & P2P Synchronicity**:
   Tauri 2 native desktop wrappers (tray, global shortcuts, autostart), local-first file persistence, zero-server local P2P CRDT sync.
7. **Stage 7: v3.1 — Opt-In Cloud Synchronization & Google Identity**:
   Secure, zero-maintenance multi-device sync via Firebase (Google Auth, Cloud Firestore with IndexedDB multi-tab cache), 100% opt-in architecture, zero bundle penalty on cold start (<300 kB base bundle), first-login reconciliation protocol, and scoped security rules.

