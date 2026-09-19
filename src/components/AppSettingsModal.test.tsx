import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { I18nProvider } from '../lib/i18n'
import { AppSettingsModal } from './AppSettingsModal'
import type { SettingsSection } from './AppSettingsModal'
import * as exportModule from '../lib/export'
import * as downloadModule from '../lib/download'
import * as dataPortModule from '../lib/dataPort'
import * as webhookModule from '../lib/webhook'
import * as storageModule from '../lib/storage'
import * as notificationsModule from '../lib/notifications'
import type { InterfacePrefs, Theme, WebhookSettings } from '../types'

describe('AppSettingsModal Component', () => {
  const defaultInterfacePrefs: InterfacePrefs = {
    reduceMotion: false,
    showGreeting: true,
  }

  const defaultProps = {
    open: true,
    theme: 'light' as Theme,
    onTheme: vi.fn(),
    interfacePrefs: defaultInterfacePrefs,
    onInterfaceChange: vi.fn(),
    onClose: vi.fn(),
    onOpenShortcuts: vi.fn(),
    onImportSuccess: vi.fn(),
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  const renderModal = (
    props: Partial<typeof defaultProps & { initialSection?: SettingsSection }> = {},
    initialSection?: SettingsSection,
  ) => {
    const finalSection = initialSection ?? props.initialSection ?? 'main'
    return render(
      <I18nProvider>
        <AppSettingsModal {...defaultProps} {...props} initialSection={finalSection} />
      </I18nProvider>,
    )
  }

  describe('Export Actions', () => {
    it('renders all one-click export buttons (Markdown, CSV, iCal, JSON)', () => {
      renderModal({}, 'data')

      expect(screen.getByRole('button', { name: /Markdown \(\.md\)/i })).toBeDefined()
      expect(screen.getByRole('button', { name: /Arkusz CSV \(\.csv\)|Spreadsheet CSV \(\.csv\)/i })).toBeDefined()
      expect(screen.getByRole('button', { name: /Kalendarz iCal \(\.ics\)|iCalendar \(\.ics\)/i })).toBeDefined()
      expect(screen.getByRole('button', { name: /Kopia zapasowa JSON|Full JSON Backup/i })).toBeDefined()
      expect(screen.getByRole('button', { name: /Importuj kopię zapasową|Import backup/i })).toBeDefined()
    })

    it('clicking Markdown button triggers downloadMarkdown with sessions from storage', () => {
      const dummySessions = [
        { id: 's1', date: '2026-09-01T10:00:00Z', minutes: 25, task: 'Deep Work' },
      ]
      vi.spyOn(storageModule, 'loadSessions').mockReturnValue(dummySessions)
      const downloadMarkdownSpy = vi.spyOn(exportModule, 'downloadMarkdown').mockImplementation(() => {})

      renderModal({}, 'data')
      const mdButton = screen.getByRole('button', { name: /Markdown \(\.md\)/i })
      fireEvent.click(mdButton)

      expect(downloadMarkdownSpy).toHaveBeenCalledTimes(1)
      expect(downloadMarkdownSpy).toHaveBeenCalledWith(dummySessions)
    })

    it('clicking CSV button triggers downloadCsv with sessions from storage', () => {
      const dummySessions = [
        { id: 's2', date: '2026-09-01T11:00:00Z', minutes: 50, task: 'Refactoring' },
      ]
      vi.spyOn(storageModule, 'loadSessions').mockReturnValue(dummySessions)
      const downloadCsvSpy = vi.spyOn(exportModule, 'downloadCsv').mockImplementation(() => {})

      renderModal({}, 'data')
      const csvButton = screen.getByRole('button', { name: /Arkusz CSV \(\.csv\)|Spreadsheet CSV \(\.csv\)/i })
      fireEvent.click(csvButton)

      expect(downloadCsvSpy).toHaveBeenCalledTimes(1)
      expect(downloadCsvSpy).toHaveBeenCalledWith(dummySessions)
    })

    it('clicking iCal button triggers downloadICal with sessions from storage', () => {
      const dummySessions = [
        { id: 's3', date: '2026-09-01T12:00:00Z', minutes: 25, task: 'Spec Planning' },
      ]
      vi.spyOn(storageModule, 'loadSessions').mockReturnValue(dummySessions)
      const downloadICalSpy = vi.spyOn(exportModule, 'downloadICal').mockImplementation(() => {})

      renderModal({}, 'data')
      const icalButton = screen.getByRole('button', { name: /Kalendarz iCal \(\.ics\)|iCalendar \(\.ics\)/i })
      fireEvent.click(icalButton)

      expect(downloadICalSpy).toHaveBeenCalledTimes(1)
      expect(downloadICalSpy).toHaveBeenCalledWith(dummySessions)
    })

    it('clicking JSON backup button triggers triggerDownload with exportDataString content', async () => {
      const mockJsonContent = JSON.stringify({ app: 'focus-flow', version: 2, data: {} })
      vi.spyOn(dataPortModule, 'exportDataString').mockResolvedValue(mockJsonContent)
      const triggerDownloadSpy = vi.spyOn(downloadModule, 'triggerDownload').mockImplementation(() => {})

      renderModal({}, 'data')
      const jsonButton = screen.getByRole('button', { name: /Kopia zapasowa JSON|Full JSON Backup/i })
      fireEvent.click(jsonButton)

      await waitFor(() => {
        expect(triggerDownloadSpy).toHaveBeenCalledTimes(1)
        expect(triggerDownloadSpy).toHaveBeenCalledWith(
          'focus-flow-backup-v2.json',
          mockJsonContent,
          'application/json',
        )
      })
    })
  })

  describe('Backup Import', () => {
    it('displays success message and invokes onImportSuccess when importing valid JSON', async () => {
      const onImportSuccess = vi.fn()
      vi.spyOn(dataPortModule, 'importData').mockResolvedValue({ success: true, count: 3 })

      const { container } = renderModal({ onImportSuccess }, 'data')
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
      expect(fileInput).toBeDefined()

      const validJson = JSON.stringify({ app: 'focus-flow', version: 2, exportedAt: new Date().toISOString() })
      const file = new File([validJson], 'backup.json', { type: 'application/json' })

      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText(/Dane zostały pomyślnie przywrócone|Backup restored successfully/i)).toBeDefined()
      })
      expect(onImportSuccess).toHaveBeenCalledTimes(1)
    })

    it('displays error message and does not invoke onImportSuccess when importing invalid JSON', async () => {
      const onImportSuccess = vi.fn()
      vi.spyOn(dataPortModule, 'importData').mockResolvedValue({ success: false, error: 'Malformed JSON' })

      const { container } = renderModal({ onImportSuccess }, 'data')
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
      expect(fileInput).toBeDefined()

      const corruptFile = new File(['corrupt{invalid}'], 'corrupt.json', { type: 'application/json' })

      fireEvent.change(fileInput, { target: { files: [corruptFile] } })

      await waitFor(() => {
        expect(screen.getByText(/Nieprawidłowy plik kopii zapasowej|Invalid or corrupt backup file/i)).toBeDefined()
      })
      expect(onImportSuccess).not.toHaveBeenCalled()
    })
  })

  describe('Webhook Settings & Test Dispatch', () => {
    it('loads initial values from storage and renders URL input, toggle switch, and test button', () => {
      const initialSettings: WebhookSettings = {
        url: 'https://webhook.site/initial-test',
        enabled: true,
      }
      vi.spyOn(storageModule, 'loadWebhookSettings').mockReturnValue(initialSettings)

      renderModal({}, 'webhook')

      const urlInput = screen.getByLabelText(/Adres URL docelowy|Target Webhook URL/i) as HTMLInputElement
      expect(urlInput.value).toBe('https://webhook.site/initial-test')

      const toggle = screen.getByRole('switch', { name: /Włącz powiadomienia webhook|Enable webhook dispatch/i })
      expect(toggle.getAttribute('aria-checked')).toBe('true')

      const testBtn = screen.getByRole('button', { name: /Przetestuj|Test Trigger/i })
      expect(testBtn).toBeDefined()
    })

    it('updates URL and persists automatically via saveWebhookSettings', () => {
      const saveSpy = vi.spyOn(storageModule, 'saveWebhookSettings')

      renderModal({}, 'webhook')
      const urlInput = screen.getByLabelText(/Adres URL docelowy|Target Webhook URL/i)

      fireEvent.change(urlInput, { target: { value: 'https://example.com/api/focus-hook' } })

      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://example.com/api/focus-hook',
        }),
      )
    })

    it('toggles enabled state and persists automatically via saveWebhookSettings', () => {
      const saveSpy = vi.spyOn(storageModule, 'saveWebhookSettings')

      renderModal({}, 'webhook')
      const toggle = screen.getByRole('switch', { name: /Włącz powiadomienia webhook|Enable webhook dispatch/i })

      fireEvent.click(toggle)

      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: true,
        }),
      )
    })

    it('test button calls testWebhook and displays success visual feedback', async () => {
      vi.spyOn(storageModule, 'loadWebhookSettings').mockReturnValue({
        url: 'https://api.my-server.com/hook',
        enabled: true,
      })
      const testWebhookSpy = vi.spyOn(webhookModule, 'testWebhook').mockResolvedValue({
        success: true,
        status: 200,
      })

      renderModal({}, 'webhook')
      const testBtn = screen.getByRole('button', { name: /Przetestuj|Test Trigger/i })

      fireEvent.click(testBtn)

      expect(testWebhookSpy).toHaveBeenCalledWith('https://api.my-server.com/hook')

      await waitFor(() => {
        expect(screen.getByText(/Pomyślnie wysłano \(status 200\)|Dispatched successfully \(status 200\)/i)).toBeDefined()
      })
    })

    it('test button displays error visual feedback when testWebhook returns an error', async () => {
      vi.spyOn(storageModule, 'loadWebhookSettings').mockReturnValue({
        url: 'https://invalid-host.unknown/webhook',
        enabled: true,
      })
      vi.spyOn(webhookModule, 'testWebhook').mockResolvedValue({
        success: false,
        error: 'Failed to fetch',
      })

      renderModal({}, 'webhook')
      const testBtn = screen.getByRole('button', { name: /Przetestuj|Test Trigger/i })

      fireEvent.click(testBtn)

      await waitFor(() => {
        expect(screen.getByText(/Błąd wysyłania|Dispatch failed/i)).toBeDefined()
      })
    })

    it('test button shows in-flight testing state while testWebhook is in progress', async () => {
      let resolvePromise: (value: { success: boolean; status: number }) => void
      const pendingPromise = new Promise<{ success: boolean; status: number }>((resolve) => {
        resolvePromise = resolve
      })
      vi.spyOn(webhookModule, 'testWebhook').mockReturnValue(pendingPromise)

      renderModal({}, 'webhook')
      const testBtn = screen.getByRole('button', { name: /Przetestuj|Test Trigger/i })

      fireEvent.click(testBtn)

      expect(screen.getByText(/Wysyłanie\.\.\.|Sending\.\.\./i)).toBeDefined()

      resolvePromise!({ success: true, status: 200 })

      await waitFor(() => {
        expect(screen.getByText(/Pomyślnie wysłano \(status 200\)|Dispatched successfully \(status 200\)/i)).toBeDefined()
      })
    })
  })

  describe('Notification Permissions', () => {
    it('displays prompt state and requests permission when button clicked', async () => {
      vi.spyOn(notificationsModule, 'getNotificationPermission').mockReturnValue('default')
      const requestSpy = vi.spyOn(notificationsModule, 'requestNotificationPermission').mockResolvedValue('granted')

      renderModal({}, 'notifications')
      const reqBtn = screen.getByRole('button', { name: /Zezwól na powiadomienia|Allow notifications/i })
      fireEvent.click(reqBtn)

      expect(requestSpy).toHaveBeenCalledTimes(1)
      await waitFor(() => {
        expect(screen.getByText(/Włączone|Allowed/i)).toBeDefined()
      })
    })

    it('displays denied instructions and recheck button when permission is denied', () => {
      vi.spyOn(notificationsModule, 'getNotificationPermission').mockReturnValue('denied')

      renderModal({}, 'notifications')
      expect(screen.getAllByText(/Zablokowane|Blocked/i).length).toBeGreaterThanOrEqual(1)
      expect(screen.getByRole('button', { name: /Sprawdź ponownie|Check again/i })).toBeDefined()
    })
  })

  describe('Stage 5 (v2.5) — Sensory Themes & Accessibility Controls', () => {
    it('renders all 5 sensory themes and updates theme upon selection', () => {
      const onTheme = vi.fn()
      renderModal({ onTheme }, 'theme')

      const obsidianBtn = screen.getByRole('radio', { name: /Obsydian|Obsidian/i })
      expect(obsidianBtn).toBeDefined()
      fireEvent.click(obsidianBtn)
      expect(onTheme).toHaveBeenCalledWith('obsidian')

      const sageBtn = screen.getByRole('radio', { name: /Szałwia|Sage/i })
      expect(sageBtn).toBeDefined()
      fireEvent.click(sageBtn)
      expect(onTheme).toHaveBeenCalledWith('sage')

      const einkBtn = screen.getByRole('radio', { name: /E-Ink/i })
      expect(einkBtn).toBeDefined()
      fireEvent.click(einkBtn)
      expect(onTheme).toHaveBeenCalledWith('eink')
    })

    it('updates narration verbosity and voice alerts', () => {
      const onInterfaceChange = vi.fn()
      renderModal({ onInterfaceChange }, 'a11y')

      // Narration verbosity
      const detailedTab = screen.getByRole('tab', { name: /Szczegółowa|Detailed/i })
      fireEvent.click(detailedTab)
      expect(onInterfaceChange).toHaveBeenCalledWith({
        narration: {
          verbosity: 'detailed',
          voiceAlertsEnabled: false,
        },
      })

      // Voice alerts toggle
      const voiceToggle = screen.getByRole('switch', { name: /Głosowe komunikaty|Voice alerts/i })
      fireEvent.click(voiceToggle)
      expect(onInterfaceChange).toHaveBeenCalledWith({
        narration: {
          verbosity: 'standard',
          voiceAlertsEnabled: true,
        },
      })
    })

    it('invokes onOpenShortcuts when shortcuts button is clicked', () => {
      const onOpenShortcuts = vi.fn()
      renderModal({ onOpenShortcuts }, 'main')

      const shortcutsBtn = screen.getByRole('button', { name: /Skróty klawiszowe/i })
      expect(shortcutsBtn).toBeDefined()
      fireEvent.click(shortcutsBtn)
      expect(onOpenShortcuts).toHaveBeenCalledTimes(1)
    })
  })

  describe('iOS-Style Settings Master-Detail Navigation', () => {
    it('navigates from main menu to sub-sections and back cleanly', () => {
      renderModal({}, 'main')

      // Initially on main menu, cards are visible
      expect(screen.getByRole('button', { name: /Motyw/i })).toBeDefined()
      expect(screen.getByRole('button', { name: /Dostępność/i })).toBeDefined()

      // Click on Motyw card -> enters theme view
      fireEvent.click(screen.getByRole('button', { name: /Motyw/i }))
      expect(screen.getByRole('radio', { name: /Obsydian/i })).toBeDefined()
      expect(screen.getByRole('button', { name: /Wróć|Back/i })).toBeDefined()

      // Click on Back button -> returns to main menu
      fireEvent.click(screen.getByRole('button', { name: /Wróć|Back/i }))
      expect(screen.getByRole('button', { name: /Motyw/i })).toBeDefined()

      // Click on Dostępność card -> enters a11y view
      fireEvent.click(screen.getByRole('button', { name: /Dostępność/i }))
      expect(screen.getByRole('tab', { name: /Standardowa/i })).toBeDefined()

      // Click on Back button -> returns to main menu
      fireEvent.click(screen.getByRole('button', { name: /Wróć|Back/i }))
      expect(screen.getByRole('button', { name: /Dostępność/i })).toBeDefined()
    })
  })
})
