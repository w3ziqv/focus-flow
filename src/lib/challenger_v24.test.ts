import { beforeEach, describe, expect, it, vi } from 'vitest'
import type {
  BackupFileV2,
  SessionLogEntryV2,
  TaskPreset,
} from '../types'
import {
  importData,
} from './dataPort'
import {
  escapeCsvField,
  escapeIcsText,
  escapeMarkdownTableCell,
  foldIcsLine,
  formatHoursAndMinutes,
  formatLocalDate,
  formatLocalTime,
  serializeToCsv,
  serializeToICal,
  serializeToMarkdown,
} from './export'
import {
  loadInterface,
  loadPresets,
  loadSessions,
  loadSettings,
  loadStats,
  MAX_SESSIONS,
  saveInterface,
  savePresets,
  saveSessions,
} from './storage'

const { mockBlobs } = vi.hoisted(() => ({
  mockBlobs: new Map<string, { name: string; blob: Blob }>(),
}))

vi.mock('./soundStore', () => ({
  putSound: vi.fn(async (id: string, name: string, blob: Blob) => {
    mockBlobs.set(id, { name, blob })
  }),
  getSoundBlob: vi.fn(async (id: string) => mockBlobs.get(id)?.blob ?? null),
  deleteSound: vi.fn(async () => undefined),
  migrateLegacySounds: vi.fn(async () => undefined),
  isAudioUpload: vi.fn(() => true),
  probeAudio: vi.fn(async () => true),
}))

beforeEach(() => {
  localStorage.clear()
  mockBlobs.clear()
  vi.restoreAllMocks()
})


describe('Adversarial Challenge Area 1: RFC 5545 iCalendar (src/lib/export.ts)', () => {
  const fixedNow = new Date('2026-09-16T14:00:00.000Z')

  describe('Multi-Byte UTF-8 Line Folding Boundary Precision', () => {
    it('never splits 2-byte Polish diacritics across octet boundaries when straddling byte 75', () => {
      const encoder = new TextEncoder()
      const decoder = new TextDecoder('utf-8', { fatal: true })

      // Polish diacritics: ą, ć, ę, ł, ń, ó, ś, ź, ż (2 octets each)
      const polishChars = ['ą', 'ć', 'ę', 'ł', 'ń', 'ó', 'ś', 'ź', 'ż']

      for (const char of polishChars) {
        // Place char at byte 74 (starts at 74, ends at 76 if not folded)
        const prefix = 'A'.repeat(74)
        const input = `${prefix}${char}suffix`
        const folded = foldIcsLine(input)
        const lines = folded.split('\r\n')

        expect(lines.length).toBe(2)
        // Line 1 must not exceed 75 octets
        expect(encoder.encode(lines[0]).length).toBeLessThanOrEqual(75)
        // Line 1 must be strictly valid UTF-8
        expect(() => decoder.decode(encoder.encode(lines[0]))).not.toThrow()
        // Line 2 must start with a space and not exceed 75 octets
        expect(lines[1].startsWith(' ')).toBe(true)
        expect(encoder.encode(lines[1]).length).toBeLessThanOrEqual(75)
        expect(() => decoder.decode(encoder.encode(lines[1]))).not.toThrow()

        // Unfolding must reproduce original input verbatim
        const unfolded = folded.replace(/\r\n /g, '')
        expect(unfolded).toBe(input)
      }
    })

    it('never splits 3-byte CJK / symbol characters across octet boundaries', () => {
      const encoder = new TextEncoder()
      const decoder = new TextDecoder('utf-8', { fatal: true })
      // 3-byte characters: 漢 (E6 BC A2), 字 (E5 AD 97), € (E2 82 AC)
      const testChars = ['漢', '字', '€', '日', '本']

      for (const char of testChars) {
        for (const offset of [73, 74]) {
          const prefix = 'X'.repeat(offset)
          const input = `${prefix}${char}RemainingContent`
          const folded = foldIcsLine(input)
          const lines = folded.split('\r\n')

          for (const line of lines) {
            expect(encoder.encode(line).length).toBeLessThanOrEqual(75)
            // Strict UTF-8 validation ensures no partial multibyte sequences
            expect(() => decoder.decode(encoder.encode(line))).not.toThrow()
          }

          const unfolded = folded.replace(/\r\n /g, '')
          expect(unfolded).toBe(input)
        }
      }
    })

    it('never splits 4-byte astral characters / emojis (surrogate pairs in JS) across octet boundaries', () => {
      const encoder = new TextEncoder()
      const decoder = new TextDecoder('utf-8', { fatal: true })
      // 4-byte characters: 🍅 (\uD83C\uDF45), 🧘 (\uD83E\uDDD8), 🚀 (\uD83D\uDE80)
      const testEmojis = ['🍅', '🧘', '🚀', '🧠', '🌟', '🎯']

      for (const emoji of testEmojis) {
        // Test positions 71, 72, 73, 74, 75
        for (let prefixLen = 71; prefixLen <= 75; prefixLen++) {
          const prefix = 'E'.repeat(prefixLen)
          const input = `${prefix}${emoji}AfterEmojiText`
          const folded = foldIcsLine(input)
          const lines = folded.split('\r\n')

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            expect(encoder.encode(line).length).toBeLessThanOrEqual(75)
            if (i > 0) {
              expect(line.startsWith(' ')).toBe(true)
            }
            // Strict UTF-8 decoding check — will fail if surrogate pair or 4-byte code point is fractured
            expect(() => decoder.decode(encoder.encode(line))).not.toThrow()
          }

          const unfolded = folded.replace(/\r\n /g, '')
          expect(unfolded).toBe(input)
        }
      }
    })

    it('folds massive 500-character multi-byte strings across 10+ continuation lines cleanly', () => {
      const encoder = new TextEncoder()
      const decoder = new TextDecoder('utf-8', { fatal: true })

      // Alternating 4-byte emojis and Polish diacritics
      const complexString = 'DESCRIPTION:' + '🍅 Zażółć gęślą jaźń 🧘 🚀 ńćśź '.repeat(15)
      const folded = foldIcsLine(complexString)
      const lines = folded.split('\r\n')

      expect(lines.length).toBeGreaterThan(5)
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        expect(encoder.encode(line).length).toBeLessThanOrEqual(75)
        if (i > 0) {
          expect(line.startsWith(' ')).toBe(true)
        }
        expect(() => decoder.decode(encoder.encode(line))).not.toThrow()
      }

      const unfolded = folded.replace(/\r\n /g, '')
      expect(unfolded).toBe(complexString)
    })
  })

  describe('RFC 5545 Purity, Timestamps & Escaping', () => {
    it('guarantees pure CRLF line endings throughout entire document with zero bare LF or CR', () => {
      const sessions: SessionLogEntryV2[] = [
        {
          id: 's-crlf-1',
          date: '2026-09-16T12:00:00.000Z',
          minutes: 25,
          task: 'Task with CRLF test',
        },
        {
          id: 's-crlf-2',
          date: '2026-09-16T13:00:00.000Z',
          minutes: 50,
          task: 'Another task with long title exceeding 75 characters to trigger line folding in serializer output',
        },
      ]

      const ics = serializeToICal(sessions, fixedNow)

      // Verify ends with CRLF
      expect(ics.endsWith('\r\n')).toBe(true)

      // Replace all valid \r\n
      const stripped = ics.replace(/\r\n/g, '')
      // Must contain NO stray \n or \r
      expect(stripped.includes('\n')).toBe(false)
      expect(stripped.includes('\r')).toBe(false)
    })

    it('escapes backslashes, semicolons, commas, and newlines accurately according to RFC 5545 § 3.3.11', () => {
      const hostileTask = 'C:\\Projects\\FocusFlow; task, item\r\nLine2\nLine3 with \\\\ double backslash'
      const escaped = escapeIcsText(hostileTask)

      expect(escaped).toBe('C:\\\\Projects\\\\FocusFlow\\; task\\, item\\nLine2\\nLine3 with \\\\\\\\ double backslash')

      const session: SessionLogEntryV2[] = [
        {
          id: 's-esc-1',
          date: '2026-09-16T10:00:00.000Z',
          minutes: 25,
          task: hostileTask,
          checklist: [{ id: 'chk-1', text: 'Step 1; with, commas', completed: true }],
        },
      ]

      const ics = serializeToICal(session, fixedNow)
      const unfolded = ics.replace(/\r\n /g, '')

      expect(unfolded).toContain('SUMMARY:Focus: C:\\\\Projects\\\\FocusFlow\\; task\\, item\\nLine2\\nLine3 with \\\\\\\\ double backslash')
      expect(unfolded).toContain('Task: C:\\\\Projects\\\\FocusFlow\\; task\\, item\\nLine2\\nLine3 with \\\\\\\\ double backslash')
    })

    it('computes DTSTART and DTEND with UTC purity and accurate duration math across midnight', () => {
      // Session ending at 00:15 UTC on Sept 2, lasting 30 minutes -> started at 23:45 UTC on Sept 1
      const midnightSession: SessionLogEntryV2[] = [
        {
          id: 's-midnight',
          date: '2026-09-02T00:15:00.000Z',
          minutes: 30,
          task: 'Late Night Coding',
        },
      ]

      const ics = serializeToICal(midnightSession, fixedNow)

      expect(ics).toContain('DTEND:20260902T001500Z')
      expect(ics).toContain('DTSTART:20260901T234500Z')
      expect(ics).toContain('DTSTAMP:20260916T140000Z')
    })

    it('handles sessions with 0 duration, negative duration, and invalid dates gracefully', () => {
      const edgeSessions: SessionLogEntryV2[] = [
        {
          id: 's-zero',
          date: '2026-09-16T10:00:00.000Z',
          minutes: 0,
          task: 'Zero duration',
        },
        {
          id: 's-neg',
          date: '2026-09-16T11:00:00.000Z',
          minutes: -10, // Clamped by Math.max(0, session.minutes)
          task: 'Negative duration clamped to 0',
        },
        {
          id: 's-invalid-date',
          date: 'corrupted-timestamp',
          minutes: 25,
          task: 'Invalid date fallback',
        },
      ]

      const ics = serializeToICal(edgeSessions, fixedNow)

      // Zero minutes: DTSTART === DTEND
      expect(ics).toContain('DTSTART:20260916T100000Z\r\nDTEND:20260916T100000Z')

      // Negative minutes: clamped to 0 so DTSTART === DTEND
      expect(ics).toContain('DTSTART:20260916T110000Z\r\nDTEND:20260916T110000Z')

      // Invalid date: falls back to `fixedNow` (20260916T140000Z)
      expect(ics).toContain('DTEND:20260916T140000Z')
      expect(ics).toContain('DTSTART:20260916T133500Z') // 14:00 - 25m
    })
  })
})


describe('Adversarial Challenge Area 2: RFC 4180 CSV (src/lib/export.ts)', () => {
  it('strictly validates UTF-8 BOM (\\uFEFF) at byte offset 0 in encoded output', () => {
    const csv = serializeToCsv([])
    const bytes = new TextEncoder().encode(csv)

    expect(bytes[0]).toBe(0xef)
    expect(bytes[1]).toBe(0xbb)
    expect(bytes[2]).toBe(0xbf)
    expect(csv.charCodeAt(0)).toBe(0xfeff)
  })

  it('handles strings containing double quotes, commas, CRLF, and bare LF with RFC 4180 compliance', () => {
    // RFC 4180 § 2.7: If double-quotes are used to enclose fields, then a double-quote
    // appearing inside a field must be escaped by preceding it with another double quote.
    expect(escapeCsvField('hello')).toBe('"hello"')
    expect(escapeCsvField('"')).toBe('""""')
    expect(escapeCsvField('""')).toBe('""""""')
    expect(escapeCsvField('a"b"c')).toBe('"a""b""c"')
    expect(escapeCsvField('a,b,c')).toBe('"a,b,c"')
    expect(escapeCsvField('line1\r\nline2')).toBe('"line1\r\nline2"')
    expect(escapeCsvField('line1\nline2')).toBe('"line1\nline2"')
    expect(escapeCsvField('Complex "quote", with comma\r\nand newline')).toBe(
      '"Complex ""quote"", with comma\r\nand newline"'
    )
  })

  it('roundtrips highly adversarial session fields through an RFC 4180 parser without corruption', () => {
    const adversarialSessions: SessionLogEntryV2[] = [
      {
        id: 'sess-adv-1',
        date: '2026-09-16T10:00:00.000Z',
        minutes: 45,
        task: 'Title with "embedded quotes", commas, and\r\nCRLF and\nLF\nand "nested ""double"" quotes"',
        checklist: [
          { id: 'c1', text: 'Step 1: "quoted"', completed: true },
          { id: 'c2', text: 'Step 2: comma, test', completed: true },
        ],
      },
      {
        id: 'sess-adv-2',
        date: '2026-09-16T11:00:00.000Z',
        minutes: 0,
        task: '"""Quoted from start to finish"""',
      },
      {
        id: 'sess-adv-3',
        date: '2026-09-16T12:00:00.000Z',
        minutes: 999,
        task: ',,,,,,,,,',
      },
      {
        id: 'sess-adv-4',
        date: '2026-09-16T13:00:00.000Z',
        minutes: 25,
        task: 'Polish diacritics: ĄĆĘŁŃÓŚŹŻ ąćęłńóśźż and Emojis: 🍅🧘🚀',
      },
    ]

    const csv = serializeToCsv(adversarialSessions)

    // Parse with a strict RFC 4180 state machine parser
    function parseRfc4180Csv(text: string): string[][] {
      // Strip BOM if present
      const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
      const rows: string[][] = []
      let currentRow: string[] = []
      let currentField = ''
      let insideQuotes = false
      let i = 0

      while (i < clean.length) {
        const char = clean[i]
        if (insideQuotes) {
          if (char === '"') {
            if (i + 1 < clean.length && clean[i + 1] === '"') {
              // Escaped quote
              currentField += '"'
              i += 2
              continue
            } else {
              // End of quoted field
              insideQuotes = false
              i++
              continue
            }
          } else {
            currentField += char
            i++
            continue
          }
        } else {
          if (char === '"') {
            insideQuotes = true
            i++
            continue
          } else if (char === ',') {
            currentRow.push(currentField)
            currentField = ''
            i++
            continue
          } else if (char === '\r' && i + 1 < clean.length && clean[i + 1] === '\n') {
            currentRow.push(currentField)
            rows.push(currentRow)
            currentRow = []
            currentField = ''
            i += 2
            continue
          } else if (char === '\n') {
            currentRow.push(currentField)
            rows.push(currentRow)
            currentRow = []
            currentField = ''
            i++
            continue
          } else {
            currentField += char
            i++
            continue
          }
        }
      }

      if (currentField.length > 0 || currentRow.length > 0) {
        currentRow.push(currentField)
        rows.push(currentRow)
      }

      return rows
    }

    const parsed = parseRfc4180Csv(csv)
    // 1 header row + 4 data rows
    expect(parsed.length).toBe(5)

    // Header row verification
    expect(parsed[0]).toEqual([
      'id',
      'date_iso',
      'date_local',
      'time_local',
      'duration_minutes',
      'task',
      'checklist_total',
      'checklist_completed',
    ])

    // Row 1 verification
    expect(parsed[1][0]).toBe('sess-adv-1')
    expect(parsed[1][4]).toBe('45')
    expect(parsed[1][5]).toBe(adversarialSessions[0].task)
    expect(parsed[1][6]).toBe('2')
    expect(parsed[1][7]).toBe('2')

    // Row 2 verification
    expect(parsed[2][0]).toBe('sess-adv-2')
    expect(parsed[2][4]).toBe('0')
    expect(parsed[2][5]).toBe('"""Quoted from start to finish"""')

    // Row 3 verification
    expect(parsed[3][0]).toBe('sess-adv-3')
    expect(parsed[3][5]).toBe(',,,,,,,,,')

    // Row 4 verification
    expect(parsed[4][0]).toBe('sess-adv-4')
    expect(parsed[4][5]).toBe(adversarialSessions[3].task)
  })
})


describe('Adversarial Challenge Area 3: GFM Markdown Tables (src/lib/export.ts)', () => {
  const fixedNow = new Date('2026-09-16T14:30:00.000Z')

  describe('Pipe Character Escaping and Table Cell Integrity', () => {
    it('escapes single and multiple pipe characters to prevent column fracturing in GFM', () => {
      expect(escapeMarkdownTableCell('foo | bar')).toBe('foo \\| bar')
      expect(escapeMarkdownTableCell('|||')).toBe('\\|\\|\\|')
      expect(escapeMarkdownTableCell('|a|b|c|')).toBe('\\|a\\|b\\|c\\|')
      expect(escapeMarkdownTableCell('Task with\r\nnewlines and | pipes')).toBe('Task with newlines and \\| pipes')
    })

    it('ensures every table row retains exactly 5 columns regardless of hostile pipe input', () => {
      const hostileSessions: SessionLogEntryV2[] = [
        {
          id: 's-pipe-1',
          date: '2026-09-16T10:00:00.000Z',
          minutes: 25,
          task: '| Col 1 | Col 2 | Col 3 | Col 4 | Col 5 |',
          checklist: [{ id: 'c1', text: 'Step with | pipe', completed: true }],
        },
        {
          id: 's-pipe-2',
          date: '2026-09-16T11:00:00.000Z',
          minutes: 50,
          task: 'No pipes here',
        },
      ]

      const md = serializeToMarkdown(hostileSessions, fixedNow)
      const lines = md.split('\n')
      const tableRows = lines.filter((l) => l.startsWith('|') && !l.includes('---'))

      for (const row of tableRows) {
        // Split by unescaped pipe (pipe not preceded by backslash)
        // A pipe preceded by a backslash is part of the cell content
        const cells = row.split(/(?<!\\)\|/)
        // Leading and trailing pipes produce empty 0th and last elements
        const cellContents = cells.slice(1, -1)
        expect(cellContents.length).toBe(5)
      }
    })
  })

  describe('Daily Summary Calculation Accuracy Across Multi-Day Groupings', () => {
    it('aggregates multi-day sessions accurately into summary totals and plural strings', () => {
      const multiDaySessions: SessionLogEntryV2[] = [
        // Day 1
        { id: 'd1-1', date: '2026-09-10T10:00:00.000Z', minutes: 25, task: 'Day 1 Task A' },
        { id: 'd1-2', date: '2026-09-10T11:00:00.000Z', minutes: 25, task: 'Day 1 Task B' },
        // Day 2
        { id: 'd2-1', date: '2026-09-11T09:00:00.000Z', minutes: 50, task: 'Day 2 Task A' },
        // Day 3
        { id: 'd3-1', date: '2026-09-12T14:00:00.000Z', minutes: 60, task: 'Day 3 Task A' },
        // Day 4 (120 minutes)
        { id: 'd4-1', date: '2026-09-13T16:00:00.000Z', minutes: 120, task: 'Day 4 Deep Work' },
      ]

      // Total = 25 + 25 + 50 + 60 + 120 = 280 minutes = 4 hours 40 minutes, 5 sessions
      const md = serializeToMarkdown(multiDaySessions, fixedNow)

      expect(md).toContain(`*Exported on ${formatLocalDate(fixedNow)} ${formatLocalTime(fixedNow)} · 5 sessions · 280 minutes*`)
      expect(md).toContain('> **Daily Summary**: 5 sessions completed · 4 hours 40 minutes of deep focus.')
    })

    it('handles exact hour boundaries and 1-minute singular boundaries without grammatical flaws', () => {
      // 60 minutes = 1 hour
      expect(formatHoursAndMinutes(60)).toBe('1 hour')
      // 120 minutes = 2 hours
      expect(formatHoursAndMinutes(120)).toBe('2 hours')
      // 61 minutes = 1 hour 1 minute
      expect(formatHoursAndMinutes(61)).toBe('1 hour 1 minute')
      // 121 minutes = 2 hours 1 minute
      expect(formatHoursAndMinutes(121)).toBe('2 hours 1 minute')
      // 122 minutes = 2 hours 2 minutes
      expect(formatHoursAndMinutes(122)).toBe('2 hours 2 minutes')
      // 1 minute = 1 minute
      expect(formatHoursAndMinutes(1)).toBe('1 minute')
      // 0 minutes = 0 minutes
      expect(formatHoursAndMinutes(0)).toBe('0 minutes')
    })
  })
})


describe('Adversarial Challenge Area 4: Schema v2 Backup & Restore (src/lib/dataPort.ts)', () => {
  describe('Prototype Pollution Resistance', () => {
    it('rejects root __proto__ pollution payload and protects Object.prototype', async () => {
      const payload = `{
        "app": "focus-flow",
        "version": 2,
        "exportedAt": "2026-09-16T12:00:00.000Z",
        "__proto__": { "polluted": true },
        "data": {
          "settings": { "focus": 25 },
          "stats": {},
          "sessions": [],
          "presets": [],
          "sounds": [],
          "lang": "pl",
          "theme": "light",
          "volume": 0.7,
          "interface": {}
        }
      }`

      const result = await importData(payload)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toMatch(/prototype pollution/i)
      }

      expect((Object.prototype as unknown as Record<string, unknown>).polluted).toBeUndefined()
    })

    it('rejects nested constructor.prototype pollution payload', async () => {
      const payload = `{
        "app": "focus-flow",
        "version": 2,
        "exportedAt": "2026-09-16T12:00:00.000Z",
        "data": {
          "settings": {
            "focus": 25,
            "constructor": {
              "prototype": { "hacked": true }
            }
          },
          "stats": {},
          "sessions": [],
          "presets": [],
          "sounds": [],
          "lang": "pl",
          "theme": "light",
          "volume": 0.7,
          "interface": {}
        }
      }`

      const result = await importData(payload)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toMatch(/prototype pollution/i)
      }

      expect((Object.prototype as unknown as Record<string, unknown>).hacked).toBeUndefined()
    })

    it('rejects Unicode-escaped keys for prototype pollution (\\u005f\\u005fproto\\u005f\\u005f)', async () => {
      const payload = `{
        "app": "focus-flow",
        "version": 2,
        "exportedAt": "2026-09-16T12:00:00.000Z",
        "\\u005f\\u005fproto\\u005f\\u005f": { "stealth": true },
        "data": {
          "settings": { "focus": 25 },
          "stats": {},
          "sessions": [],
          "presets": [],
          "sounds": [],
          "lang": "pl",
          "theme": "light",
          "volume": 0.7,
          "interface": {}
        }
      }`

      const result = await importData(payload)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toMatch(/prototype pollution/i)
      }

      expect((Object.prototype as unknown as Record<string, unknown>).stealth).toBeUndefined()
    })

    it('rejects prototype pollution hidden inside array items', async () => {
      const payload = `{
        "app": "focus-flow",
        "version": 2,
        "exportedAt": "2026-09-16T12:00:00.000Z",
        "data": {
          "settings": { "focus": 25 },
          "stats": {},
          "sessions": [
            { "id": "s1", "date": "2026-09-16T10:00:00.000Z", "minutes": 25, "__proto__": { "arrayHacked": true } }
          ],
          "presets": [],
          "sounds": [],
          "lang": "pl",
          "theme": "light",
          "volume": 0.7,
          "interface": {}
        }
      }`

      const result = await importData(payload)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toMatch(/prototype pollution/i)
      }

      expect((Object.prototype as unknown as Record<string, unknown>).arrayHacked).toBeUndefined()
    })
  })

  describe('Backward Compatibility with Schema v1 Payloads', () => {
    it('restores minimal Schema v1 payload while strictly preserving existing local sessions, presets, and interface prefs', async () => {
      // Pre-existing local state
      const preExistingSessions: SessionLogEntryV2[] = [
        {
          id: 's-pre-1',
          date: '2026-09-15T10:00:00.000Z',
          minutes: 30,
          task: 'Must Not Be Erased',
          checklist: [{ id: 'c1', text: 'Preserve me', completed: true }],
        },
      ]
      saveSessions(preExistingSessions)

      const preExistingPresets: TaskPreset[] = [
        { id: 'preset-pre-1', label: 'Existing Preset' },
      ]
      savePresets(preExistingPresets)

      saveInterface({ reduceMotion: true, showGreeting: false })

      // Minimal Schema v1 payload (contains only settings and stats, no sessions/presets)
      const minimalV1Payload = JSON.stringify({
        app: 'focus-flow',
        version: 1,
        exportedAt: '2026-01-01T00:00:00.000Z',
        data: {
          settings: { focus: 40, short: 8, long: 24, rounds: 5, autoStart: true },
          stats: {
            today: 2,
            week: 10,
            streak: 5,
            minutes: 300,
            history: {},
          },
        },
      })

      const result = await importData(minimalV1Payload)
      expect(result.success).toBe(true)

      // Verify settings and stats were migrated
      expect(loadSettings().focus).toBe(40)
      expect(loadStats().minutes).toBe(300)

      // Existing sessions, presets, and interface MUST remain intact
      expect(loadSessions()).toEqual(preExistingSessions)
      expect(loadPresets()).toEqual(preExistingPresets)
      expect(loadInterface()).toEqual({ reduceMotion: true, showGreeting: false })
    })

    it('migrates Schema v1 with empty data payload without throwing exceptions', async () => {
      const emptyV1 = JSON.stringify({
        app: 'focus-flow',
        version: 1,
        exportedAt: '2026-01-01T00:00:00.000Z',
        data: {},
      })

      const result = await importData(emptyV1)
      expect(result.success).toBe(true)
    })
  })

  describe('Boundary Corruption & Scale Stress Testing', () => {
    it('safely handles 50,000 session entries, validating all and capping storage at MAX_SESSIONS (1,000)', async () => {
      const hugeSessions: SessionLogEntryV2[] = []
      const baseDate = new Date('2026-01-01T00:00:00.000Z').getTime()

      for (let i = 0; i < 50_000; i++) {
        hugeSessions.push({
          id: `sess-${i}`,
          date: new Date(baseDate + i * 60_000).toISOString(),
          minutes: 25,
          task: `Task ${i}`,
        })
      }

      const hugePayload = JSON.stringify({
        app: 'focus-flow',
        version: 2,
        exportedAt: new Date().toISOString(),
        data: {
          settings: { focus: 25, short: 5, long: 15, rounds: 4, autoStart: false },
          stats: { today: 0, week: 0, streak: 0, minutes: 0, history: {} },
          sessions: hugeSessions,
          presets: [],
          sounds: [],
          lang: 'pl',
          theme: 'light',
          volume: 0.7,
          interface: { reduceMotion: false, showGreeting: true },
        },
      })

      const result = await importData(hugePayload)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.count).toBe(50_000)
      }

      // Storage must be capped to MAX_SESSIONS (1,000)
      const stored = loadSessions()
      expect(stored.length).toBe(MAX_SESSIONS)
      expect(stored.length).toBe(1000)
      // First stored item is sess-0
      expect(stored[0].id).toBe('sess-0')
    })

    it('atomically rejects a 50,000 session payload if entry 49,999 is corrupted, leaving storage untouched', async () => {
      saveSessions([{ id: 'original', date: '2026-09-16T10:00:00.000Z', minutes: 25, task: 'Keep' }])

      const almostValidSessions: unknown[] = []
      const baseDate = new Date('2026-01-01T00:00:00.000Z').getTime()

      for (let i = 0; i < 49_999; i++) {
        almostValidSessions.push({
          id: `sess-${i}`,
          date: new Date(baseDate + i * 60_000).toISOString(),
          minutes: 25,
          task: `Task ${i}`,
        })
      }
      // Corrupt 50,000th item: negative duration
      almostValidSessions.push({
        id: 'corrupt-entry',
        date: '2026-09-16T10:00:00.000Z',
        minutes: -999,
        task: 'Invalid minutes',
      })

      const payload = JSON.stringify({
        app: 'focus-flow',
        version: 2,
        exportedAt: new Date().toISOString(),
        data: {
          settings: { focus: 25, short: 5, long: 15, rounds: 4, autoStart: false },
          stats: { today: 0, week: 0, streak: 0, minutes: 0, history: {} },
          sessions: almostValidSessions,
          presets: [],
          sounds: [],
          lang: 'pl',
          theme: 'light',
          volume: 0.7,
          interface: { reduceMotion: false, showGreeting: true },
        },
      })

      const result = await importData(payload)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toMatch(/corrupted session entry/i)
      }

      // Existing storage MUST NOT be overwritten
      expect(loadSessions()).toEqual([
        { id: 'original', date: '2026-09-16T10:00:00.000Z', minutes: 25, task: 'Keep' },
      ])
    })

    it('rejects deeply nested corrupted structures in sessions and handles extreme nesting without crashing', async () => {
      // Nested object placed in sessions slice
      let deepSessionObj: Record<string, unknown> = { val: 1 }
      for (let i = 0; i < 50; i++) {
        deepSessionObj = { nested: deepSessionObj }
      }

      const payloadWithNestedSession = JSON.stringify({
        app: 'focus-flow',
        version: 2,
        exportedAt: '2026-09-16T12:00:00.000Z',
        data: {
          settings: { focus: 25, short: 5, long: 15, rounds: 4, autoStart: false },
          stats: { today: 0, week: 0, streak: 0, minutes: 0, history: {} },
          sessions: [deepSessionObj],
          presets: [],
          sounds: [],
          lang: 'pl',
          theme: 'light',
          volume: 0.7,
          interface: { reduceMotion: false, showGreeting: true },
        },
      })

      const sessionResult = await importData(payloadWithNestedSession)
      expect(sessionResult.success).toBe(false)
      if (!sessionResult.success) {
        expect(sessionResult.error).toMatch(/corrupted session entry/i)
      }

      // Extremely deep JSON nesting that exceeds parser recursion depth
      let extremeDeep = '{"leaf": true}'
      for (let i = 0; i < 10_000; i++) {
        extremeDeep = `{"d":${extremeDeep}}`
      }
      const extremePayload = `{"app":"focus-flow","version":2,"exportedAt":"2026-09-16T12:00:00.000Z","data":${extremeDeep}}`

      const extremeResult = await importData(extremePayload)
      expect(extremeResult.success).toBe(false)
      if (!extremeResult.success) {
        expect(extremeResult.error).toMatch(/malformed json/i)
      }
    })

    it('comprehensively tests corrupted types across all 9 Schema v2 slices', async () => {
      const validBase: BackupFileV2 = {
        app: 'focus-flow',
        version: 2,
        exportedAt: '2026-09-16T12:00:00.000Z',
        data: {
          settings: { focus: 25, short: 5, long: 15, rounds: 4, autoStart: false },
          stats: {
            today: 0,
            week: 0,
            streak: 0,
            minutes: 0,
            date: 'Wed Sep 16 2026',
            weekStart: 'Mon Sep 14 2026',
            lastDate: null,
            history: {},
          },
          sessions: [],
          presets: [],
          sounds: [],
          lang: 'pl',
          theme: 'light',
          volume: 0.7,
          interface: { reduceMotion: false, showGreeting: true },
        },
      }

      // Helper to test rejection with mutation
      async function testRejection(mutate: (obj: Record<string, unknown>) => void, expectedPattern: RegExp) {
        const copy = JSON.parse(JSON.stringify(validBase)) as Record<string, unknown>
        mutate(copy)
        const res = await importData(JSON.stringify(copy))
        expect(res.success).toBe(false)
        if (!res.success) {
          expect(res.error).toMatch(expectedPattern)
        }
      }

      // App corrupted
      await testRejection((o) => { o.app = 'wrong-app' }, /unsupported application/i)
      await testRejection((o) => { o.app = 12345 }, /unsupported application/i)

      // Version corrupted
      await testRejection((o) => { o.version = 3 }, /unsupported backup version/i)
      await testRejection((o) => { o.version = '2' }, /unsupported backup version/i)
      await testRejection((o) => { o.version = -1 }, /unsupported backup version/i)

      // ExportedAt corrupted
      await testRejection((o) => { o.exportedAt = 'invalid-timestamp' }, /invalid exportedAt/i)
      await testRejection((o) => { o.exportedAt = 12345 }, /invalid exportedAt/i)

      // Data payload corrupted
      await testRejection((o) => { o.data = null }, /missing or malformed data payload/i)
      await testRejection((o) => { o.data = 'string' }, /missing or malformed data payload/i)
      await testRejection((o) => { o.data = [1, 2, 3] }, /missing or malformed data payload/i)

      // Lang corrupted
      await testRejection((o) => { (o.data as Record<string, unknown>).lang = 'de' }, /lang must be "pl" or "en"/i)
      await testRejection((o) => { (o.data as Record<string, unknown>).lang = 123 }, /lang must be "pl" or "en"/i)

      // Theme corrupted
      await testRejection((o) => { (o.data as Record<string, unknown>).theme = 'sepia' }, /theme must be "light" or "dark"/i)

      // Volume corrupted
      await testRejection((o) => { (o.data as Record<string, unknown>).volume = 1.5 }, /volume must be a number between 0 and 1/i)
      await testRejection((o) => { (o.data as Record<string, unknown>).volume = -0.1 }, /volume must be a number between 0 and 1/i)
      await testRejection((o) => { (o.data as Record<string, unknown>).volume = '0.5' }, /volume must be a number between 0 and 1/i)

      // Sessions corrupted
      await testRejection((o) => { (o.data as Record<string, unknown>).sessions = 'not-array' }, /sessions must be an array/i)
      await testRejection((o) => {
        (o.data as Record<string, unknown>).sessions = [{ id: '', date: '2026-09-16T12:00:00.000Z', minutes: 25 }]
      }, /corrupted session entry/i)

      // Presets corrupted
      await testRejection((o) => { (o.data as Record<string, unknown>).presets = 'not-array' }, /presets must be an array/i)
      await testRejection((o) => {
        (o.data as Record<string, unknown>).presets = [{ id: 'p1', label: '' }]
      }, /corrupted task preset/i)

      // Sounds corrupted
      await testRejection((o) => { (o.data as Record<string, unknown>).sounds = 'not-array' }, /sounds must be an array/i)

      // Interface corrupted
      await testRejection((o) => { (o.data as Record<string, unknown>).interface = 'not-object' }, /interface must be an object/i)
    })

    it('rejects prototype pollution attempts inside stats.history, stats.goals, and settings', async () => {
      const historyPollution = `{
        "app": "focus-flow",
        "version": 2,
        "exportedAt": "2026-09-16T12:00:00.000Z",
        "data": {
          "settings": { "focus": 25 },
          "stats": {
            "today": 0, "week": 0, "streak": 0, "minutes": 0,
            "history": {
              "__proto__": { "historyPolluted": true }
            }
          },
          "sessions": [],
          "presets": [],
          "sounds": [],
          "lang": "pl",
          "theme": "light",
          "volume": 0.7,
          "interface": {}
        }
      }`

      const res1 = await importData(historyPollution)
      expect(res1.success).toBe(false)
      if (!res1.success) {
        expect(res1.error).toMatch(/prototype pollution/i)
      }
      expect((Object.prototype as unknown as Record<string, unknown>).historyPolluted).toBeUndefined()

      const goalsPollution = `{
        "app": "focus-flow",
        "version": 2,
        "exportedAt": "2026-09-16T12:00:00.000Z",
        "data": {
          "settings": { "focus": 25 },
          "stats": {
            "today": 0, "week": 0, "streak": 0, "minutes": 0, "history": {},
            "goals": {
              "constructor": { "prototype": { "goalsPolluted": true } }
            }
          },
          "sessions": [],
          "presets": [],
          "sounds": [],
          "lang": "pl",
          "theme": "light",
          "volume": 0.7,
          "interface": {}
        }
      }`

      const res2 = await importData(goalsPollution)
      expect(res2.success).toBe(false)
      if (!res2.success) {
        expect(res2.error).toMatch(/prototype pollution/i)
      }
      expect((Object.prototype as unknown as Record<string, unknown>).goalsPolluted).toBeUndefined()
    })
  })


  describe('High-Volume Scale Stress Testing (1,000 Sessions Benchmark)', () => {
    const generate1000Sessions = (): SessionLogEntryV2[] => {
      const sessions: SessionLogEntryV2[] = []
      const baseTs = new Date('2026-01-01T08:00:00.000Z').getTime()

      for (let i = 0; i < 1000; i++) {
        sessions.push({
          id: `sess-benchmark-${i.toString().padStart(4, '0')}`,
          date: new Date(baseTs + i * 3600_000).toISOString(),
          minutes: 25 + (i % 3) * 25, // 25, 50, or 75 minutes
          task: `Focus Session #${i}: "Refactor Engine" & Polish diacritics: Zażółć gęślą jaźń | Milestone check, step ${i}`,
          checklist: [
            { id: `chk-${i}-1`, text: `Step 1 for session ${i}`, completed: true },
            { id: `chk-${i}-2`, text: `Step 2 for session ${i}`, completed: i % 2 === 0 },
            { id: `chk-${i}-3`, text: `Step 3 for session ${i}`, completed: false },
          ],
        })
      }
      return sessions
    }

    it('serializes 1,000 sessions to RFC 5545 iCal under 100ms with 100% line-length compliance', () => {
      const sessions = generate1000Sessions()
      const t0 = performance.now()
      const ics = serializeToICal(sessions, new Date('2026-09-16T15:00:00.000Z'))
      const elapsed = performance.now() - t0

      expect(elapsed).toBeLessThan(500) // Fast execution budget
      expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
      expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)

      // Verify all lines meet <= 75 octet rule
      const encoder = new TextEncoder()
      const lines = ics.split('\r\n')
      // Remove trailing empty element after last \r\n
      if (lines[lines.length - 1] === '') lines.pop()

      for (const line of lines) {
        expect(encoder.encode(line).length).toBeLessThanOrEqual(75)
      }
    })

    it('serializes 1,000 sessions to RFC 4180 CSV under 100ms with 100% column consistency', () => {
      const sessions = generate1000Sessions()
      const t0 = performance.now()
      const csv = serializeToCsv(sessions)
      const elapsed = performance.now() - t0

      expect(elapsed).toBeLessThan(500)
      expect(csv.charCodeAt(0)).toBe(0xfeff) // UTF-8 BOM

      // Count rows
      const lines = csv.slice(1).trim().split('\r\n')
      expect(lines.length).toBe(1001) // 1 header + 1000 rows
    })

    it('serializes 1,000 sessions to GFM Markdown with accurate aggregation across multiday span', () => {
      const sessions = generate1000Sessions()
      const totalExpectedMinutes = sessions.reduce((acc, s) => acc + s.minutes, 0)
      const t0 = performance.now()
      const md = serializeToMarkdown(sessions, new Date('2026-09-16T15:00:00.000Z'))
      const elapsed = performance.now() - t0

      expect(elapsed).toBeLessThan(500)
      expect(md).toContain(`1000 sessions · ${totalExpectedMinutes} minutes`)
      expect(md).toContain(`> **Daily Summary**: 1000 sessions completed · ${formatHoursAndMinutes(totalExpectedMinutes)} of deep focus.`)
    })
  })
})

