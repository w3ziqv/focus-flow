import { useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'
import {
  Bell,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Globe,
  Keyboard,
  Palette,
  Radio,
  Table,
  Upload,
  Volume2,
} from 'lucide-react'
import type { InterfacePrefs, Theme, WebhookSettings } from '../types'
import { useI18n } from '../lib/i18n'
import type { TranslationKey } from '../lib/translations'
import { THEMES, THEME_TOKENS } from '../lib/theme'
import { getAvailableVoices, speakNarration } from '../lib/speech'
import { detectPlatform } from '../lib/platform'
import { Exporter } from '../lib/exporter'
import { loadWebhookSettings, saveWebhookSettings } from '../lib/storage'
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

export type SettingsSection =
  | 'main'
  | 'theme'
  | 'language'
  | 'a11y'
  | 'shortcuts'
  | 'data'
  | 'webhook'
  | 'notifications'

interface AppSettingsModalProps {
  open: boolean
  theme: Theme
  onTheme: (theme: Theme) => void
  interfacePrefs: InterfacePrefs
  onInterfaceChange: (patch: Partial<InterfacePrefs>) => void
  onClose: () => void
  onOpenShortcuts?: () => void
  onImportSuccess?: () => void
  initialSection?: SettingsSection
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
  onOpenShortcuts,
  onImportSuccess,
  initialSection = 'main',
}: AppSettingsModalProps): JSX.Element | null {
  const { t, lang, setLang } = useI18n()
  const fileRef = useRef<HTMLInputElement>(null)
  const [section, setSection] = useState<SettingsSection>(initialSection)
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')
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
        const result = await Exporter.importBackup(text)
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
                  : t('settings.notifications')

  return (
    <Modal open={open} onClose={onClose} title={modalTitle}>
      {section !== 'main' && (
        <button
          type="button"
          onClick={goBack}
          className="group inline-flex items-center gap-1.5 text-caption font-medium text-accent hover:text-accent-strong active:scale-[0.98] transition-all mb-4 -mt-2 min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg pr-2"
        >
          <ChevronLeft size={16} className="transition-transform duration-150 group-hover:-translate-x-0.5 group-active:-translate-x-1" aria-hidden="true" />
          {t('common.back')}
        </button>
      )}

      <div
        key={section}
        className={direction === 'forward' ? 'slide-enter-right' : 'slide-enter-left'}
      >
      {section === 'main' && (
        <div className="flex flex-col gap-3.5">
          {/* Group 1: Appearance & Localization */}
          <div className="rounded-2xl border border-line bg-card overflow-hidden divide-y divide-line/60">
            <button
              type="button"
              onClick={() => goToSection('theme')}
              className="flex w-full items-center justify-between p-3.5 text-left transition-all duration-150 hover:bg-sunken/60 active:scale-[0.985] active:bg-sunken min-h-[52px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <Palette size={17} aria-hidden="true" />
                </div>
                <div>
                  <div className="text-[14px] font-medium text-ink leading-snug">{t('settings.theme')}</div>
                  <div className="text-[12px] text-ink-3 leading-snug">{t(THEME_TOKENS[theme].nameKey as TranslationKey)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="size-4 rounded-full border border-black/15 shrink-0"
                  style={{ backgroundColor: THEME_TOKENS[theme].surfacePage }}
                />
                <ChevronRight size={16} className="text-ink-3" aria-hidden="true" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => goToSection('language')}
              className="flex w-full items-center justify-between p-3.5 text-left transition-all duration-150 hover:bg-sunken/60 active:scale-[0.985] active:bg-sunken min-h-[52px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[rgba(56,152,236,0.12)] text-[#3898ec]">
                  <Globe size={17} aria-hidden="true" />
                </div>
                <div>
                  <div className="text-[14px] font-medium text-ink leading-snug">{t('settings.language')}</div>
                  <div className="text-[12px] text-ink-3 leading-snug">{lang === 'pl' ? t('lang.pl') : t('lang.en')}</div>
                </div>
              </div>
              <ChevronRight size={16} className="text-ink-3" aria-hidden="true" />
            </button>
          </div>

          {/* Group 2: Ergonomics & A11y */}
          <div className="rounded-2xl border border-line bg-card overflow-hidden divide-y divide-line/60">
            <button
              type="button"
              onClick={() => goToSection('a11y')}
              className="flex w-full items-center justify-between p-3.5 text-left transition-all duration-150 hover:bg-sunken/60 active:scale-[0.985] active:bg-sunken min-h-[52px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[var(--color-break-soft)] text-[var(--color-break)]">
                  <Volume2 size={17} aria-hidden="true" />
                </div>
                <div>
                  <div className="text-[14px] font-medium text-ink leading-snug">{t('a11y.title')}</div>
                  <div className="text-[12px] text-ink-3 leading-snug">
                    {interfacePrefs.narration?.voiceAlertsEnabled ? t('narration.voiceAlerts') : t('narration.standard')}
                  </div>
                </div>
              </div>
              <ChevronRight size={16} className="text-ink-3" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (onOpenShortcuts) onOpenShortcuts()
                else goToSection('shortcuts')
              }}
              className="flex w-full items-center justify-between p-3.5 text-left transition-all duration-150 hover:bg-sunken/60 active:scale-[0.985] active:bg-sunken min-h-[52px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-sunken text-ink">
                  <Keyboard size={17} aria-hidden="true" />
                </div>
                <div>
                  <div className="text-[14px] font-medium text-ink leading-snug">{t('shortcuts.title')}</div>
                  <div className="text-[12px] text-ink-3 leading-snug">{t('shortcuts.desc')}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="inline-flex min-h-[22px] min-w-[22px] items-center justify-center rounded border border-line bg-page text-[11px] font-mono text-ink-3">
                  ?
                </kbd>
                <ChevronRight size={16} className="text-ink-3" aria-hidden="true" />
              </div>
            </button>
          </div>

          {/* Group 3: Data, Webhook & Notifications */}
          <div className="rounded-2xl border border-line bg-card overflow-hidden divide-y divide-line/60">
            <button
              type="button"
              onClick={() => goToSection('data')}
              className="flex w-full items-center justify-between p-3.5 text-left transition-all duration-150 hover:bg-sunken/60 active:scale-[0.985] active:bg-sunken min-h-[52px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[rgba(90,114,72,0.12)] text-[#5a7248]">
                  <Download size={17} aria-hidden="true" />
                </div>
                <div>
                  <div className="text-[14px] font-medium text-ink leading-snug">{t('data.title')}</div>
                  <div className="text-[12px] text-ink-3 leading-snug">Markdown, CSV, iCal, JSON</div>
                </div>
              </div>
              <ChevronRight size={16} className="text-ink-3" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => goToSection('webhook')}
              className="flex w-full items-center justify-between p-3.5 text-left transition-all duration-150 hover:bg-sunken/60 active:scale-[0.985] active:bg-sunken min-h-[52px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[rgba(201,100,66,0.12)] text-[#c96442]">
                  <Radio size={17} aria-hidden="true" />
                </div>
                <div>
                  <div className="text-[14px] font-medium text-ink leading-snug">{t('webhookTitle')}</div>
                  <div className="text-[12px] text-ink-3 leading-snug">
                    {webhookSettings.enabled ? 'HTTP POST (Aktywny)' : t('webhookEnabled')}
                  </div>
                </div>
              </div>
              <ChevronRight size={16} className="text-ink-3" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => goToSection('notifications')}
              className="flex w-full items-center justify-between p-3.5 text-left transition-all duration-150 hover:bg-sunken/60 active:scale-[0.985] active:bg-sunken min-h-[52px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[rgba(245,158,11,0.12)] text-[#f59e0b]">
                  <Bell size={17} aria-hidden="true" />
                </div>
                <div>
                  <div className="text-[14px] font-medium text-ink leading-snug">{t('settings.notifications')}</div>
                  <div className="text-[12px] text-ink-3 leading-snug">{badge.label}</div>
                </div>
              </div>
              <ChevronRight size={16} className="text-ink-3" aria-hidden="true" />
            </button>
          </div>

          <p className="mt-3 text-[12px] text-ink-3 text-center">
            Focus Flow v{__APP_VERSION__} · {t(platformLabels[platform])}
          </p>
        </div>
      )}

      {/* Subview: Theme */}
      {section === 'theme' && (
        <div className="flex flex-col gap-2.5" role="radiogroup" aria-label={t('settings.theme')}>
          {THEMES.map((th) => {
            const isSelected = theme === th.id
            return (
              <button
                key={th.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onTheme(th.id)}
                className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all min-h-[58px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isSelected
                    ? 'border-accent bg-accent-soft text-ink shadow-sm'
                    : 'border-line bg-card hover:bg-sunken/60 text-ink-2'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="size-7 rounded-full border border-black/15 shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: th.surfacePage }}
                  >
                    <div
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: th.accentFocus }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[14px] font-medium text-ink leading-snug">{t(th.nameKey as TranslationKey)}</div>
                    <div className="text-[12px] text-ink-3 leading-snug truncate">{t(th.descKey as TranslationKey)}</div>
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
        <div className="rounded-2xl border border-line bg-card overflow-hidden divide-y divide-line/60">
          <button
            type="button"
            onClick={() => setLang('pl')}
            className="flex w-full items-center justify-between p-3.5 text-left transition-colors hover:bg-sunken/60 min-h-[52px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span className="text-[14px] font-medium text-ink">{t('lang.pl')}</span>
            {lang === 'pl' && <Check size={16} className="text-accent" aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            className="flex w-full items-center justify-between p-3.5 text-left transition-colors hover:bg-sunken/60 min-h-[52px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span className="text-[14px] font-medium text-ink">{t('lang.en')}</span>
            {lang === 'en' && <Check size={16} className="text-accent" aria-hidden="true" />}
          </button>
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
            <div className="flex flex-col gap-2 p-3 rounded-xl border border-line/70 bg-card/60">
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
                <p className="text-[12px] text-[var(--color-break-strong)]">✓ {t('narration.testSuccess')}</p>
              )}
              {voiceTestStatus === 'no-voices' && (
                <p className="text-[12px] text-danger leading-tight">⚠ {t('narration.noVoices')}</p>
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
          <div className="rounded-xl border border-line bg-card divide-y divide-line/60">
            <div className="flex items-center justify-between p-3">
              <span className="text-[14px] text-ink">{t('shortcuts.toggleTimer')}</span>
              <kbd className="inline-flex min-h-[28px] items-center px-2 rounded border border-line bg-page text-caption font-mono text-ink">
                Space
              </kbd>
            </div>
            <div className="flex items-center justify-between p-3">
              <span className="text-[14px] text-ink">{t('shortcuts.resetTimer')}</span>
              <kbd className="inline-flex min-h-[28px] items-center px-2 rounded border border-line bg-page text-caption font-mono text-ink">
                R
              </kbd>
            </div>
            <div className="flex items-center justify-between p-3">
              <span className="text-[14px] text-ink">{t('shortcuts.toggleFullscreen')}</span>
              <kbd className="inline-flex min-h-[28px] items-center px-2 rounded border border-line bg-page text-caption font-mono text-ink">
                F
              </kbd>
            </div>
            <div className="flex items-center justify-between p-3">
              <span className="text-[14px] text-ink">{t('shortcuts.openSettings')}</span>
              <kbd className="inline-flex min-h-[28px] items-center px-2 rounded border border-line bg-page text-caption font-mono text-ink">
                ?
              </kbd>
            </div>
            <div className="flex items-center justify-between p-3">
              <span className="text-[14px] text-ink">{t('shortcuts.closeModal')}</span>
              <kbd className="inline-flex min-h-[28px] items-center px-2 rounded border border-line bg-page text-caption font-mono text-ink-2">
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
            Eksportuj historię sesji do popularnych formatów lub zarządzaj pełną kopią zapasową aplikacji.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-card px-3.5 py-2 text-caption shadow-halo transition-colors duration-150 hover:bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              onClick={handleExportMarkdown}
            >
              <FileText size={15} aria-hidden="true" />
              {t('exportMarkdown')}
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-card px-3.5 py-2 text-caption shadow-halo transition-colors duration-150 hover:bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              onClick={handleExportCsv}
            >
              <Table size={15} aria-hidden="true" />
              {t('exportCsv')}
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-card px-3.5 py-2 text-caption shadow-halo transition-colors duration-150 hover:bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              onClick={handleExportICal}
            >
              <Calendar size={15} aria-hidden="true" />
              {t('exportICal')}
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-card px-3.5 py-2 text-caption shadow-halo transition-colors duration-150 hover:bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              onClick={handleExportJson}
            >
              <Download size={15} aria-hidden="true" />
              {t('exportJson')}
            </button>
          </div>

          <div className="pt-2">
            <button
              type="button"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-sunken/50 px-4 py-2 text-caption font-medium text-ink transition-colors duration-150 hover:bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={15} aria-hidden="true" />
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
            <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-[var(--color-break-soft)] px-3 py-1 text-caption text-[var(--color-break-strong)]">
              <span aria-hidden="true" className="size-2 rounded-full bg-[var(--color-break)]" />
              <span>{t('importSuccess')}</span>
            </div>
          )}
          {importStatus === 'error' && (
            <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-[rgba(181,51,51,0.12)] px-3 py-1 text-caption text-danger">
              <span aria-hidden="true" className="size-2 rounded-full bg-danger" />
              <span>{t('importInvalid')}</span>
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
                className="min-h-11 flex-1 rounded-xl border border-line bg-sunken px-3 py-2 text-[14px] text-ink placeholder:text-ink-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
              <button
                type="button"
                disabled={testStatus === 'testing'}
                onClick={handleTestWebhook}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-card px-4 py-2 text-caption text-ink shadow-halo transition-colors duration-150 hover:bg-sunken disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
      )}

      {/* Subview: Notifications */}
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
      </div>
    </Modal>
  )
}
