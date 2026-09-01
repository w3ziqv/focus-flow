# Project: Focus Flow v2.1 (Stage 1: Infrastructure & Tooling)

## Architecture
- **Toolchain & Types**: TypeScript 7.0 Native Engine + Node fallback (5.8+), strict mode, `isolatedDeclarations: true`, `verbatimModuleSyntax: true`, `moduleResolution: "bundler"`. Explicit return types on all exported symbols across components, views, and core libs.
- **Persistence Architecture (ADR-003)**: Unification of persistence in `src/lib/storage.ts`. Zero direct `localStorage` calls in domain logic (`src/lib/sessions.ts`) or store modules (`src/lib/soundStore.ts`).
- **Data Boundary & Sanitization**: Schema v1.1 boundary sanitizers in `src/lib/storage.ts` enforcing 1,000-session max history limit, 200-character task string clamping, finite non-negative minutes parsing, prototype pollution key stripping, and malformed JSON resilience.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Package Version & Fallback Script | Bump `package.json` to `"2.1.0"`, add `"typecheck:node"` fallback script | M1 | ADR-001 / Section 3.1.1 |
| 2 | TSConfig Isolated Declarations | Configure `tsconfig.json` with `isolatedDeclarations: true`, `declaration: true`, `verbatimModuleSyntax: true` | M1 | ADR-001 / Section 3.1.1 |
| 3 | Explicit Export Types | Annotate explicit return types and parameter/variable types across 25 files (components, views, lib/audio, lib/i18n, lib/storage, vite.config.ts) | M1 | ADR-001 / Section 3.1.2 |
| 4 | Storage Sessions Persistence Adapter | Implement `loadSessions`, `saveSessions`, `addSession`, `MAX_SESSIONS = 1000` with boundary sanitization and prototype pollution stripping in `src/lib/storage.ts` | M2 | ADR-003 / Section 3.1.4 |
| 5 | Sessions Layer LocalStorage Elimination | Eliminate direct `localStorage` in `src/lib/sessions.ts` and route all session persistence through `src/lib/storage.ts` | M2 | ADR-003 / Section 3.1.4 |
| 6 | Storage & Adversarial Test Extension | Add session unit tests in `src/lib/storage.test.ts` and connect `src/lib/roadmap_adversarial.test.ts` to production sanitizers | M3 | ADR-003 / Section 3.3.3 |
| 7 | Full Quality Gates Verification | Verify `npm run test:run`, `npm run typecheck`, `npm run lint`, `npm run build` all pass with exit code 0 | M3 | R3 / Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Compiler & Toolchain Configuration (ADR-001) | `package.json`, `tsconfig.json`, explicit export typing across 25 files | none | DONE |
| 2 | Storage Layer Unification (ADR-003) | `src/lib/storage.ts`, `src/lib/sessions.ts`, `src/lib/soundStore.ts` | M1 | DONE |
| 3 | Test Suite Extension & Quality Gate Verification (R3) | `src/lib/storage.test.ts`, `src/lib/roadmap_adversarial.test.ts`, full verification run | M2 | DONE |

## Interface Contracts
### `src/lib/storage.ts` ↔ `src/lib/sessions.ts`
- `export const MAX_SESSIONS: number = 1000;`
- `export function loadSessions(): SessionLogEntry[]`
- `export function saveSessions(sessions: SessionLogEntry[]): boolean`
- `export function addSession(entry: SessionLogEntry): SessionLogEntry[]`
- `SessionLogEntry` schema validation:
  - `id`: non-empty string
  - `startTime`: valid ISO/date string
  - `durationMinutes`: finite non-negative number (coerced or fallback)
  - `mode`: `'pomodoro' | 'shortBreak' | 'longBreak'`
  - `task`: string clamped to 200 characters
  - `completed`: boolean
  - Prototype pollution: strip `__proto__`, `constructor`, `prototype` keys.

## Code Layout
- `package.json` — Toolchain scripts and version 2.1.0
- `tsconfig.json` — Compiler options (isolatedDeclarations, declaration, verbatimModuleSyntax, strict)
- `vite.config.ts` — Vite config with explicit typing
- `src/lib/storage.ts` — Unified persistence adapter with boundary validation
- `src/lib/sessions.ts` — Pure session formatting utilities re-exporting persistence methods from storage.ts
- `src/lib/soundStore.ts` — Audio store using loadCustomSounds from storage.ts
- `src/lib/storage.test.ts` — Unit tests for storage and sessions persistence
- `src/lib/roadmap_adversarial.test.ts` — Adversarial test suite for boundary and payload fuzzing
- `src/components/*.tsx`, `src/views/*.tsx`, `src/lib/*.ts` — Explicitly typed exports
