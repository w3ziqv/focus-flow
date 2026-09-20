import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Exporter } from './exporter'
import { saveSessions } from './storage'
import type { SessionLogEntryV2 } from '../types'

describe('Consolidated Exporter Subsystem (src/lib/exporter.ts)', () => {
  const sampleSessions: SessionLogEntryV2[] = [
    {
      id: 'sess-1',
      date: '2026-09-20T10:00:00.000Z',
      minutes: 25,
      task: 'Architecture Deepening',
      checklist: [{ id: 'c1', text: 'Define seam', completed: true }],
    },
  ]

  beforeEach(() => {
    localStorage.clear()
    saveSessions(sampleSessions)
    vi.restoreAllMocks()
  })

  it('serializes to RFC 5545 iCalendar format through unified serialize entry point', async () => {
    const fixedNow = new Date('2026-09-20T12:00:00.000Z')
    const ics = await Exporter.serialize('ics', { sessions: sampleSessions, now: fixedNow })
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('SUMMARY:Focus: Architecture Deepening')
    expect(ics).toContain('END:VCALENDAR')
  })

  it('serializes to RFC 4180 CSV format with UTF-8 BOM', async () => {
    const csv = await Exporter.serialize('csv', { sessions: sampleSessions })
    expect(csv.charCodeAt(0)).toBe(0xfeff)
    expect(csv).toContain('Architecture Deepening')
    expect(csv).toContain('25')
  })

  it('serializes to GitHub-Flavored Markdown tables', async () => {
    const md = await Exporter.serialize('markdown', { sessions: sampleSessions })
    expect(md).toContain('# Focus Flow — Session History')
    expect(md).toContain('| Architecture Deepening |')
  })

  it('serializes full system backup JSON snapshot', async () => {
    const json = await Exporter.serialize('json')
    const parsed = JSON.parse(json) as { app: string; version: number }
    expect(parsed.app).toBe('focus-flow')
    expect(parsed.version).toBe(2)
  })

  it('throws helpful error on unsupported format', async () => {
    // @ts-expect-error testing runtime unsupported format
    await expect(Exporter.serialize('unsupported')).rejects.toThrow(/unsupported export format/i)
  })
})
