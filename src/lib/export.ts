/**
 * Serializers for exporting session logs:
 * - RFC 5545 iCalendar (.ics) with line folding and character escaping
 * - RFC 4180 CSV (.csv) with UTF-8 BOM for spreadsheet compatibility
 * - GitHub-Flavored Markdown (.md) tables with summary blockquote
 */

import type { SessionLogEntryV2 } from '../types'
import { triggerDownload } from './download'



export function formatLocalDate(d: Date): string {
  if (isNaN(d.getTime())) return ''
  const y = d.getFullYear().toString().padStart(4, '0')
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatLocalTime(d: Date): string {
  if (isNaN(d.getTime())) return ''
  const h = d.getHours().toString().padStart(2, '0')
  const min = d.getMinutes().toString().padStart(2, '0')
  return `${h}:${min}`
}

export function formatUtcDateTime(d: Date): string {
  const y = d.getUTCFullYear().toString().padStart(4, '0')
  const m = (d.getUTCMonth() + 1).toString().padStart(2, '0')
  const day = d.getUTCDate().toString().padStart(2, '0')
  const h = d.getUTCHours().toString().padStart(2, '0')
  const min = d.getUTCMinutes().toString().padStart(2, '0')
  const s = d.getUTCSeconds().toString().padStart(2, '0')
  return `${y}${m}${day}T${h}${min}${s}Z`
}

export function formatHoursAndMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60

  if (hours > 0 && mins > 0) {
    const hWord = hours === 1 ? 'hour' : 'hours'
    const mWord = mins === 1 ? 'minute' : 'minutes'
    return `${hours} ${hWord} ${mins} ${mWord}`
  }
  if (hours > 0 && mins === 0) {
    const hWord = hours === 1 ? 'hour' : 'hours'
    return `${hours} ${hWord}`
  }
  const mWord = mins === 1 ? 'minute' : 'minutes'
  return `${mins} ${mWord}`
}



/**
 * Escapes characters per RFC 5545 § 3.3.11:
 * Backslash (\) -> \\
 * Semicolon (;) -> \;
 * Comma (,) -> \,
 * Newlines -> \n
 */
export function escapeIcsText(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

function getCharByteLength(cp: number): number {
  if (cp <= 0x7f) return 1
  if (cp <= 0x7ff) return 2
  if (cp <= 0xffff) return 3
  return 4
}

/**
 * Folds a content line at 75 octets per RFC 5545 § 3.1.
 * Continuation lines begin with a single space character (`\r\n `).
 */
export function foldIcsLine(line: string): string {
  if (line.length <= 75) {
    let ascii = true
    for (let i = 0; i < line.length; i++) {
      if (line.charCodeAt(i) > 0x7f) {
        ascii = false
        break
      }
    }
    if (ascii) return line
  }

  let totalBytes = 0
  for (const char of line) {
    totalBytes += getCharByteLength(char.codePointAt(0)!)
  }
  if (totalBytes <= 75) {
    return line
  }

  let result = ''
  let currentChunk = ''
  let currentBytes = 0
  let isFirstLine = true

  for (const char of line) {
    const charBytes = getCharByteLength(char.codePointAt(0)!)
    const maxBytes = isFirstLine ? 75 : 74 // Continuation line has 1 leading space (1 octet)

    if (currentBytes + charBytes > maxBytes) {
      if (isFirstLine) {
        result += currentChunk + '\r\n'
        isFirstLine = false
      } else {
        result += ' ' + currentChunk + '\r\n'
      }
      currentChunk = char
      currentBytes = charBytes
    } else {
      currentChunk += char
      currentBytes += charBytes
    }
  }

  if (currentChunk.length > 0) {
    if (isFirstLine) {
      result += currentChunk
    } else {
      result += ' ' + currentChunk
    }
  }

  return result
}

/**
 * Serializes focus sessions into an RFC 5545 compliant VCALENDAR document.
 */
export function serializeToICal(sessions: SessionLogEntryV2[], now: Date = new Date()): string {
  const rawLines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Focus Flow//Pomodoro Companion//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  const dtstamp = formatUtcDateTime(now)

  for (const session of sessions) {
    const endDate = new Date(session.date)
    const validEndDate = isNaN(endDate.getTime()) ? now : endDate
    const startDate = new Date(validEndDate.getTime() - Math.max(0, session.minutes) * 60 * 1000)

    const taskTitle = session.task?.trim() || 'Focus Session'
    const summary = `Focus: ${taskTitle}`
    const escapedSummary = escapeIcsText(summary)

    const descParts: string[] = [
      `Task: ${taskTitle}`,
      `Duration: ${session.minutes} minutes`,
    ]
    if (session.checklist && session.checklist.length > 0) {
      const completed = session.checklist.filter((item) => item.completed).length
      descParts.push(`Checklist: ${completed}/${session.checklist.length} completed`)
    }
    const escapedDesc = escapeIcsText(descParts.join('\n'))

    rawLines.push(
      'BEGIN:VEVENT',
      `UID:ff-session-${session.id}@focus-flow.local`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${formatUtcDateTime(startDate)}`,
      `DTEND:${formatUtcDateTime(validEndDate)}`,
      `SUMMARY:${escapedSummary}`,
      `DESCRIPTION:${escapedDesc}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'CATEGORIES:Focus,Pomodoro',
      'END:VEVENT',
    )
  }

  rawLines.push('END:VCALENDAR')

  return rawLines.map(foldIcsLine).join('\r\n') + '\r\n'
}



export function escapeCsvField(val: string | number | null | undefined): string {
  if (val === null || val === undefined) {
    return '""'
  }
  if (typeof val === 'number') {
    return String(val)
  }
  const str = String(val)
  return `"${str.replace(/"/g, '""')}"`
}

/**
 * Serializes focus sessions into an RFC 4180 compliant CSV document
 * prefixed with the UTF-8 Byte Order Mark (\uFEFF) for seamless Excel loading.
 */
export function serializeToCsv(sessions: SessionLogEntryV2[]): string {
  const BOM = '\uFEFF'
  const headers = [
    'id',
    'date_iso',
    'date_local',
    'time_local',
    'duration_minutes',
    'task',
    'checklist_total',
    'checklist_completed',
  ].join(',')

  const rows: string[] = [headers]

  for (const s of sessions) {
    const d = new Date(s.date)
    const dateLocal = formatLocalDate(d)
    const timeLocal = formatLocalTime(d)
    const totalChecklist = s.checklist ? s.checklist.length : 0
    const completedChecklist = s.checklist
      ? s.checklist.filter((item) => item.completed).length
      : 0

    const row = [
      escapeCsvField(s.id),
      escapeCsvField(s.date),
      escapeCsvField(dateLocal),
      escapeCsvField(timeLocal),
      escapeCsvField(s.minutes),
      escapeCsvField(s.task ?? ''),
      escapeCsvField(totalChecklist),
      escapeCsvField(completedChecklist),
    ].join(',')

    rows.push(row)
  }

  return BOM + rows.join('\r\n') + '\r\n'
}



export function escapeMarkdownTableCell(val: string): string {
  return val.replace(/\r?\n/g, ' ').replace(/\|/g, '\\|')
}

/**
 * Serializes focus sessions into a GitHub-Flavored Markdown table
 * with an export metadata callout and daily summary blockquote.
 */
export function serializeToMarkdown(sessions: SessionLogEntryV2[], now: Date = new Date()): string {
  const exportDateStr = `${formatLocalDate(now)} ${formatLocalTime(now)}`
  const sessionsCount = sessions.length
  const totalMinutes = sessions.reduce((acc, s) => acc + (s.minutes || 0), 0)

  const sessionWord = sessionsCount === 1 ? 'session' : 'sessions'
  const minuteWord = totalMinutes === 1 ? 'minute' : 'minutes'

  let out = `# Focus Flow — Session History\n`
  out += `*Exported on ${exportDateStr} · ${sessionsCount} ${sessionWord} · ${totalMinutes} ${minuteWord}*\n\n`
  out += `| Date | Time | Duration | Intention | Micro-Steps |\n`
  out += `|---|---|---|---|---|\n`

  for (const s of sessions) {
    const completionTime = new Date(s.date).getTime()
    const validCompletionTime = isNaN(completionTime) ? now.getTime() : completionTime
    const startTime = new Date(validCompletionTime - Math.max(0, s.minutes) * 60 * 1000)

    const dateStr = formatLocalDate(startTime)
    const timeStr = formatLocalTime(startTime)
    const rawTask = s.task?.trim()
    const intentionStr = rawTask ? escapeMarkdownTableCell(rawTask) : '-'

    let microStepsStr = '-'
    if (s.checklist && s.checklist.length > 0) {
      const completed = s.checklist.filter((item) => item.completed).length
      microStepsStr = `${completed}/${s.checklist.length}`
    }

    out += `| ${dateStr} | ${timeStr} | ${s.minutes} min | ${intentionStr} | ${microStepsStr} |\n`
  }

  out += `\n> **Daily Summary**: ${sessionsCount} ${sessionWord} completed · ${formatHoursAndMinutes(totalMinutes)} of deep focus.\n`

  return out
}



export function downloadICal(sessions: SessionLogEntryV2[], filename?: string, now?: Date): void {
  const defaultDate = formatLocalDate(now ?? new Date())
  const name = filename || `focus-flow-sessions-${defaultDate}.ics`
  const content = serializeToICal(sessions, now)
  triggerDownload(name, content, 'text/calendar;charset=utf-8')
}

export function downloadCsv(sessions: SessionLogEntryV2[], filename?: string): void {
  const defaultDate = formatLocalDate(new Date())
  const name = filename || `focus-flow-sessions-${defaultDate}.csv`
  const content = serializeToCsv(sessions)
  triggerDownload(name, content, 'text/csv;charset=utf-8')
}

export function downloadMarkdown(sessions: SessionLogEntryV2[], filename?: string, now?: Date): void {
  const defaultDate = formatLocalDate(now ?? new Date())
  const name = filename || `focus-flow-sessions-${defaultDate}.md`
  const content = serializeToMarkdown(sessions, now)
  triggerDownload(name, content, 'text/markdown;charset=utf-8')
}
