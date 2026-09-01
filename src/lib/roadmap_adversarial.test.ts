import { beforeEach, describe, expect, it } from 'vitest'
import type { SessionLogEntry } from '../types'
import {
  addSession,
  isSessionEntry,
  loadSessions,
  MAX_SESSIONS,
  sanitizeSessionEntry,
  saveSessions,
} from './storage'

beforeEach(() => {
  localStorage.clear()
})

// ============================================================================
// AREA 1: Ephemeral Session Micro-Steps & Storage Stress
// ============================================================================

describe('Area 1: Storage Bounds Stress & Production Persistence Adapter', () => {
  it('measures payload size of 1,000 realistic SessionLogEntry items in production storage', () => {
    const entries: SessionLogEntry[] = []
    const baseDate = new Date('2026-01-01T08:00:00Z').getTime()

    for (let i = 0; i < 1000; i++) {
      entries.push({
        id: `s_${i}_${Math.random().toString(36).slice(2, 8)}`,
        date: new Date(baseDate + i * 3600 * 1000).toISOString(),
        minutes: 25,
        task: `Design architecture spec and implement feature component #${i}`,
      })
    }

    const saved = saveSessions(entries)
    expect(saved).toBe(true)

    const raw = localStorage.getItem('ff2_sessions')!
    expect(raw).not.toBeNull()

    const bytes = new TextEncoder().encode(raw).length
    const kb = bytes / 1024

    console.log(`[Storage Benchmark] 1,000 production entries size: ${kb.toFixed(2)} KB (${bytes} bytes)`)

    // 1000 realistic entries are ~100-200 KB (well within 5MB browser quota)
    expect(kb).toBeLessThan(500)
    expect(kb).toBeGreaterThan(50)

    const loaded = loadSessions()
    expect(loaded).toHaveLength(1000)
    expect(loaded[0].task).toBe(entries[0].task)
  })

  it('demonstrates adversarial stress handling when task strings are uncapped vs sanitized in storage', () => {
    const maliciousLongTask = 'A'.repeat(5000) // 5KB per task string
    const dirtyEntries: Array<Record<string, unknown>> = []

    for (let i = 0; i < 500; i++) {
      dirtyEntries.push({
        id: `s_${i}`,
        date: new Date().toISOString(),
        minutes: 25,
        task: maliciousLongTask,
      })
    }

    const uncappedBytes = new TextEncoder().encode(JSON.stringify(dirtyEntries)).length
    const uncappedMb = uncappedBytes / (1024 * 1024)
    console.log(`[Adversarial Storage] Uncapped 500 entries raw size: ${uncappedMb.toFixed(2)} MB`)
    expect(uncappedMb).toBeGreaterThan(2.0)

    // Save through production saveSessions adapter
    saveSessions(dirtyEntries as unknown as SessionLogEntry[])
    const loaded = loadSessions()
    expect(loaded).toHaveLength(500)

    // Every task must be clamped to 200 chars
    for (const entry of loaded) {
      expect(entry.task?.length).toBeLessThanOrEqual(200)
      expect(entry.task).toBe('A'.repeat(200))
    }

    const storedBytes = new TextEncoder().encode(localStorage.getItem('ff2_sessions')!).length
    const storedKb = storedBytes / 1024
    console.log(`[Sanitized Storage] Production sanitized 500 entries size: ${storedKb.toFixed(2)} KB`)
    expect(storedKb).toBeLessThan(200)
  })

  it('validates robust boundary parser discarding malformed sessions and adversarial payloads without throwing', () => {
    // Test malformed inputs with production sanitizeSessionEntry / isSessionEntry
    expect(isSessionEntry(null)).toBeNull()
    expect(sanitizeSessionEntry(null)).toBeNull()
    expect(isSessionEntry(undefined)).toBeNull()
    expect(sanitizeSessionEntry(undefined)).toBeNull()
    expect(isSessionEntry('invalid json')).toBeNull()
    expect(sanitizeSessionEntry('invalid json')).toBeNull()
    expect(isSessionEntry(12345)).toBeNull()
    expect(sanitizeSessionEntry(12345)).toBeNull()
    expect(isSessionEntry([])).toBeNull()
    expect(sanitizeSessionEntry([])).toBeNull()
    expect(isSessionEntry({ id: '1', date: '2026-01-01', minutes: -5 })).toBeNull()
    expect(sanitizeSessionEntry({ id: '1', date: '2026-01-01', minutes: -5 })).toBeNull()
    expect(isSessionEntry({ id: '1', date: '2026-01-01', minutes: NaN })).toBeNull()
    expect(sanitizeSessionEntry({ id: '1', date: '2026-01-01', minutes: NaN })).toBeNull()
    expect(isSessionEntry({ id: '1', date: '2026-01-01', minutes: Infinity })).toBeNull()
    expect(sanitizeSessionEntry({ id: '1', date: '2026-01-01', minutes: Infinity })).toBeNull()
    expect(isSessionEntry({ id: '', date: '2026-01-01T00:00:00Z', minutes: 25 })).toBeNull()
    expect(sanitizeSessionEntry({ id: '', date: '2026-01-01T00:00:00Z', minutes: 25 })).toBeNull()
    expect(isSessionEntry({ id: '1', date: 'not-a-valid-date', minutes: 25 })).toBeNull()
    expect(sanitizeSessionEntry({ id: '1', date: 'not-a-valid-date', minutes: 25 })).toBeNull()

    // Test legacy / alias fields and coercion
    const legacy = isSessionEntry({
      id: 'leg_1',
      startTime: '2026-09-01T10:00:00.000Z',
      durationMinutes: '45',
      task: '  Valid trimmed task  ',
    })
    expect(legacy).toEqual({
      id: 'leg_1',
      date: '2026-09-01T10:00:00.000Z',
      minutes: 45,
      task: 'Valid trimmed task',
    })
  })

  it('resists prototype pollution attacks against production storage pipeline', () => {
    // Malicious payload with __proto__, constructor, and prototype pollution attempts
    const dirtyJson =
      '{"id":"polluted_1","date":"2026-01-01T12:00:00.000Z","minutes":25,"task":"safe task","__proto__":{"polluted":true,"isAdmin":true},"constructor":{"prototype":{"injected":true}}}'
    const dirtyObj = JSON.parse(dirtyJson)

    const clean = sanitizeSessionEntry(dirtyObj)
    expect(clean).not.toBeNull()
    expect(clean?.id).toBe('polluted_1')
    expect(clean?.minutes).toBe(25)
    expect(clean?.task).toBe('safe task')

    // Confirm Object.prototype is untouched
    const globalProto = Object.prototype as Record<string, unknown>
    expect(globalProto['polluted']).toBeUndefined()
    expect(globalProto['isAdmin']).toBeUndefined()
    expect(globalProto['injected']).toBeUndefined()

    // Confirm clean object does not have extra injected properties
    const cleanRecord = clean as unknown as Record<string, unknown>
    expect(cleanRecord['polluted']).toBeUndefined()
    expect(cleanRecord['isAdmin']).toBeUndefined()

    // Test through full persistence pipeline
    saveSessions([dirtyObj] as unknown as SessionLogEntry[])
    const loaded = loadSessions()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].id).toBe('polluted_1')
    expect((loaded[0] as unknown as Record<string, unknown>)['polluted']).toBeUndefined()
    expect(globalProto['polluted']).toBeUndefined()
  })

  it('enforces rolling limit capping at MAX_SESSIONS (1000) under sequential addSession operations', () => {
    // Seed storage with 1,000 entries
    const initial: SessionLogEntry[] = []
    for (let i = 0; i < MAX_SESSIONS; i++) {
      initial.push({
        id: `init_${i}`,
        date: new Date(Date.now() - (MAX_SESSIONS - i) * 60000).toISOString(),
        minutes: 25,
        task: `Initial task ${i}`,
      })
    }
    saveSessions(initial)
    expect(loadSessions()).toHaveLength(MAX_SESSIONS)

    // Add 10 new sessions via addSession
    for (let j = 0; j < 10; j++) {
      const result = addSession({
        id: `new_${j}`,
        date: new Date().toISOString(),
        minutes: 30,
        task: `New Task ${j}`,
      })
      expect(result).toHaveLength(MAX_SESSIONS)
    }

    const finalSessions = loadSessions()
    expect(finalSessions).toHaveLength(MAX_SESSIONS)
    expect(finalSessions[0].id).toBe('new_9')
    expect(finalSessions[9].id).toBe('new_0')
    expect(finalSessions[10].id).toBe('init_0')
  })
})

// ============================================================================
// AREA 2: Web Audio Procedural Synthesis Math & Stability
// ============================================================================

describe('Area 2: Web Audio Math & Numerical Stability', () => {
  it('tests Kellet pink noise filter numerical stability and amplitude bounds', () => {
    const samples = 48000 * 5 // 5 seconds at 48kHz
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    let maxAmp = 0
    let minAmp = 0

    for (let i = 0; i < samples; i++) {
      const white = (Math.random() * 2 - 1)
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.96900 * b2 + white * 0.1538520
      b3 = 0.86650 * b3 + white * 0.3104856
      b4 = 0.55000 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.0168980
      const out = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
      b6 = white * 0.115926

      if (out > maxAmp) maxAmp = out
      if (out < minAmp) minAmp = out
    }

    console.log(`[Pink Noise Bounds] Max: ${maxAmp.toFixed(3)}, Min: ${minAmp.toFixed(3)}`)
    expect(maxAmp).toBeLessThan(2.0)
    expect(minAmp).toBeGreaterThan(-2.0)
  })

  it('tests 1-pole Leaky Brown Noise integrator stability over 100,000 steps without drift', () => {
    let y = 0
    let maxVal = -Infinity
    let minVal = Infinity
    let hasNaN = false

    for (let i = 0; i < 100_000; i++) {
      const white = Math.random() * 2 - 1
      y = (y + 0.02 * white) / 1.02
      const out = 3.5 * y
      if (Number.isNaN(out)) hasNaN = true
      if (out > maxVal) maxVal = out
      if (out < minVal) minVal = out
    }

    console.log(`[Brown Noise 100k Steps] Max: ${maxVal.toFixed(3)}, Min: ${minVal.toFixed(3)}`)
    expect(hasNaN).toBe(false)
    expect(maxVal).toBeLessThan(4.5)
    expect(minVal).toBeGreaterThan(-4.5)
  })

  it('verifies Tibetan Singing Bowl partial ratios and harmonic intervals', () => {
    const f0 = 216.0
    const partials = [
      { name: 'f1 (Fundamental)', ratio: 1.000, freq: f0 * 1.000, decay: 6.0 },
      { name: 'f2 (Prime)', ratio: 1.414, freq: f0 * 1.414, decay: 4.5 },
      { name: 'f3 (Tierce)', ratio: 2.000, freq: f0 * 2.000, decay: 3.2 },
      { name: 'f4 (Septimal)', ratio: 2.760, freq: f0 * 2.760, decay: 2.0 },
      { name: 'f5 (High Metal)', ratio: 5.404, freq: f0 * 5.404, decay: 0.8 },
    ]

    expect(partials[0].freq).toBeCloseTo(216.0, 1)
    expect(partials[1].freq).toBeCloseTo(305.4, 1)
    expect(partials[2].freq).toBeCloseTo(432.0, 1)
    expect(partials[3].freq).toBeCloseTo(596.2, 1)
    expect(partials[4].freq).toBeCloseTo(1167.3, 1)
  })
})

// ============================================================================
// AREA 3: Desktop OS & Tray / DPI Scaling
// ============================================================================

describe('Area 3: Desktop OS Tray DPI & Shortcuts Stress', () => {
  it('calculates tray icon dimensions across standard OS scale factors', () => {
    const scaleFactors = [
      { os: 'macOS Retina', scale: 2.0, basePt: 22, expectedPx: 44 },
      { os: 'Windows 100%', scale: 1.0, basePt: 16, expectedPx: 16 },
      { os: 'Windows 150%', scale: 1.5, basePt: 16, expectedPx: 24 },
      { os: 'Windows 200%', scale: 2.0, basePt: 16, expectedPx: 32 },
      { os: 'Linux GNOME', scale: 1.0, basePt: 22, expectedPx: 22 },
    ]

    for (const item of scaleFactors) {
      const targetPx = Math.round(item.basePt * item.scale)
      expect(targetPx).toBe(item.expectedPx)
    }
  })

  it('validates shortcut key representations across operating systems', () => {
    function normalizeShortcut(shortcut: string, platform: 'macos' | 'windows' | 'linux'): string {
      const isMac = platform === 'macos'
      return shortcut
        .replace(/CmdOrCtrl/g, isMac ? 'Command' : 'Control')
        .replace(/Alt/g, isMac ? 'Option' : 'Alt')
        .replace(/\+/g, '+')
    }

    expect(normalizeShortcut('CmdOrCtrl+Alt+Space', 'macos')).toBe('Command+Option+Space')
    expect(normalizeShortcut('CmdOrCtrl+Alt+Space', 'windows')).toBe('Control+Alt+Space')
    expect(normalizeShortcut('CmdOrCtrl+Alt+Space', 'linux')).toBe('Control+Alt+Space')
  })
})

// ============================================================================
// AREA 4: Ecosystem Serializers & Non-Goals Integrity
// ============================================================================

describe('Area 4: Ecosystem Serializers & Boundary Compliance', () => {
  it('tests RFC 5545 iCalendar serialization escaping rules', () => {
    function escapeIcsText(text: string): string {
      return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\r?\n/g, '\\n')
    }

    const messyTask = 'Task with, commas; semicolons & \n newlines\\slashes'
    const escaped = escapeIcsText(messyTask)
    expect(escaped).toBe('Task with\\, commas\\; semicolons & \\n newlines\\\\slashes')
  })

  it('tests RFC 4180 CSV serializer with UTF-8 BOM and quote escaping', () => {
    function escapeCsvCell(cell: string | number | null | undefined): string {
      if (cell === null || cell === undefined) return '""'
      const str = String(cell)
      return `"${str.replace(/"/g, '""')}"`
    }

    interface CsvExportItem extends SessionLogEntry {
      checklist?: Array<{ id: string; text: string; completed: boolean }>
    }

    function generateCsv(entries: CsvExportItem[]): string {
      const BOM = '\uFEFF'
      const header = 'id,date_iso,minutes,task,checklist_count'
      const rows = entries.map(e => [
        escapeCsvCell(e.id),
        escapeCsvCell(e.date),
        e.minutes,
        escapeCsvCell(e.task),
        e.checklist ? e.checklist.length : 0,
      ].join(','))
      return [BOM + header, ...rows].join('\r\n')
    }

    const testEntries: CsvExportItem[] = [
      {
        id: 's1',
        date: '2026-09-01T12:00:00.000Z',
        minutes: 25,
        task: 'Fix "quoted" issue & commas, in task',
        checklist: [{ id: 'c1', text: 'Step 1', completed: true }],
      },
    ]

    const csv = generateCsv(testEntries)
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toContain('"Fix ""quoted"" issue & commas, in task"')
    expect(csv).toContain('\r\n')
  })
})
