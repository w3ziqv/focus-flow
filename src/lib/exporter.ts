import type { SessionLogEntryV2 } from '../types'
import {
  downloadCsv,
  downloadICal,
  downloadMarkdown,
  serializeToCsv,
  serializeToICal,
  serializeToMarkdown,
} from './export'
import { exportData, exportDataString, importData, type BackupFileV2, type ImportResult } from './dataPort'
import { triggerDownload } from './download'
import { loadSessions } from './storage'
import {
  copyWeeklyCardToClipboard,
  downloadWeeklyCard,
  renderWeeklyCardCanvas,
  type WeeklyCardData,
} from './cardExport'

export type ExportFormat = 'ics' | 'csv' | 'markdown' | 'json'

export interface ExportOptions {
  format: ExportFormat
  sessions?: SessionLogEntryV2[]
  filename?: string
  now?: Date
}

/**
 * Consolidated Exporter Subsystem (Deep Interface).
 *
 * Provides a unified entry point for serializing and downloading focus data across
 * all supported formats (RFC 5545 iCalendar, RFC 4180 CSV, GitHub-Flavored Markdown,
 * and Schema v2 Full Backup JSON) as well as HTML5 canvas summary cards.
 */
export class Exporter {
  /**
   * Serializes session logs or full system backup into string format.
   */
  public static async serialize(format: ExportFormat, options: Omit<ExportOptions, 'format'> = {}): Promise<string> {
    const sessions = options.sessions ?? loadSessions()
    const now = options.now ?? new Date()

    switch (format) {
      case 'ics':
        return serializeToICal(sessions, now)
      case 'csv':
        return serializeToCsv(sessions)
      case 'markdown':
        return serializeToMarkdown(sessions, now)
      case 'json':
        return exportDataString()
      default: {
        const exhaustiveCheck: never = format
        throw new Error(`Unsupported export format: ${String(exhaustiveCheck)}`)
      }
    }
  }

  /**
   * Direct browser download trigger with automatic MIME resolution and canonical filenames.
   */
  public static async download(format: ExportFormat, options: Omit<ExportOptions, 'format'> = {}): Promise<void> {
    const sessions = options.sessions ?? loadSessions()

    switch (format) {
      case 'ics':
        if (options.filename || options.now) {
          downloadICal(sessions, options.filename, options.now)
        } else {
          downloadICal(sessions)
        }
        break
      case 'csv':
        if (options.filename) {
          downloadCsv(sessions, options.filename)
        } else {
          downloadCsv(sessions)
        }
        break
      case 'markdown':
        if (options.filename || options.now) {
          downloadMarkdown(sessions, options.filename, options.now)
        } else {
          downloadMarkdown(sessions)
        }
        break
      case 'json': {
        const content = await exportDataString()
        const filename = options.filename || 'focus-flow-backup-v2.json'
        triggerDownload(filename, content, 'application/json')
        break
      }
      default: {
        const exhaustiveCheck: never = format
        throw new Error(`Unsupported download format: ${String(exhaustiveCheck)}`)
      }
    }
  }

  /**
   * Canvas Summary Card exports.
   */
  public static async downloadCard(data: WeeklyCardData): Promise<void> {
    await downloadWeeklyCard(data)
  }

  public static copyCardToClipboard(data: WeeklyCardData): Promise<boolean> {
    return copyWeeklyCardToClipboard(data)
  }

  public static renderCardCanvas(data: WeeklyCardData): Promise<HTMLCanvasElement> {
    return renderWeeklyCardCanvas(data)
  }

  /**
   * Full backup restore bridge.
   */
  public static importBackup(rawJson: string): Promise<ImportResult> {
    return importData(rawJson)
  }

  public static getBackupSnapshot(): Promise<BackupFileV2> {
    return exportData()
  }
}

// Re-export underlying pure serializers for direct usage if needed
export {
  serializeToCsv,
  serializeToICal,
  serializeToMarkdown,
  exportData,
  exportDataString,
  importData,
}
