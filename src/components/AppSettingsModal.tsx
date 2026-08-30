import { useEffect, useRef, useState } from 'react'
import { Download, Upload } from 'lucide-react'
import type { InterfacePrefs, Theme } from '../types'
import { useI18n } from '../lib/i18n'
import { detectPlatform } from '../lib/platform'
import { exportData, importData } from '../lib/dataPort'
import { Modal } from './Modal'
import { PillButton } from './PillButton'
import { SegmentedTabs } from './SegmentedTabs'
import { Switch } from './Switch'

type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported'

interface AppSettingsModalProps {
  open: boolean
  theme: Theme
  onTheme: (theme: Theme) => void
  interfacePrefs: InterfacePrefs
  onInterfaceChange: (patch: Partial<InterfacePrefs>) => void
  onClose: () => void
}

const platformLabels = {
  tauri: 'platform.tauri',
  electron: 'platform.electron',
  pwa: 'platform.pwa',
  browser: 'platform.browser',
} as const

export function AppSettingsModal({ open, theme, onTheme, interfacePrefs, onInterfaceChange, onClose }: AppSettingsModalProps) {
  const { t, lang, setLang } = useI18n()
  const fileRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState(false)
  const [permission, setPermission] = useState<NotificationPermissionState>(() =>
    typeof Notification === 'undefined' ? 'unsupported' : (Notification.permission as NotificationPermissionState),
  )
  const platform = detectPlatform()

  const refreshPermission = () => {
    setPermission(typeof Notification === 'undefined' ? 'unsupported' : (Notification.permission as NotificationPermissionState))
  }

  useEffect(() => {
    if (open) {
      const id = window.setTimeout(refreshPermission, 0)
      return () => window.clearTimeout(id)
    }
  }, [open])

  const requestNotifications = async () => {
    if (typeof Notification === 'undefined') return
    try {
      await Notification.requestPermission()
    } catch {
      // Browsers without the promise-based API throw — permission state stays as is.
    }
    refreshPermission()
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
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-caption shadow-halo transition-colors duration-150 hover:bg-sunken"
          onClick={() => {
            const backup = exportData()
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `focus-flow-backup-${new Date().toISOString().slice(0, 10)}.json`
            link.click()
            URL.revokeObjectURL(url)
          }}
        >
          <Download size={14} aria-hidden="true" />
          {t('data.export')}
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-caption shadow-halo transition-colors duration-150 hover:bg-sunken"
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={14} aria-hidden="true" />
          {t('data.import')}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
          onChange={async (event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (!file) return
            const ok = importData(await file.text())
            if (ok) {
              location.reload()
            } else {
              setImportError(true)
            }
          }}
        />
      </div>
      {importError && <p className="mt-2 text-[13px] text-danger">{t('data.importInvalid')}</p>}

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
