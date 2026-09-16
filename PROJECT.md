# Project: Focus Flow Stage 4 (Milestone v2.4) — Data Portability, Integrations & Background Execution

## Architecture
Focus Flow operates with 100% client-side data sovereignty, zero mandatory server dependencies, and unthrottled background execution.
Stage 4 introduces:
1. **Multi-Format Serializers (`src/lib/export.ts`)**: Pure transformation functions converting `SessionLogEntryV2[]` into RFC 5545 iCalendar (`.ics`), RFC 4180 CSV with UTF-8 BOM (`\uFEFF`), and GitHub-Flavored Markdown (`.md`) tables with daily summaries. Accompanied by zero-network client-side Blob download trigger (`src/lib/download.ts`).
2. **Data Portability & Schema v2 (`src/lib/dataPort.ts`)**: Upgrades backup format to `BackupFileV2`, capturing complete user state (settings, stats v2, sessions with micro-steps, presets, sounds, language, theme, volume, interface preferences). Provides non-destructive migration for Schema v1 backups and strict schema validation.
3. **Client-Side Webhook Trigger (`src/lib/webhook.ts`)**: Opt-in direct HTTP POST dispatch on timer lifecycle events (`start`, `complete`, `pause`) with 5s timeout, silent non-blocking error handling, and manual test trigger.
4. **Web Worker Ticker & Cold-Start Wake Reconciliation (`src/lib/timerWorker.ts`, `src/lib/wakeReconciliation.ts`, `src/lib/timer.ts`)**: Dedicated Web Worker ticker maintaining 250ms ticks across inactive browser tabs with fallback to `window.setInterval` in headless/JSDOM environments. Pure reconciliation engine detecting elapsed sessions upon waking from device sleep/lid close, crediting stats and session logs, advancing rounds, and notifying the user.
5. **UI & Settings Management (`src/components/AppSettingsModal.tsx`, `src/lib/translations.ts`)**: One-click export buttons, backup file picker with confirmation feedback, webhook configuration controls, and 100% Polish/English translation symmetry adhering to warm paper / soot dark editorial design tokens.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | RFC 5545 iCalendar Serializer | Serializes focus sessions to RFC 5545 `.ics` with accurate UTC timestamps (DTSTART/DTEND), task name, micro-steps in description, STATUS:CONFIRMED, TRANSP:OPAQUE, CATEGORIES | M1 | ROADMAP § 3.4.3.1 |
| F2 | RFC 4180 CSV with UTF-8 BOM | Serializes sessions to RFC 4180 `.csv` with `\uFEFF` prefix, 8 headers, proper quoting of commas, quotes, and newlines | M1 | ROADMAP § 3.4.3.2 |
| F3 | GFM Markdown Table Serializer | Serializes sessions to GitHub-Flavored Markdown table with date, time, duration, task, checklist ratio, and daily summaries | M1 | ROADMAP § 3.4.3.3 |
| F4 | Client-Side Download Trigger | Triggers instant browser Blob download via ephemeral anchor without external network requests | M1 | ROADMAP § 3.4.3 |
| F5 | Backup Schema v2 (`BackupFileV2`) | Exports full snapshot capturing settings, stats v2, sessions with micro-steps, presets, sounds, lang, theme, volume, interface preferences | M2 | ROADMAP § 3.4.3.4 |
| F6 | Schema v1 to v2 Non-Destructive Migration | Imports and migrates Schema v1 backups safely with default values, without data loss or exceptions | M2 | ROADMAP § 3.4.3.4 |
| F7 | Strict Schema Validation | Validates backup JSON structure and sanitizes entries; safely rejects corrupt or malicious payloads with informative errors | M2 | ORIGINAL_REQUEST R2 |
| F8 | Webhook Configuration Storage | Stores webhook URL and enabled flag in storage layer with boundary sanitization | M3 | ROADMAP § 3.4.2.2 |
| F9 | Direct Lifecycle Webhook Dispatch | Sends direct HTTP POST JSON payloads from browser on timer start, complete, and pause | M3 | ROADMAP § 3.4.2.2 |
| F10 | Non-Blocking Silent Webhook Errors | Dispatches fire-and-forget with 5s timeout, silently suppressing network/CORS errors without disrupting timer | M3 | ORIGINAL_REQUEST R3 |
| F11 | Interactive Webhook Test Trigger | UI-accessible diagnostic trigger sending test payload and reporting success/error status | M3 | ORIGINAL_REQUEST R5 |
| F12 | Web Worker 250ms Ticker Heartbeat | Dedicated Web Worker maintaining unthrottled 250ms ticks for inactive/background tabs, with JSDOM fallback | M4 | ROADMAP § 3.4.3.5 |
| F13 | Pure Wake Reconciliation Engine | Evaluates elapsed sessions when `snapshot.running && snapshot.endTs <= Date.now()`, atomically crediting stats and session log | M4 | ROADMAP § 3.4.3.5 |
| F14 | Timer Engine Wake Integration | Multi-trigger wake detection (boot mount, visibilitychange, focus/pageshow, ticker drift) updating timer state | M4 | ROADMAP § 3.4.3.5 |
| F15 | Tranquil In-App Wake Notification | Emits gentle in-app notification announcement when a focus session completed while away | M4 | ROADMAP § 3.4.3.5 |
| F16 | UI Export Action Controls | One-click export buttons (Markdown, CSV, iCal, Backup JSON) in AppSettingsModal Data section | M5 | ROADMAP § 3.4.2.1 |
| F17 | UI Backup File Picker & Feedback | File picker for JSON backup import with confirmation status, error toasts, and state refresh | M5 | ROADMAP § 3.4.2.1 |
| F18 | UI Webhook Settings Panel | Webhook URL input, toggle switch, and test button with editorial design tokens and 44x44px touch targets | M5 | ROADMAP § 3.4.2.2 |
| F19 | Bilingual Translation Symmetry | 100% key and content symmetry between Polish (`pl`) and English (`en`) for all Stage 4 terms | M5 | content.test.ts |
| F20 | E2E Opaque-Box Test Verification | Full opaque-box test suite covering Tiers 1-4 for all Stage 4 features | M6 | ORIGINAL_REQUEST § Quality Gates |
| F21 | Adversarial Hardening & Forensic Audit | White-box stress tests, boundary conditions, and binary forensic audit verification | M6 | Project Pattern |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Multi-Format Session Export Serializers | F1, F2, F3, F4 | none | DONE |
| M2 | Backup & Restore Schema v2 | F5, F6, F7 | none | DONE |
| M3 | Direct Client-Side Webhook Trigger | F8, F9, F10, F11 | none | DONE |
| M4 | Web Worker Heartbeat & Wake Reconciliation | F12, F13, F14, F15 | none | DONE |
| M5 | UI Integration & Bilingual Settings | F16, F17, F18, F19 | M1, M2, M3 | DONE |
| M6 | E2E Verification & Adversarial Hardening | F20, F21 | M1, M2, M3, M4, M5 | DONE |

## Interface Contracts

### `src/lib/export.ts` ↔ Downstream Importers / UI
```typescript
export function serializeToICal(sessions: SessionLogEntryV2[]): string
export function serializeToCsv(sessions: SessionLogEntryV2[]): string
export function serializeToMarkdown(sessions: SessionLogEntryV2[]): string
```

### `src/lib/download.ts` ↔ UI
```typescript
export function triggerDownload(filename: string, content: string | Blob, mimeType: string): void
```

### `src/lib/dataPort.ts` ↔ Storage / UI
```typescript
export interface BackupFileV2 {
  app: 'focus-flow'
  version: 2
  exportedAt: string
  data: {
    settings: Settings
    stats: StatsV2
    sessions: SessionLogEntryV2[]
    presets: TaskPreset[]
    sounds: BackupSound[]
    lang: Lang
    theme: Theme
    volume: number
    interface: InterfacePrefs
  }
}

export type BackupFileAny = BackupFile | BackupFileV2

export function exportData(): BackupFileV2
export function exportDataString(): string
export function importData(raw: string): { success: boolean; error?: string; count?: number }
export function isBackupFile(val: unknown): val is BackupFileAny
```

### `src/lib/webhook.ts` ↔ Timer Engine / UI
```typescript
export interface WebhookSettings {
  url: string
  enabled: boolean
}

export interface WebhookPayload {
  event: 'start' | 'complete' | 'pause'
  timestamp: string
  app: 'focus-flow'
  version: '2.4'
  session: {
    id: string
    mode: TimerMode
    durationMinutes: number
    task: string | null
    checklist?: ChecklistItem[]
  }
}

export function dispatchWebhook(settings: WebhookSettings, payload: WebhookPayload): Promise<boolean>
export function testWebhook(url: string): Promise<{ success: boolean; status?: number; error?: string }>
```

### `src/lib/timerWorker.ts` & `src/lib/wakeReconciliation.ts` ↔ `src/lib/timer.ts`
```typescript
// Worker factory
export function createTimerTicker(onTick: () => void): { start: () => void; stop: () => void }

// Wake reconciliation
export interface WakeReconciliationResult {
  reconciled: boolean
  messageKey?: 'wakeReconciled'
  elapsedMinutes?: number
}

export function reconcileExpiredSession(
  snapshot: SessionSnapshotV2 | null,
  settings: Settings,
  stats: StatsV2
): {
  newSnapshot: SessionSnapshotV2 | null
  newStats: StatsV2
  result: WakeReconciliationResult
}
```

## Code Layout
- `src/types.ts`: Core type definitions (`BackupFileV2`, `WebhookSettings`, `WebhookPayload`).
- `src/lib/export.ts`: Serializers for iCal, CSV, and Markdown.
- `src/lib/download.ts`: Client-side Blob download trigger helper.
- `src/lib/dataPort.ts`: Schema v2 backup exporter, Schema v1 migrator, payload validator.
- `src/lib/webhook.ts`: Webhook dispatcher and test trigger.
- `src/lib/timerWorker.ts`: Web Worker 250ms unthrottled ticker.
- `src/lib/wakeReconciliation.ts`: Pure cold-start wake reconciliation logic.
- `src/lib/timer.ts`: Timer engine integration with worker ticker and wake reconciliation.
- `src/lib/storage.ts`: Webhook settings storage helpers and boundary validation.
- `src/components/AppSettingsModal.tsx`: Export buttons, backup file picker, and webhook settings.
- `src/lib/translations.ts`: Polish and English translation strings.
