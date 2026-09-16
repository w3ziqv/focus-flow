import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionLogEntryV2 } from '../types'
import { triggerBlobDownload, triggerDownload, triggerTextDownload } from './download'
import {
  downloadCsv,
  downloadICal,
  downloadMarkdown,
  escapeCsvField,
  escapeIcsText,
  escapeMarkdownTableCell,
  foldIcsLine,
  formatHoursAndMinutes,
  formatLocalDate,
  formatLocalTime,
  formatUtcDateTime,
  serializeToCsv,
  serializeToICal,
  serializeToMarkdown,
} from './export'

describe('Multi-Format Session Export Serializers (Milestone M1 / v2.4)', () => {
  const fixedNow = new Date('2026-09-16T13:30:00.000Z')

  const sampleSessions: SessionLogEntryV2[] = [
    {
      id: 'sess-001',
      date: '2026-09-01T10:00:00.000Z',
      minutes: 25,
      task: 'Refactor Web Audio',
      checklist: [
        { id: 'c1', text: 'Filter setup', completed: true },
        { id: 'c2', text: 'Gain ramps', completed: true },
        { id: 'c3', text: 'Crossfade', completed: false },
      ],
    },
    {
      id: 'sess-002',
      date: '2026-09-01T11:00:00.000Z',
      minutes: 50,
      task: 'Write "Roadmap" & Specs; test \\ review, all done\nPart 2',
      checklist: [
        { id: 'c4', text: 'ADR review', completed: true },
        { id: 'c5', text: 'Milestones outline', completed: true },
      ],
    },
    {
      id: 'sess-003',
      date: '2026-09-01T12:00:00.000Z',
      minutes: 25,
      task: null,
      // No checklist
    },
  ]

  // ==========================================================================
  // Date and Time Helpers
  // ==========================================================================
  describe('Date and Time Format Helpers', () => {
    it('formats UTC date-time into iCal YYYYMMDDTHHMMSSZ format', () => {
      const d = new Date('2026-09-01T09:05:07.000Z')
      expect(formatUtcDateTime(d)).toBe('20260901T090507Z')
    })

    it('formats local date and time cleanly', () => {
      const d = new Date(2026, 8, 1, 9, 5) // Month is 0-indexed (8 = Sep)
      expect(formatLocalDate(d)).toBe('2026-09-01')
      expect(formatLocalTime(d)).toBe('09:05')
    })

    it('handles invalid dates gracefully without throwing', () => {
      const invalid = new Date('invalid-date')
      expect(formatLocalDate(invalid)).toBe('')
      expect(formatLocalTime(invalid)).toBe('')
    })

    it('formats hours and minutes with plural awareness', () => {
      expect(formatHoursAndMinutes(0)).toBe('0 minutes')
      expect(formatHoursAndMinutes(1)).toBe('1 minute')
      expect(formatHoursAndMinutes(25)).toBe('25 minutes')
      expect(formatHoursAndMinutes(60)).toBe('1 hour')
      expect(formatHoursAndMinutes(120)).toBe('2 hours')
      expect(formatHoursAndMinutes(61)).toBe('1 hour 1 minute')
      expect(formatHoursAndMinutes(100)).toBe('1 hour 40 minutes')
      expect(formatHoursAndMinutes(122)).toBe('2 hours 2 minutes')
    })
  })

  // ==========================================================================
  // RFC 5545 iCalendar Serializer
  // ==========================================================================
  describe('serializeToICal (RFC 5545)', () => {
    it('escapes special iCalendar characters per RFC 5545 § 3.3.11', () => {
      const input = 'Backslash \\ Semicolon ; Comma , Newline\nEnd'
      const escaped = escapeIcsText(input)
      expect(escaped).toBe('Backslash \\\\ Semicolon \\; Comma \\, Newline\\nEnd')
    })

    it('folds lines exceeding 75 octets with CRLF and space per RFC 5545 § 3.1', () => {
      const shortLine = 'SUMMARY:Short summary'
      expect(foldIcsLine(shortLine)).toBe(shortLine)

      // 75 ASCII characters
      const exact75 = 'A'.repeat(75)
      expect(foldIcsLine(exact75)).toBe(exact75)

      // 76 ASCII characters
      const line76 = 'A'.repeat(76)
      const folded76 = foldIcsLine(line76)
      expect(folded76).toBe('A'.repeat(75) + '\r\n A')

      // 150 ASCII characters
      const line150 = 'B'.repeat(150)
      const folded150 = foldIcsLine(line150)
      const chunks = folded150.split('\r\n')
      expect(chunks.length).toBe(3)
      expect(new TextEncoder().encode(chunks[0]).length).toBe(75)
      expect(new TextEncoder().encode(chunks[1]).length).toBe(75)
      expect(chunks[1].startsWith(' ')).toBe(true)
      expect(chunks[2].startsWith(' ')).toBe(true)
      expect(new TextEncoder().encode(chunks[2]).length).toBe(2) // ' ' + 'B'
    })

    it('folds multi-byte Unicode lines safely without splitting code points', () => {
      // Polish diacritics are 2 bytes each in UTF-8
      const polishText = 'DESCRIPTION:' + 'Zażółć gęślą jaźń '.repeat(6)
      const folded = foldIcsLine(polishText)
      const lines = folded.split('\r\n')
      const encoder = new TextEncoder()
      for (const l of lines) {
        expect(encoder.encode(l).length).toBeLessThanOrEqual(75)
      }
    })

    it('generates a valid VCALENDAR feed with proper envelope and CRLF endings', () => {
      const ics = serializeToICal([], fixedNow)
      expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
      expect(ics).toContain('VERSION:2.0\r\n')
      expect(ics).toContain('PRODID:-//Focus Flow//Pomodoro Companion//EN\r\n')
      expect(ics).toContain('CALSCALE:GREGORIAN\r\n')
      expect(ics).toContain('METHOD:PUBLISH\r\n')
      expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
    })

    it('serializes VEVENT components with correct UID, DTSTAMP, DTSTART, and DTEND', () => {
      const ics = serializeToICal([sampleSessions[0]], fixedNow)

      expect(ics).toContain('BEGIN:VEVENT\r\n')
      expect(ics).toContain('UID:ff-session-sess-001@focus-flow.local\r\n')
      expect(ics).toContain('DTSTAMP:20260916T133000Z\r\n')
      // End date: 2026-09-01T10:00:00.000Z
      expect(ics).toContain('DTEND:20260901T100000Z\r\n')
      // Start date: 10:00 - 25m = 09:35:00.000Z
      expect(ics).toContain('DTSTART:20260901T093500Z\r\n')
      expect(ics).toContain('SUMMARY:Focus: Refactor Web Audio\r\n')
      expect(ics).toContain('STATUS:CONFIRMED\r\n')
      expect(ics).toContain('TRANSP:OPAQUE\r\n')
      expect(ics).toContain('CATEGORIES:Focus,Pomodoro\r\n')
      expect(ics).toContain('END:VEVENT\r\n')
    })

    it('formats DESCRIPTION with task, duration, and checklist progress', () => {
      const ics = serializeToICal([sampleSessions[0]], fixedNow)
      // Verify line folding at <= 75 octets per line
      const rawLines = ics.split('\r\n')
      for (const line of rawLines) {
        expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75)
      }

      // Check unfolded description content
      const unfolded = ics.replace(/\r\n /g, '')
      expect(unfolded).toContain('Task: Refactor Web Audio')
      expect(unfolded).toContain('Duration: 25 minutes')
      expect(unfolded).toContain('Checklist: 2/3 completed')
    })

    it('falls back to "Focus Session" for null or empty tasks', () => {
      const ics = serializeToICal([sampleSessions[2]], fixedNow)
      expect(ics).toContain('SUMMARY:Focus: Focus Session\r\n')
      expect(ics).toContain('Task: Focus Session')
    })

    it('escapes and folds long descriptions with special characters', () => {
      const ics = serializeToICal([sampleSessions[1]], fixedNow)
      const unfolded = ics.replace(/\r\n /g, '')
      expect(unfolded).toContain('Write "Roadmap" & Specs\\; test \\\\ review\\, all done\\nPart 2')
      expect(unfolded).toContain('Checklist: 2/2 completed')

      // Verify every line in the raw output satisfies RFC 5545 75-octet limit
      const rawLines = ics.split('\r\n')
      for (const line of rawLines) {
        expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75)
      }
    })
  })

  // ==========================================================================
  // RFC 4180 CSV Serializer
  // ==========================================================================
  describe('serializeToCsv (RFC 4180)', () => {
    it('escapes CSV fields according to RFC 4180 rules', () => {
      expect(escapeCsvField('simple')).toBe('"simple"')
      expect(escapeCsvField('has,comma')).toBe('"has,comma"')
      expect(escapeCsvField('has"quote')).toBe('"has""quote"')
      expect(escapeCsvField('multi\nline')).toBe('"multi\nline"')
      expect(escapeCsvField(25)).toBe('25')
      expect(escapeCsvField(null)).toBe('""')
      expect(escapeCsvField(undefined)).toBe('""')
    })

    it('prepends UTF-8 Byte Order Mark (\\uFEFF) to the CSV output', () => {
      const csv = serializeToCsv([])
      expect(csv.charCodeAt(0)).toBe(0xfeff)
    })

    it('emits exact 8 headers followed by CRLF', () => {
      const csv = serializeToCsv([])
      const expectedHeader = 'id,date_iso,date_local,time_local,duration_minutes,task,checklist_total,checklist_completed'
      expect(csv).toBe(`\uFEFF${expectedHeader}\r\n`)
    })

    it('serializes session rows with clean quotes, dates, and unquoted numbers', () => {
      const csv = serializeToCsv(sampleSessions)
      const lines = csv.slice(1).trim().split('\r\n') // Remove BOM and split
      expect(lines.length).toBe(4) // 1 header + 3 rows

      // Row 1
      const row1 = lines[1]
      expect(row1).toContain('"sess-001"')
      expect(row1).toContain('"2026-09-01T10:00:00.000Z"')
      expect(row1).toContain('"Refactor Web Audio"')
      expect(row1.endsWith(',25,"Refactor Web Audio",3,2')).toBe(true)

      // Row 3 (null task, no checklist)
      const row3 = lines[3]
      expect(row3).toContain('"sess-003"')
      expect(row3.endsWith(',25,"",0,0')).toBe(true)
    })

    it('properly quotes and doubles quotes for tasks with quotes, commas, and newlines', () => {
      const csv = serializeToCsv([sampleSessions[1]])
      expect(csv).toContain('""Roadmap""')
      expect(csv).toContain('test \\ review, all done')
    })

    it('preserves Polish diacritics and Unicode characters accurately', () => {
      const polishSession: SessionLogEntryV2 = {
        id: 'sess-pl',
        date: '2026-09-01T15:00:00.000Z',
        minutes: 25,
        task: 'Zażółć gęślą jaźń — ćwiczenie uważności',
      }
      const csv = serializeToCsv([polishSession])
      expect(csv).toContain('Zażółć gęślą jaźń — ćwiczenie uważności')
    })
  })

  // ==========================================================================
  // GitHub-Flavored Markdown Serializer
  // ==========================================================================
  describe('serializeToMarkdown (GFM)', () => {
    it('escapes pipes and strips newlines from markdown table cells', () => {
      expect(escapeMarkdownTableCell('Task | with | pipes')).toBe('Task \\| with \\| pipes')
      expect(escapeMarkdownTableCell('Multi\r\nline\ntask')).toBe('Multi line task')
    })

    it('generates GFM table with header callout and metadata', () => {
      const md = serializeToMarkdown(sampleSessions, fixedNow)
      expect(md.startsWith('# Focus Flow — Session History\n')).toBe(true)
      expect(md).toContain('*Exported on 2026-09-16 15:30 · 3 sessions · 100 minutes*\n\n')
      expect(md).toContain('| Date | Time | Duration | Intention | Micro-Steps |\n')
      expect(md).toContain('|---|---|---|---|---|\n')
    })

    it('formats table rows with start time, duration, escaped intention, and checklist ratio', () => {
      const md = serializeToMarkdown(sampleSessions, fixedNow)
      expect(md).toContain('25 min | Refactor Web Audio | 2/3 |')
      expect(md).toContain('50 min | Write "Roadmap" & Specs; test \\ review, all done Part 2 | 2/2 |')
      expect(md).toContain('25 min | - | - |')
    })

    it('escapes pipe characters within task titles to maintain table integrity', () => {
      const pipeSession: SessionLogEntryV2 = {
        id: 'sess-pipe',
        date: '2026-09-01T10:00:00.000Z',
        minutes: 25,
        task: 'Feature A | Feature B | Feature C',
      }
      const md = serializeToMarkdown([pipeSession], fixedNow)
      expect(md).toContain('Feature A \\| Feature B \\| Feature C')
    })

    it('generates plural-aware daily summary blockquote at the bottom', () => {
      // 3 sessions totaling 100 minutes (1 hour 40 minutes)
      const mdMultiple = serializeToMarkdown(sampleSessions, fixedNow)
      expect(mdMultiple).toContain('> **Daily Summary**: 3 sessions completed · 1 hour 40 minutes of deep focus.')

      // 1 session of 25 minutes
      const mdSingle = serializeToMarkdown([sampleSessions[0]], fixedNow)
      expect(mdSingle).toContain('> **Daily Summary**: 1 session completed · 25 minutes of deep focus.')

      // 0 sessions
      const mdEmpty = serializeToMarkdown([], fixedNow)
      expect(mdEmpty).toContain('> **Daily Summary**: 0 sessions completed · 0 minutes of deep focus.')

      // Exact hours without leftover minutes (120 minutes)
      const twoHoursSession: SessionLogEntryV2 = {
        id: 'sess-2h',
        date: '2026-09-01T12:00:00.000Z',
        minutes: 120,
        task: 'Deep Work Marathon',
      }
      const md2h = serializeToMarkdown([twoHoursSession], fixedNow)
      expect(md2h).toContain('> **Daily Summary**: 1 session completed · 2 hours of deep focus.')
    })
  })

  // ==========================================================================
  // Client-Side Download Trigger Helper
  // ==========================================================================
  describe('Download Triggers (download.ts & export.ts)', () => {
    let originalCreateObjectURL: typeof URL.createObjectURL
    let originalRevokeObjectURL: typeof URL.revokeObjectURL
    let mockCreateObjectURL: ReturnType<typeof vi.fn>
    let mockRevokeObjectURL: ReturnType<typeof vi.fn>
    let clickSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      vi.restoreAllMocks()
      originalCreateObjectURL = window.URL.createObjectURL
      originalRevokeObjectURL = window.URL.revokeObjectURL

      mockCreateObjectURL = vi.fn(() => 'blob:mock-url-test-123')
      mockRevokeObjectURL = vi.fn()
      window.URL.createObjectURL = mockCreateObjectURL as unknown as typeof URL.createObjectURL
      window.URL.revokeObjectURL = mockRevokeObjectURL as unknown as typeof URL.revokeObjectURL

      clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
      vi.useFakeTimers()
    })

    afterEach(() => {
      window.URL.createObjectURL = originalCreateObjectURL
      window.URL.revokeObjectURL = originalRevokeObjectURL
      vi.useRealTimers()
    })

    it('triggers download with string content via ephemeral anchor and revokes URL after 1s', () => {
      const appendSpy = vi.spyOn(document.body, 'appendChild')
      const removeSpy = vi.spyOn(document.body, 'removeChild')

      triggerDownload('sessions.csv', 'id,task\n1,test', 'text/csv;charset=utf-8')

      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1)
      expect(appendSpy).toHaveBeenCalled()
      expect(clickSpy).toHaveBeenCalledTimes(1)
      expect(removeSpy).toHaveBeenCalled()

      // Confirm revocation after 1000ms
      expect(mockRevokeObjectURL).not.toHaveBeenCalled()
      vi.advanceTimersByTime(1000)
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url-test-123')
    })

    it('triggers download with Blob content directly', () => {
      const blob = new Blob(['sample-content'], { type: 'text/markdown' })
      triggerBlobDownload(blob, 'sample.md')

      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1)
      expect(clickSpy).toHaveBeenCalledTimes(1)
    })

    it('triggers download via triggerTextDownload helper', () => {
      triggerTextDownload('content', 'test.txt', 'text/plain')
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1)
      expect(clickSpy).toHaveBeenCalledTimes(1)
    })

    it('executes downloadICal and creates .ics file with calendar MIME type', () => {
      downloadICal(sampleSessions, 'my-sessions.ics', fixedNow)
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1)
      expect(clickSpy).toHaveBeenCalledTimes(1)
    })

    it('executes downloadCsv and creates .csv file with csv MIME type', () => {
      downloadCsv(sampleSessions, 'my-sessions.csv')
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1)
      expect(clickSpy).toHaveBeenCalledTimes(1)
    })

    it('executes downloadMarkdown and creates .md file with markdown MIME type', () => {
      downloadMarkdown(sampleSessions, 'my-sessions.md', fixedNow)
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1)
      expect(clickSpy).toHaveBeenCalledTimes(1)
    })

    it('returns safely without throwing in non-DOM environments', () => {
      const origDoc = globalThis.document
      // @ts-expect-error - testing non-DOM environment simulation
      delete globalThis.document

      expect(() => triggerDownload('test.csv', 'content', 'text/csv')).not.toThrow()

      globalThis.document = origDoc
    })
  })

  // ==========================================================================
  // Boundary and Edge Conditions
  // ==========================================================================
  describe('Boundary and Edge Conditions', () => {
    it('handles empty sessions array across all three serializers', () => {
      const ics = serializeToICal([], fixedNow)
      expect(ics).toBe(
        'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Focus Flow//Pomodoro Companion//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\nEND:VCALENDAR\r\n'
      )

      const csv = serializeToCsv([])
      expect(csv).toBe(
        '\uFEFFid,date_iso,date_local,time_local,duration_minutes,task,checklist_total,checklist_completed\r\n'
      )

      const md = serializeToMarkdown([], fixedNow)
      expect(md).toContain('*Exported on 2026-09-16 15:30 · 0 sessions · 0 minutes*\n\n')
      expect(md).toContain('> **Daily Summary**: 0 sessions completed · 0 minutes of deep focus.')
    })

    it('handles session with null task cleanly in all formats', () => {
      const nullSession: SessionLogEntryV2 = {
        id: 'sess-null',
        date: '2026-09-01T10:00:00.000Z',
        minutes: 25,
        task: null,
      }

      const ics = serializeToICal([nullSession], fixedNow)
      expect(ics).toContain('SUMMARY:Focus: Focus Session\r\n')
      expect(ics).toContain('Task: Focus Session')

      const csv = serializeToCsv([nullSession])
      expect(csv).toContain('"sess-null"')
      expect(csv).toContain(',25,"",0,0\r\n')

      const md = serializeToMarkdown([nullSession], fixedNow)
      expect(md).toContain('| 25 min | - | - |')
    })

    it('handles session with whitespace or empty task title', () => {
      const emptySession: SessionLogEntryV2 = {
        id: 'sess-empty',
        date: '2026-09-01T10:00:00.000Z',
        minutes: 25,
        task: '   ',
      }

      const ics = serializeToICal([emptySession], fixedNow)
      expect(ics).toContain('SUMMARY:Focus: Focus Session\r\n')

      const csv = serializeToCsv([emptySession])
      expect(csv).toContain(',25,"   ",0,0\r\n')

      const md = serializeToMarkdown([emptySession], fixedNow)
      expect(md).toContain('| 25 min | - | - |')
    })

    it('handles session with 0 checklist items (empty array)', () => {
      const zeroChecklistSession: SessionLogEntryV2 = {
        id: 'sess-zero-check',
        date: '2026-09-01T10:00:00.000Z',
        minutes: 25,
        task: 'Zero Checklist Test',
        checklist: [],
      }

      const ics = serializeToICal([zeroChecklistSession], fixedNow)
      expect(ics).not.toContain('Checklist:')

      const csv = serializeToCsv([zeroChecklistSession])
      expect(csv).toContain(',25,"Zero Checklist Test",0,0\r\n')

      const md = serializeToMarkdown([zeroChecklistSession], fixedNow)
      expect(md).toContain('| 25 min | Zero Checklist Test | - |')
    })

    it('handles session with all completed checklist items (3 of 3)', () => {
      const allDoneSession: SessionLogEntryV2 = {
        id: 'sess-all-done',
        date: '2026-09-01T10:00:00.000Z',
        minutes: 25,
        task: 'All Done Test',
        checklist: [
          { id: '1', text: 'One', completed: true },
          { id: '2', text: 'Two', completed: true },
          { id: '3', text: 'Three', completed: true },
        ],
      }

      const ics = serializeToICal([allDoneSession], fixedNow)
      const unfolded = ics.replace(/\r\n /g, '')
      expect(unfolded).toContain('Checklist: 3/3 completed')

      const csv = serializeToCsv([allDoneSession])
      expect(csv).toContain(',25,"All Done Test",3,3\r\n')

      const md = serializeToMarkdown([allDoneSession], fixedNow)
      expect(md).toContain('| 25 min | All Done Test | 3/3 |')
    })

    it('handles session with 0 of 3 completed checklist items', () => {
      const noneDoneSession: SessionLogEntryV2 = {
        id: 'sess-none-done',
        date: '2026-09-01T10:00:00.000Z',
        minutes: 25,
        task: 'None Done Test',
        checklist: [
          { id: '1', text: 'One', completed: false },
          { id: '2', text: 'Two', completed: false },
          { id: '3', text: 'Three', completed: false },
        ],
      }

      const ics = serializeToICal([noneDoneSession], fixedNow)
      const unfolded = ics.replace(/\r\n /g, '')
      expect(unfolded).toContain('Checklist: 0/3 completed')

      const csv = serializeToCsv([noneDoneSession])
      expect(csv).toContain(',25,"None Done Test",3,0\r\n')

      const md = serializeToMarkdown([noneDoneSession], fixedNow)
      expect(md).toContain('| 25 min | None Done Test | 0/3 |')
    })

    it('formats 1 minute session duration with singular word in Markdown', () => {
      const singleMinSession: SessionLogEntryV2 = {
        id: 'sess-1m',
        date: '2026-09-01T10:00:00.000Z',
        minutes: 1,
        task: 'Quick Sprint',
      }

      const md = serializeToMarkdown([singleMinSession], fixedNow)
      expect(md).toContain('*Exported on 2026-09-16 15:30 · 1 session · 1 minute*\n\n')
      expect(md).toContain('> **Daily Summary**: 1 session completed · 1 minute of deep focus.')
    })
  })
})
