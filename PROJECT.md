# Project: Focus Flow Milestone v2.3 — Task Management & Productivity Analytics

## Architecture
Focus Flow is an **Intention Anchor**, not an issue tracker. A session task exists solely to tether the user's mind to a single commitment for the next 25–50 minutes. Milestone v2.3 introduces ephemeral micro-steps, in-place session log management with atomic metric consistency, a concentric hairline daily goal ring, Zen pebble milestone seals, a 30-day activity mosaic, and an offscreen client-side Canvas summary card generator—all adhering to calm, uncoercive Zen habits without toxic gamification.

The milestone architecture is decomposed into 4 layers:
1. **Storage Schema v1.3 & Consistency Engine (`src/types.ts`, `src/lib/storage.ts`, `src/lib/stats.ts`)**:
   - Extended schemas: `ChecklistItem`, `TaskPreset`, `SessionLogEntryV2`, `SessionSnapshotV2`, `GoalSettings`, `MilestoneRecord`, `StatsV2`.
   - Boundary sanitization: 1,000 session cap, 200-char task clamp, 140-char micro-step clamp, prototype pollution defense (`__proto__`, `constructor`), malformed JSON resilience.
   - Atomic decrement operations in `stats.ts`: deleting a session atomically decrements `stats.minutes`, `stats.today` (if today), `stats.week` (if current week), and `stats.history[dayKey]` without metric drift or orphaned aggregates.
   - Deterministic milestone evaluation: unlocks 5 Zen seals (*The First Step*, *Pebble of Rhythm*, *Stone of Stillness*, *Garden of Flow*, *Century of Craft*) idempotently.
2. **Tier 1 & Tier 2 Sanctuary Integration (`TaskField`, `Dial`, `TimerSettingsModal`, `timer.ts`, `audio.ts`)**:
   - `TaskField`: 5 single-tap intention chips (*Deep Work*, *Writing*, *Code Review*, *Reading*, *Inbox Zero*); up to 3 ephemeral micro-steps with 14px check circles and 120ms strikethrough transition.
   - Ephemeral lifecycle: micro-steps attach strictly to the active session. On completion, items are captured into `SessionLogEntryV2`, but uncompleted items do not carry forward as backlog debt.
   - `Dial`: Concentric hairline outer ring ($r = 175$px, strokeWidth 1.5px, viewBox 360×360) smoothly filling via SVG `stroke-dashoffset` toward `dailyTargetMinutes` (0–720 min).
   - Calm celebration: on reaching goal, a 3-second dial-center checkmark appears with a gentle Tibetan singing bowl chime (`audio.playChime()`). Zero confetti, zero modals.
   - `TimerSettingsModal`: `GoalSettings` controls (`enabled` switch + target minutes stepper).
3. **Tier 3 Productivity Analytics & Visualizations (`StatsView`, `ZenMilestones`, `SearchFilterWell`)**:
   - Sunken search well with real-time substring filtering across task titles and dates.
   - Inline task title editing (`Enter` commits, `Esc` cancels, blur commits, 200-char clamp).
   - Session deletion with instant local state & parent state atomic synchronization.
   - Zen Pebble Milestone Seals: 5 minimalist vector ink stamps with overline unlock dates when earned; faint dotted outlines when unearned.
   - Rolling 30-day activity mosaic with terracotta tonal shifts (0 to 4 blocks).
4. **Client-Side Canvas Summary Card Generator (`src/lib/cardExport.ts`, `ExportCardModal`)**:
   - Offscreen 1200×630 HTML5 canvas (`devicePixelRatio: 2` for crisp Retina display).
   - `@fontsource-variable/fraunces` serif typography, warm parchment (`#F5F4ED`), 3% procedural film grain tile.
   - Renders total focus hours, weekly 7-day mini-chart, top intentions, and serene footer.
   - Instant client-side PNG download (`URL.createObjectURL(blob)`) and clipboard copy (`navigator.clipboard.write`) with zero external network or CDN calls.

## Feature Inventory
| # | Feature | Description | Milestone | Source | Status |
|---|---------|-------------|-----------|--------|--------|
| 1 | Schema v1.3 Type Definitions | `ChecklistItem`, `TaskPreset`, `SessionLogEntryV2`, `GoalSettings`, `MilestoneRecord`, `StatsV2` in `src/types.ts` | M1: Storage & Consistency Engine | ROADMAP §3.3.3, ORIGINAL_REQUEST R6 | DONE |
| 2 | Storage Boundary Sanitization v1.3 | Cap 1000 sessions, clamp task (200 chars), micro-steps (max 3, 140 chars), goals (0-720 min), strip prototype pollution | M1: Storage & Consistency Engine | ROADMAP §3.3.3, ORIGINAL_REQUEST R6 | DONE |
| 3 | Storage Adapters for In-Place Mutation & Goals | `updateSessionTask`, `deleteSession`, `loadGoals`, `saveGoals`, `loadMilestones`, `saveMilestones` in `src/lib/storage.ts` | M1: Storage & Consistency Engine | ROADMAP §3.3.3, ORIGINAL_REQUEST R2, R6 | DONE |
| 4 | Atomic Deletion & Stats Decrement | `decrementStatsForSession`, `deleteSessionWithStats` in `src/lib/stats.ts` atomically updating `minutes`, `today`, `week`, `history` | M1: Storage & Consistency Engine | ROADMAP §3.3.2.3, ORIGINAL_REQUEST R2 | DONE |
| 5 | Deterministic Milestone Evaluation Engine | `evaluateMilestones` in `src/lib/stats.ts` for 5 Zen seals (*The First Step*, *Pebble of Rhythm*, *Stone of Stillness*, *Garden of Flow*, *Century of Craft*) | M1: Storage & Consistency Engine | ROADMAP §3.3.2.5, ORIGINAL_REQUEST R4 | DONE |
| 6 | Storage & Consistency Unit Tests | Exhaustive unit tests in `storage.test.ts` and `stats.test.ts` for v1.3 parsing, limits, prototype pollution, and atomic decrements | M1: Storage & Consistency Engine | ORIGINAL_REQUEST R6 | DONE |
| 7 | Single-Tap Intention Presets | 5 chips (*Deep Work*, *Writing*, *Code Review*, *Reading*, *Inbox Zero*) below empty task input in `TaskField.tsx` | M2: Tier 1 & Tier 2 Sanctuary | ROADMAP §3.3.2.2, ORIGINAL_REQUEST R1 | DONE |
| 8 | Ephemeral Micro-Step Checklist UI | Up to 3 checklist items in `TaskField.tsx` with 14px check circles, 140 chars, 120ms strikethrough | M2: Tier 1 & Tier 2 Sanctuary | ROADMAP §3.3.2.1, ORIGINAL_REQUEST R1 | DONE |
| 9 | Ephemeral Micro-Step Lifecycle & Capture | Micro-steps attached strictly to active session, captured into `SessionLogEntryV2` on completion, reset for next session in `timer.ts` | M2: Tier 1 & Tier 2 Sanctuary | ROADMAP §3.3.2.1, ORIGINAL_REQUEST R1 | DONE |
| 10 | Concentric Hairline Daily Goal Ring | Outer perimeter SVG ring on `Dial.tsx` ($r = 175$px, strokeWidth 1.5px) filling via `stroke-dashoffset` toward target | M2: Tier 1 & Tier 2 Sanctuary | ROADMAP §3.3.2.4, ORIGINAL_REQUEST R3 | DONE |
| 11 | Calm Goal Completion Celebration | 3-second dial-center checkmark indicator + soft singing bowl chime (`audio.playChime()`), zero modal/confetti | M2: Tier 1 & Tier 2 Sanctuary | ROADMAP §3.3.2.4, ORIGINAL_REQUEST R3 | DONE |
| 12 | GoalSettings in Timer Settings | `GoalSettings` controls (enable switch, 15–720 min target stepper) in `TimerSettingsModal.tsx` | M2: Tier 1 & Tier 2 Sanctuary | ROADMAP §3.3.2.4, ORIGINAL_REQUEST R3 | DONE |
| 13 | Sanctuary Bilingual Symmetry | Translations in `translations.ts` for presets, micro-steps, goals, and celebration with 1:1 EN/PL parity | M2: Tier 1 & Tier 2 Sanctuary | ORIGINAL_REQUEST R6 | DONE |
| 14 | Real-Time Search & Date Filter Well | Sunken search bar with substring filtering across task titles and dates in `StatsView.tsx` | M3: Tier 3 Analytics & Card Export | ROADMAP §3.3.2.3, ORIGINAL_REQUEST R2 | DONE |
| 15 | Inline Task Title Editing | Clickable task title in `StatsView.tsx` (`Enter` commits, `Esc` cancels, blur commits, 200 char clamp) | M3: Tier 3 Analytics & Card Export | ROADMAP §3.3.2.3, ORIGINAL_REQUEST R2 | DONE |
| 16 | In-Place Session Deletion UI | Session deletion in `StatsView.tsx` calling `deleteSessionWithStats`, atomically updating view and engine stats | M3: Tier 3 Analytics & Card Export | ROADMAP §3.3.2.3, ORIGINAL_REQUEST R2 | DONE |
| 17 | Zen Pebble Milestone Seals Component | `ZenMilestones.tsx` rendering 5 minimalist vector ink stamps with overline unlock dates | M3: Tier 3 Analytics & Card Export | ROADMAP §3.3.2.5, ORIGINAL_REQUEST R4 | DONE |
| 18 | 30-Day Activity Mosaic Refinement | Paper-toned grid in `StatsView.tsx` with terracotta tonal shifts (0 to 4 focus blocks) | M3: Tier 3 Analytics & Card Export | ROADMAP §3.3.2.6, ORIGINAL_REQUEST R4 | DONE |
| 19 | Client-Side Canvas Summary Card Generator | `src/lib/cardExport.ts` (1200×630, Fraunces serif, `#F5F4ED` parchment, 3% procedural grain, weekly chart, top intentions) | M3: Tier 3 Analytics & Card Export | ROADMAP §3.3.2.7, ORIGINAL_REQUEST R5 | DONE |
| 20 | Instant PNG Download & Clipboard Copy | Direct browser download (`URL.createObjectURL(blob)`) and clipboard copy (`navigator.clipboard.write`) with zero server calls | M3: Tier 3 Analytics & Card Export | ROADMAP §3.3.2.7, ORIGINAL_REQUEST R5 | DONE |
| 21 | Export Card Dialog / Modal UI | UI trigger in `StatsView.tsx` to preview and trigger download / clipboard copy with serene feedback | M3: Tier 3 Analytics & Card Export | ROADMAP §3.3.2.7, ORIGINAL_REQUEST R5 | DONE |
| 22 | Analytics & Card Translations | Bilingual translation keys for search well, inline editing, milestones, card export with 1:1 EN/PL parity | M3: Tier 3 Analytics & Card Export | ORIGINAL_REQUEST R6 | DONE |
| 23 | Comprehensive E2E & Adversarial Tests | Tiers 1-4 functional E2E tests + Tier 5 adversarial coverage hardening for v2.3 features | M4: Final Acceptance & Quality Gates | ORIGINAL_REQUEST Quality Gates | DONE |
| 24 | Full Quality Gates Verification | Exit code 0 on `npm run test:run`, `npm run typecheck`, `npm run lint`, `npm run build` | M4: Final Acceptance & Quality Gates | ORIGINAL_REQUEST Acceptance Criteria | DONE |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Storage Schema v1.3 & Consistency Engine | `src/types.ts`, `src/lib/storage.ts`, `src/lib/stats.ts`, `src/lib/storage.test.ts`, `src/lib/stats.test.ts` | none | DONE |
| 2 | Tier 1 & Tier 2 Sanctuary Integration | `src/components/TaskField.tsx`, `src/components/Dial.tsx`, `src/components/TimerSettingsModal.tsx`, `src/lib/timer.ts`, `src/views/TimerView.tsx`, `src/App.tsx`, `src/lib/translations.ts` | M1 | DONE |
| 3 | Tier 3 Productivity Analytics, Zen Seals & Canvas Card | `src/views/StatsView.tsx`, `src/components/ZenMilestones.tsx`, `src/components/SearchFilterWell.tsx`, `src/lib/cardExport.ts`, `src/lib/cardExport.test.ts`, `src/lib/translations.ts` | M1, M2 | DONE |
| 4 | Final Verification, Adversarial Hardening & Quality Gates | Complete test suite, typecheck, lint, production build, adversarial audit | M1, M2, M3 | DONE |

## Interface Contracts
### Data Schemas (`src/types.ts`)
```typescript
export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

export interface TaskPreset {
  id: string
  label: string
}

export interface SessionLogEntryV2 {
  id: string
  date: string // ISO-8601 timestamp
  minutes: number
  task: string | null
  checklist?: ChecklistItem[] // Ephemeral micro-steps (max 3, max 140 chars)
}

export type SessionLogEntry = SessionLogEntryV2

export interface SessionSnapshotV2 extends SessionSnapshot {
  checklist?: ChecklistItem[]
}

export interface GoalSettings {
  dailyTargetMinutes: number // 0 = disabled, max 720
  enabled: boolean
}

export interface MilestoneRecord {
  id: string
  unlockedAt: string // ISO-8601 timestamp
  seen: boolean
}

export interface StatsV2 extends Stats {
  goals?: GoalSettings
  milestones?: MilestoneRecord[]
}
```

### Storage Persistence API (`src/lib/storage.ts`)
```typescript
export const MAX_SESSIONS: number = 1000
export function loadSessions(): SessionLogEntryV2[]
export function saveSessions(sessions: SessionLogEntryV2[]): boolean
export function addSession(entry: SessionLogEntryV2): SessionLogEntryV2[]
export function updateSessionTask(id: string, task: string | null): SessionLogEntryV2[]
export function deleteSession(id: string): { sessions: SessionLogEntryV2[]; deleted: SessionLogEntryV2 | null }

export function loadGoals(): GoalSettings
export function saveGoals(goals: GoalSettings): void
export function loadMilestones(): MilestoneRecord[]
export function saveMilestones(milestones: MilestoneRecord[]): void
```

### Statistics & Atomic Decrement API (`src/lib/stats.ts`)
```typescript
export function decrementStatsForSession(stats: StatsV2, session: SessionLogEntryV2): StatsV2
export function deleteSessionWithStats(sessionId: string): {
  sessions: SessionLogEntryV2[]
  stats: StatsV2
  deleted: SessionLogEntryV2 | null
}

export const ZEN_MILESTONES = [
  'the_first_step',
  'pebble_of_rhythm',
  'stone_of_stillness',
  'garden_of_flow',
  'century_of_craft',
] as const

export type ZenMilestoneId = typeof ZEN_MILESTONES[number]

export function evaluateMilestones(
  current: MilestoneRecord[] | undefined,
  stats: StatsV2,
  sessions: SessionLogEntryV2[],
): MilestoneRecord[]
```

### Canvas Card Generator API (`src/lib/cardExport.ts`)
```typescript
export interface WeeklyCardData {
  lang: 'pl' | 'en'
  totalMinutes: number
  chartDays: { label: string; minutes: number; isToday: boolean }[]
  topTasks: { name: string; minutes: number; percentage: number }[]
  activeDaysCount: number
  dateRangeLabel: string
}

export async function generateWeeklyCardBlob(data: WeeklyCardData): Promise<Blob>
export async function downloadWeeklyCard(data: WeeklyCardData): Promise<void>
export async function copyWeeklyCardToClipboard(data: WeeklyCardData): Promise<boolean>
```

## Code Layout & File Ownership
- `src/types.ts`: Core data structures and interfaces (M1).
- `src/lib/storage.ts`: Persistence adapters and schema v1.3 boundary sanitization (M1).
- `src/lib/stats.ts`: Statistics recalculation, atomic session deletion decrement, and milestone evaluation (M1).
- `src/lib/storage.test.ts`: Storage unit tests for session and goal boundary conditions (M1).
- `src/lib/stats.test.ts`: Unit tests for atomic consistency and milestone evaluations (M1).
- `src/components/TaskField.tsx`: Micro-steps checklist and intention preset chips (M2).
- `src/components/Dial.tsx`: Concentric hairline daily goal ring and 3-second checkmark indicator (M2).
- `src/components/TimerSettingsModal.tsx`: GoalSettings controls (M2).
- `src/lib/timer.ts`: Micro-step session capture & reset, goal threshold check (M2).
- `src/views/TimerView.tsx` & `src/App.tsx`: Sanctuary state wiring, goal celebration trigger (M2).
- `src/views/StatsView.tsx`: Real-time search/filter well, inline editing, in-place deletion, 30-day mosaic (M3).
- `src/components/ZenMilestones.tsx`: Minimalist vector ink stamps component (M3).
- `src/components/SearchFilterWell.tsx`: Sunken search bar and date filter well (M3).
- `src/lib/cardExport.ts`: Client-side offscreen canvas weekly summary card generator (M3).
- `src/lib/cardExport.test.ts`: Unit tests for canvas card generator (mocking 2D context) (M3).
- `src/components/ExportCardModal.tsx`: Modal / dialog for exporting weekly card (M3).
- `src/lib/translations.ts` & `src/lib/content.test.ts`: Bilingual translation keys and 1:1 symmetry tests (M2, M3).
- `src/lib/roadmap_adversarial.test.ts`: Adversarial test suite covering fuzzing, quotas, and boundaries (M4).
