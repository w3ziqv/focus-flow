import { useEffect, useRef, useState } from 'react'
import { Calendar, Download, FileText, Table, Upload } from 'lucide-react'
import type { InterfacePrefs, Theme, WebhookSettings } from '../types'
import { useI18n } from '../lib/i18n'
import { detectPlatform } from '../lib/platform'
import { exportDataString, importData } from '../lib/dataPort'
import { downloadCsv, downloadICal, downloadMarkdown } from '../lib/export'
import { triggerDownload } from '../lib/download'
import { loadSessions, loadWebhookSettings, saveWebhookSettings } from '../lib/storage'
import { testWebhook } from '../lib/webhook'
import {
  getNotificationPermission,
  requestNotificationPermission,
  type NotificationPermissionState,
} from '../lib/notifications'
import { Modal } from './Modal'
import { PillButton } from './PillButton'
import { SegmentedTabs } from './SegmentedTabs'
import { Switch } from './Switch'

interface AppSettingsModalProps {
  open: boolean
  theme: Theme
  onTheme: (theme: Theme) => void
  interfacePrefs: InterfacePrefs
  onInterfaceChange: (patch: Partial<InterfacePrefs>) => void
  onClose: () => void
  onImportSuccess?: () => void
}

const platformLabels = {
  tauri: 'platform.tauri',
  electron: 'platform.electron',
  pwa: 'platform.pwa',
  browser: 'platform.browser',
} as const

export function AppSettingsModal({
  open,
  theme,
  onTheme,
  interfacePrefs,
  onInterfaceChange,
  onClose,
  onImportSuccess,
}: AppSettingsModalProps): React.JSX.Element {
  const { t, lang, setLang } = useI18n()
  const fileRef = useRef<HTMLInputElement>(null)
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [webhookSettings, setWebhookSettings] = useState<WebhookSettings>(() => loadWebhookSettings())
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [permission, setPermission] = useState<NotificationPermissionState>(getNotificationPermission)
  const platform = detectPlatform()

  const [wasOpen, setWasOpen] = useState(false)

  if (open && !wasOpen) {
    setWasOpen(true)
    setWebhookSettings(loadWebhookSettings())
    setImportStatus('idle')
    setTestStatus('idle')
  } else if (!open && wasOpen) {
    setWasOpen(false)
  }

  const refreshPermission = () => {
    setPermission(getNotificationPermission())
  }

  useEffect(() => {
    if (open) {
      const id = window.setTimeout(refreshPermission, 0)
      return () => window.clearTimeout(id)
    }
  }, [open])

  const requestNotifications = async () => {
    const next = await requestNotificationPermission()
    setPermission(next)
  }

  const handleExportMarkdown = () => {
    downloadMarkdown(loadSessions())
  }

  const handleExportCsv = () => {
    downloadCsv(loadSessions())
  }

  const handleExportICal = () => {
    downloadICal(loadSessions())
  }

  const handleExportJson = async () => {
    const json = await exportDataString()
    triggerDownload('focus-flow-backup-v2.json', json, 'application/json')
  }

  const handleImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    // Guard against massive JSON files crashing the thread (max 250 MB)
    if (file.size > 250 * 1024 * 1024) {
      setImportStatus('error')
      return
    }

    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const text = String(reader.result ?? '')
        const result = await importData(text)
        if (result && result.success) {
          setImportStatus('success')
          onImportSuccess?.()
        } else {
          setImportStatus('error')
        }
      } catch {
        setImportStatus('error')
      }
    }
    reader.onerror = () => {
      setImportStatus('error')
    }
    reader.readAsText(file)
  }

  const handleWebhookToggle = (enabled: boolean) => {
    const next: WebhookSettings = { ...webhookSettings, enabled }
    setWebhookSettings(next)
    saveWebhookSettings(next)
  }

  const handleWebhookUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    const next: WebhookSettings = { ...webhookSettings, url }
    setWebhookSettings(next)
    saveWebhookSettings(next)
    setTestStatus('idle')
  }

  const handleTestWebhook = async () => {
    setTestStatus('testing')
    try {
      const res = await testWebhook(webhookSettings.url)
      if (res.success) {
        setTestStatus('success')
      } else {
        setTestStatus('error')
      }
    } catch {
      setTestStatus('error')
    }
  }

  const permissionBadge: Partial<Record<NotificationPermissionState, { label: string; tone: 'ok' | 'bad' | 'muted' }>> = {
    granted: { label: t('perms.granted'), tone: 'ok' },
    denied: { label: t('perms.denied'), tone: 'bad' },
    default: { label: t('perms.default'), tone: 'muted' },
    unsupported: { label: t('perms.default'), tone: 'muted' },
  }
  const badge = permissionBadge[permission]!

  return (
    <Modal open={open} onClose={onClose} title={t('settings.appTitle')}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[14px] text-ink">{t('settings.theme')}</span>
        <div className="w-44">
          <SegmentedTabs
            tabs={[
              { id: 'light' as Theme, label: t('theme.light') },
              { id: 'dark' as Theme, label: t('theme.dark') },
            ]}
            value={theme}
            onChange={onTheme}
            ariaLabel={t('settings.theme')}
          />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-[14px] text-ink">{t('settings.language')}</span>
        <div className="w-44">
          <SegmentedTabs
            tabs={[
              { id: 'pl' as const, label: t('lang.pl') },
              { id: 'en' as const, label: t('lang.en') },
            ]}
            value={lang}
            onChange={setLang}
            ariaLabel={t('settings.language')}
          />
        </div>
      </div>

      <div className="my-5 h-px bg-line" />

      <p className="text-overline text-ink-3">{t('data.title')}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-caption shadow-halo transition-colors duration-150 hover:bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          onClick={handleExportMarkdown}
        >
          <FileText size={14} aria-hidden="true" />
          {t('exportMarkdown')}
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-caption shadow-halo transition-colors duration-150 hover:bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          onClick={handleExportCsv}
        >
          <Table size={14} aria-hidden="true" />
          {t('exportCsv')}
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-caption shadow-halo transition-colors duration-150 hover:bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          onClick={handleExportICal}
        >
          <Calendar size={14} aria-hidden="true" />
          {t('exportICal')}
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-caption shadow-halo transition-colors duration-150 hover:bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          onClick={handleExportJson}
        >
          <Download size={14} aria-hidden="true" />
          {t('exportJson')}
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-caption shadow-halo transition-colors duration-150 hover:bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={14} aria-hidden="true" />
          {t('data.import')}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
          data-testid="backup-file-input"
          onChange={handleImportFileChange}
        />
      </div>
      {importStatus === 'success' && (
        <div className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full bg-[var(--color-break-soft)] px-3 py-1 text-caption text-[var(--color-break-strong)]">
          <span aria-hidden="true" className="size-2 rounded-full bg-[var(--color-break)]" />
          <span>{t('importSuccess')}</span>
        </div>
      )}
      {importStatus === 'error' && (
        <div className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full bg-[rgba(181,51,51,0.12)] px-3 py-1 text-caption text-danger">
          <span aria-hidden="true" className="size-2 rounded-full bg-danger" />
          <span>{t('importInvalid')}</span>
        </div>
      )}

      <div className="my-5 h-px bg-line" />

      <p className="text-overline text-ink-3">{t('webhookTitle')}</p>
      <p className="mt-1 text-[13px] text-ink-2 leading-relaxed">{t('webhookDesc')}</p>

      <div className="mt-4 flex flex-col gap-4">
        <Switch
          checked={webhookSettings.enabled}
          onChange={handleWebhookToggle}
          label={t('webhookEnabled')}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="webhook-url-input" className="text-[13px] font-medium text-ink">
            {t('webhookUrl')}
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              id="webhook-url-input"
              type="url"
              value={webhookSettings.url}
              onChange={handleWebhookUrlChange}
              placeholder={t('webhookPlaceholder')}
              className="min-h-11 flex-1 rounded-xl border border-line bg-sunken px-3 py-2 text-[14px] text-ink placeholder:text-ink-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
            <button
              type="button"
              disabled={testStatus === 'testing'}
              onClick={handleTestWebhook}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-caption text-ink shadow-halo transition-colors duration-150 hover:bg-sunken disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {testStatus === 'testing' ? t('webhookTesting') : t('webhookTest')}
            </button>
          </div>
        </div>

        {testStatus === 'success' && (
          <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-[var(--color-break-soft)] px-3 py-1 text-caption text-[var(--color-break-strong)]">
            <span aria-hidden="true" className="size-2 rounded-full bg-[var(--color-break)]" />
            <span>{t('webhookSuccess')}</span>
          </div>
        )}

        {testStatus === 'error' && (
          <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-[rgba(181,51,51,0.12)] px-3 py-1 text-caption text-danger">
            <span aria-hidden="true" className="size-2 rounded-full bg-danger" />
            <span>{t('webhookError')}</span>
          </div>
        )}
      </div>

        <div className="my-5 h-px bg-line" />

        <p className="text-overline text-ink-3">{t('perms.title')}</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-[14px] text-ink">{t('perms.notifications')}</span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption ${
              permission === 'granted'
                ? 'bg-[var(--color-break-soft)] text-[var(--color-break-strong)]'
                : permission === 'denied'
                  ? 'bg-[rgba(181,51,51,0.12)] text-danger'
                  : 'bg-sunken text-ink-2'
            }`}
          >
            <span
              aria-hidden="true"
              className={`size-2 rounded-full ${
                permission === 'granted' ? 'bg-[var(--color-break)]' : permission === 'denied' ? 'bg-danger' : 'bg-ink-3'
              }`}
            />
            {badge.label}
          </span>
        </div>
        {permission === 'default' && (
          <div className="mt-3">
            <PillButton variant="secondary" onClick={requestNotifications}>
              {t('perms.request')}
            </PillButton>
          </div>
        )}
        {permission === 'denied' && (
          <div className="mt-3 flex flex-col items-start gap-2">
            <p className="text-[13px] leading-relaxed text-ink-2">{t('perms.howTo')}</p>
            <PillButton variant="secondary" onClick={refreshPermission}>
              {t('perms.recheck')}
            </PillButton>
          </div>
        )}

        <div className="my-5 h-px bg-line" />

        <p className="text-overline text-ink-3">{t('interface.title')}</p>
      <div className="mt-4 flex flex-col gap-4">
        <Switch
          checked={interfacePrefs.reduceMotion}
          onChange={(reduceMotion) => onInterfaceChange({ reduceMotion })}
          label={t('interface.reduceMotion')}
        />
        <Switch
          checked={interfacePrefs.showGreeting}
          onChange={(showGreeting) => onInterfaceChange({ showGreeting })}
          label={t('interface.showGreeting')}
        />
      </div>

      <p className="mt-6 text-[12px] text-ink-3">
        Focus Flow v{__APP_VERSION__} · {t(platformLabels[platform])}
      </p>
    </Modal>
  )
}
