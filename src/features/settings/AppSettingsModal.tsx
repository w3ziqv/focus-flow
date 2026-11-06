import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { JSX, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Bell,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Download,
  FileText,
  Globe,
  Keyboard,
  Link2,
  Monitor,
  Palette,
  Radio,
  Table,
  Upload,
  Volume2,
} from 'lucide-react'
import type { InterfacePrefs, Theme, WebhookSettings } from '../../types'
import { useI18n } from '../../lib/i18n'
import { LANGUAGE_CODES, LANGUAGE_META } from '../../domain/language'
import type { TranslationKey } from '../../lib/translations'
import { THEMES, THEME_TOKENS } from '../../lib/theme'
import { getAvailableVoices, speakNarration } from '../../lib/speech'
import { detectPlatform } from '../../lib/platform'
import { Exporter } from '../../lib/exporter'
import { loadWebhookSettings, saveWebhookSettings } from '../../lib/storage'
import { testWebhook } from '../../lib/webhook'
import {
  getNotificationPermission,
  requestNotificationPermission,
  type NotificationPermissionState,
} from '../../lib/notifications'
import { MotionSurface } from '../../ui/motion/MotionSurface'
import { Modal } from '../../ui/Modal'
import { PillButton } from '../../ui/PillButton'
import { SegmentedTabs } from '../../ui/SegmentedTabs'
import { Switch } from '../../ui/Switch'

const DesktopSettings = lazy(() => import('../desktop/DesktopSettings'))

export type SettingsSection =
  | 'main'
  | 'theme'
  | 'language'
  | 'a11y'
  | 'shortcuts'
  | 'data'
  | 'webhook'
  | 'notifications'
  | 'desktop'
  | 'peer'

interface AppSettingsModalProps {
  open: boolean
  theme: Theme
  onTheme: (theme: Theme) => void
  interfacePrefs: InterfacePrefs
  onInterfaceChange: (patch: Partial<InterfacePrefs>) => void
  onClose: () => void
  onOpenShortcuts?: () => void
  onOpenCloudSync?: () => void
  onImportSuccess?: () => void
  initialSection?: SettingsSection
}

const platformLabels = {
  tauri: 'platform.tauri',
  electron: 'platform.electron',
  pwa: 'platform.pwa',
  browser: 'platform.browser',
} as const

function SettingsRow({ icon: Icon, title, description, onClick, trailing }: {
  icon: LucideIcon
  title: string
  description?: string
  onClick: () => void
  trailing?: ReactNode
}): JSX.Element {
  return <button type="button" className="settings-row" onClick={onClick}>
    <Icon size={18} strokeWidth={1.65} className="settings-row-icon" aria-hidden="true" />
    <span className="settings-row-copy"><span className="settings-row-title">{title}</span>
      {description && <span className="settings-row-description">{description}</span>}
    </span>
    {trailing}<ChevronRight size={16} className="settings-row-chevron" aria-hidden="true" />
  </button>
}

export function AppSettingsModal({
  open,
  theme,
  onTheme,
  interfacePrefs,
  onInterfaceChange,
  onClose,
  onOpenShortcuts,
  onOpenCloudSync,
  onImportSuccess,
  initialSection = 'main',
}: AppSettingsModalProps): JSX.Element | null {
  const { t, lang, setLang } = useI18n()
  const fileRef = useRef<HTMLInputElement>(null)
  const importing = useRef(false)
  const [section, setSection] = useState<SettingsSection>(initialSection)
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error' | 'storage-error'>('idle')
  const [webhookSettings, setWebhookSettings] = useState<WebhookSettings>(() => loadWebhookSettings())
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [voiceTestStatus, setVoiceTestStatus] = useState<'idle' | 'testing' | 'success' | 'no-voices'>('idle')
  const [permission, setPermission] = useState<NotificationPermissionState>(getNotificationPermission)
  const platform = detectPlatform()

  const [wasOpen, setWasOpen] = useState(false)

  if (open && !wasOpen) {
    setWasOpen(true)
    setSection(initialSection)
    setDirection('forward')
    setWebhookSettings(loadWebhookSettings())
    setImportStatus('idle')
    setTestStatus('idle')
    setVoiceTestStatus('idle')
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
    void Exporter.download('markdown')
  }

  const handleExportCsv = () => {
    void Exporter.download('csv')
  }

  const handleExportICal = () => {
    void Exporter.download('ics')
  }

  const handleExportJson = () => {
    void Exporter.download('json')
  }

  const handleImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || importing.current) return

    // Guard against massive JSON files crashing the thread (max 250 MB)
    if (file.size > 250 * 1024 * 1024) {
      setImportStatus('error')
      return
    }

    importing.current = true
    setImportStatus('importing')
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const text = String(reader.result ?? '')
        const result = await Exporter.importBackup(text)
        if (result && result.success) {
          setImportStatus('success')
          onImportSuccess?.()
        } else {
          setImportStatus(result && !result.success && result.reason === 'storage' ? 'storage-error' : 'error')
        }
      } catch {
        setImportStatus('error')
      } finally {
        importing.current = false
      }
    }
    reader.onerror = () => {
      importing.current = false
      setImportStatus('error')
    }
    try { reader.readAsText(file) } catch {
      importing.current = false
      setImportStatus('error')
    }
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

  const handleTestVoice = () => {
    const voices = getAvailableVoices()
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && voices.length === 0) {
      setVoiceTestStatus('no-voices')
    } else {
      setVoiceTestStatus('testing')
    }
    speakNarration(
      t('narration.testPhrase'),
      lang,
      true,
      () => setVoiceTestStatus('success'),
      () => setVoiceTestStatus('no-voices'),
    )
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

  const goToSection = (next: SettingsSection) => {
    setDirection('forward')
    setSection(next)
  }

  const goBack = () => {
    setDirection('backward')
    setSection('main')
  }

  const permissionBadge: Partial<Record<NotificationPermissionState, { label: string; tone: 'ok' | 'bad' | 'muted' }>> = {
    granted: { label: t('perms.granted'), tone: 'ok' },
    denied: { label: t('perms.denied'), tone: 'bad' },
    default: { label: t('perms.default'), tone: 'muted' },
    unsupported: { label: t('perms.default'), tone: 'muted' },
  }
  const badge = permissionBadge[permission]!

  const modalTitle =
    section === 'main'
      ? t('settings.appTitle')
      : section === 'theme'
        ? t('settings.theme')
        : section === 'language'
          ? t('settings.language')
          : section === 'a11y'
            ? t('a11y.title')
            : section === 'shortcuts'
              ? t('shortcuts.title')
              : section === 'data'
                ? t('data.title')
                : section === 'webhook'
                  ? t('webhookTitle')
                  : section === 'desktop'
                    ? t('desktop.title')
                    : section === 'peer'
                      ? t('peer.title')
                      : t('settings.notifications')

  return (
    <Modal open={open} onClose={onClose} title={modalTitle} className="settings-panel">
      <MotionSurface value={section} direction={direction} resize>
      {section !== 'main' && (
        <button
          type="button"
          onClick={goBack}
          className="settings-subview-back"
        >
          <ChevronLeft size={16} className="transition-transform duration-150 group-hover:-translate-x-0.5 group-active:-translate-x-1" aria-hidden="true" />
          {t('common.back')}
        </button>
      )}

      {section === 'main' && (
        <div className="settings-overview">
          <p className="settings-intro">{t('settings.description')}</p>
          <section className="settings-group">
            <h3>{t('settings.appearance')}</h3>
            <div className="settings-group-rows">
              <SettingsRow icon={Palette} title={t('settings.theme')} description={t(THEME_TOKENS[theme].nameKey as TranslationKey)} onClick={() => goToSection('theme')}
                trailing={<span className="settings-theme-dot" style={{ backgroundColor: THEME_TOKENS[theme].surfacePage }} />} />
              <SettingsRow icon={Globe} title={t('settings.language')} description={LANGUAGE_META[lang].name} onClick={() => goToSection('language')} />
            </div>
          </section>
          <section className="settings-group">
            <h3>{t('settings.comfort')}</h3>
            <div className="settings-group-rows">
              <SettingsRow icon={Volume2} title={t('a11y.title')} description={interfacePrefs.narration?.voiceAlertsEnabled ? t('narration.voiceAlerts') : t('narration.standard')} onClick={() => goToSection('a11y')} />
              <SettingsRow icon={Keyboard} title={t('shortcuts.title')} onClick={() => onOpenShortcuts ? onOpenShortcuts() : goToSection('shortcuts')}
                trailing={<kbd className="settings-shortcut">?</kbd>} />
              <SettingsRow icon={Bell} title={t('settings.notifications')} description={badge.label} onClick={() => goToSection('notifications')} />
            </div>
          </section>
          <section className="settings-group">
            <h3>{t('settings.storage')}</h3>
            <div className="settings-group-rows">
              {onOpenCloudSync && <SettingsRow icon={Cloud} title={t('sync.title')} description={t('settings.syncSummary')} onClick={onOpenCloudSync} />}
              <SettingsRow icon={Download} title={t('data.title')} description={t('settings.dataSummary')} onClick={() => goToSection('data')} />
              {platform === 'tauri' && <SettingsRow icon={Monitor} title={t('desktop.title')} description={t('desktop.summary')} onClick={() => goToSection('desktop')} />}
            </div>
          </section>
          <details className="settings-advanced">
            <summary>{t('settings.advanced')}</summary>
            <div className="settings-group-rows">
              {platform === 'tauri' && <SettingsRow icon={Link2} title={t('peer.title')} description={t('peer.summary')} onClick={() => goToSection('peer')} />}
              <SettingsRow icon={Radio} title={t('webhookTitle')} description={webhookSettings.enabled ? t('webhook.active') : t('webhookEnabled')} onClick={() => goToSection('webhook')} />
            </div>
          </details>
          <div className="settings-footer"><span>Focus Flow {__APP_VERSION__}</span><span>{t(platformLabels[platform])}</span></div>
        </div>
      )}

      {/* Subview: Theme */}
      {section === 'theme' && (
        <div className="settings-theme-options" role="radiogroup" aria-label={t('settings.theme')}>
          {THEMES.map((th) => {
            const isSelected = theme === th.id
            return (
              <button
                key={th.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onTheme(th.id)}
                className={`settings-theme-option ${isSelected ? 'is-selected' : ''}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="settings-theme-preview" aria-hidden="true" style={{ backgroundColor: th.surfacePage, color: th.accentFocus, borderColor: th.textSecondary }}>
                    <span className="settings-theme-preview-line" style={{ background: th.textPrimary }} />
                    <span className="settings-theme-preview-dial" />
                    <span className="settings-theme-preview-line short" style={{ background: th.textSecondary }} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[14px] font-medium text-ink leading-snug">{t(th.nameKey as TranslationKey)}</div>
                    <div className="text-[12px] text-ink-3 leading-snug">{t(th.descKey as TranslationKey)}</div>
                  </div>
                </div>
                {isSelected && (
                  <div className="size-6 rounded-full bg-accent text-on-accent flex items-center justify-center shrink-0 ml-2">
                    <Check size={14} aria-hidden="true" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Subview: Language */}
      {section === 'language' && (
        <div className="rounded-panel border border-line bg-card overflow-hidden divide-y divide-line/60">
          {LANGUAGE_CODES.map(code => (
            <button key={code} type="button" lang={LANGUAGE_META[code].htmlLang}
              aria-pressed={lang === code} onClick={() => setLang(code)}
              className="flex w-full items-center justify-between p-3.5 text-left transition-colors hover:bg-sunken/60 min-h-[52px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <span className="text-[14px] font-medium text-ink">{LANGUAGE_META[code].name}</span>
              {lang === code && <Check size={16} className="text-accent" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}

      {/* Subview: Accessibility & Narration */}
      {section === 'a11y' && (
        <div className="flex flex-col gap-4">
          <div>
            <span className="text-[14px] font-medium text-ink block mb-2">{t('narration.verbosity')}</span>
            <SegmentedTabs
              tabs={[
                { id: 'minimal' as const, label: t('narration.minimal') },
                { id: 'standard' as const, label: t('narration.standard') },
                { id: 'detailed' as const, label: t('narration.detailed') },
              ]}
              value={interfacePrefs.narration?.verbosity ?? 'standard'}
              onChange={(verbosity) =>
                onInterfaceChange({
                  narration: {
                    verbosity,
                    voiceAlertsEnabled: interfacePrefs.narration?.voiceAlertsEnabled ?? false,
                  },
                })
              }
              ariaLabel={t('narration.verbosity')}
            />
          </div>

          <Switch
            checked={interfacePrefs.narration?.voiceAlertsEnabled ?? false}
            onChange={(voiceAlertsEnabled) =>
              onInterfaceChange({
                narration: {
                  verbosity: interfacePrefs.narration?.verbosity ?? 'standard',
                  voiceAlertsEnabled,
                },
              })
            }
            label={t('narration.voiceAlerts')}
          />

          {interfacePrefs.narration?.voiceAlertsEnabled && (
            <div className="flex flex-col gap-2 p-3 rounded-control border border-line/70 bg-card/60">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] text-ink-2">{t('narration.voiceAlertsDesc')}</span>
                <button
                  type="button"
                  onClick={handleTestVoice}
                  disabled={voiceTestStatus === 'testing'}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-line bg-page px-3 py-1 text-caption font-medium text-ink hover:bg-sunken transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent shrink-0"
                >
                  <Volume2 size={14} aria-hidden="true" />
                  {voiceTestStatus === 'testing' ? t('narration.testing') : t('narration.testVoice')}
                </button>
              </div>
              {voiceTestStatus === 'success' && (
                <p className="text-[12px] text-[var(--color-break-strong)]">{t('narration.testSuccess')}</p>
              )}
              {voiceTestStatus === 'no-voices' && (
                <p className="text-[12px] text-danger leading-tight">{t('narration.noVoices')}</p>
              )}
            </div>
          )}

          <div className="h-px bg-line/60 my-1" />

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
      )}

      {/* Subview: Shortcuts */}
      {section === 'shortcuts' && (
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-ink-2 leading-relaxed">{t('shortcuts.desc')}</p>
          <div className="rounded-control border border-line bg-card divide-y divide-line/60">
            <div className="flex items-center justify-between p-3">
              <span className="text-[14px] text-ink">{t('shortcuts.toggleTimer')}</span>
              <kbd className="inline-flex min-h-[28px] items-center px-2 rounded border border-line bg-page text-caption font-sans text-ink">
                {t('shortcuts.space')}
              </kbd>
            </div>
            <div className="flex items-center justify-between p-3">
              <span className="text-[14px] text-ink">{t('shortcuts.resetTimer')}</span>
              <kbd className="inline-flex min-h-[28px] items-center px-2 rounded border border-line bg-page text-caption font-sans text-ink">
                R
              </kbd>
            </div>
            <div className="flex items-center justify-between p-3">
              <span className="text-[14px] text-ink">{t('shortcuts.toggleFullscreen')}</span>
              <kbd className="inline-flex min-h-[28px] items-center px-2 rounded border border-line bg-page text-caption font-sans text-ink">
                F
              </kbd>
            </div>
            <div className="flex items-center justify-between p-3">
              <span className="text-[14px] text-ink">{t('shortcuts.openSettings')}</span>
              <kbd className="inline-flex min-h-[28px] items-center px-2 rounded border border-line bg-page text-caption font-sans text-ink">
                ?
              </kbd>
            </div>
            <div className="flex items-center justify-between p-3">
              <span className="text-[14px] text-ink">{t('shortcuts.closeModal')}</span>
              <kbd className="inline-flex min-h-[28px] items-center px-2 rounded border border-line bg-page text-caption font-sans text-ink-2">
                Esc
              </kbd>
            </div>
          </div>
          {onOpenShortcuts && (
            <div className="pt-2">
              <PillButton variant="secondary" onClick={onOpenShortcuts} className="w-full justify-center">
                {t('shortcuts.openButton')}
              </PillButton>
            </div>
          )}
        </div>
      )}

      {/* Subview: Data & Backup */}
      {section === 'data' && (
        <div className="flex flex-col gap-4">
          <p className="text-[13px] text-ink-2 leading-relaxed">
            {t('data.description')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-control border border-line bg-card px-3.5 py-2 text-caption transition-colors duration-150 hover:bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              onClick={handleExportMarkdown}
            >
              <FileText size={15} aria-hidden="true" />
              {t('exportMarkdown')}
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-control border border-line bg-card px-3.5 py-2 text-caption transition-colors duration-150 hover:bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              onClick={handleExportCsv}
            >
              <Table size={15} aria-hidden="true" />
              {t('exportCsv')}
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-control border border-line bg-card px-3.5 py-2 text-caption transition-colors duration-150 hover:bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              onClick={handleExportICal}
            >
              <Calendar size={15} aria-hidden="true" />
              {t('exportICal')}
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-control border border-line bg-card px-3.5 py-2 text-caption transition-colors duration-150 hover:bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              onClick={handleExportJson}
            >
              <Download size={15} aria-hidden="true" />
              {t('exportJson')}
            </button>
          </div>

          <div className="pt-2">
            <button
              type="button"
              disabled={importStatus === 'importing'}
              aria-busy={importStatus === 'importing'}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-control border border-line bg-sunken/50 px-4 py-2 text-caption font-medium text-ink transition-colors duration-150 hover:bg-sunken disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={15} aria-hidden="true" />
              {t(importStatus === 'importing' ? 'common.loading' : 'data.import')}
            </button>
            <input
              ref={fileRef}
              type="file"
              disabled={importStatus === 'importing'}
              accept=".json,application/json"
              className="sr-only"
              aria-hidden="true"
              tabIndex={-1}
              data-testid="backup-file-input"
              onChange={handleImportFileChange}
            />
          </div>

          {importStatus === 'success' && (
            <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-[var(--color-break-soft)] px-3 py-1 text-caption text-[var(--color-break-strong)]">
              <span aria-hidden="true" className="size-2 rounded-full bg-[var(--color-break)]" />
              <span>{t('importSuccess')}</span>
            </div>
          )}
          {(importStatus === 'error' || importStatus === 'storage-error') && (
            <div role="alert" className="inline-flex items-center gap-1.5 self-start rounded-full bg-[rgba(181,51,51,0.12)] px-3 py-1 text-caption text-danger">
              <span aria-hidden="true" className="size-2 rounded-full bg-danger" />
              <span>{t(importStatus === 'storage-error' ? 'importStorageError' : 'importInvalid')}</span>
            </div>
          )}
        </div>
      )}

      {/* Subview: Webhook */}
      {section === 'webhook' && (
        <div className="flex flex-col gap-4">
          <p className="text-[13px] text-ink-2 leading-relaxed">{t('webhookDesc')}</p>

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
                className="min-h-11 flex-1 rounded-control border border-line bg-sunken px-3 py-2 text-[14px] text-ink placeholder:text-ink-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
              <button
                type="button"
                disabled={testStatus === 'testing'}
                onClick={handleTestWebhook}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-line bg-card px-4 py-2 text-caption text-ink transition-colors duration-150 hover:bg-sunken disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
            <div role="alert" className="inline-flex items-center gap-1.5 self-start rounded-full bg-[rgba(181,51,51,0.12)] px-3 py-1 text-caption text-danger">
              <span aria-hidden="true" className="size-2 rounded-full bg-danger" />
              <span>{t('webhookError')}</span>
            </div>
          )}
        </div>
      )}

      {/* Subview: Notifications */}
      {platform === 'tauri' && (section === 'desktop' || section === 'peer') && (
        <Suspense fallback={null}><DesktopSettings section={section} /></Suspense>
      )}

      {section === 'notifications' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[14px] font-medium text-ink">{t('perms.notifications')}</span>
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
            <div className="mt-2">
              <PillButton variant="secondary" onClick={requestNotifications} className="w-full justify-center">
                {t('perms.request')}
              </PillButton>
            </div>
          )}

          {permission === 'denied' && (
            <div className="mt-2 flex flex-col items-start gap-3">
              <p className="text-[13px] leading-relaxed text-ink-2">{t('perms.howTo')}</p>
              <PillButton variant="secondary" onClick={refreshPermission} className="w-full justify-center">
                {t('perms.recheck')}
              </PillButton>
            </div>
          )}
        </div>
      )}
      </MotionSurface>
    </Modal>
  )
}
