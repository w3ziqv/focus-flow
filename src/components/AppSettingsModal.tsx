import { useRef, useState } from 'react'
import { Download, Upload } from 'lucide-react'
import type { InterfacePrefs, Theme } from '../types'
import { useI18n } from '../lib/i18n'
import { detectPlatform } from '../lib/platform'
import { exportData, importData } from '../lib/dataPort'
import { Modal } from './Modal'
import { SegmentedTabs } from './SegmentedTabs'
import { Switch } from './Switch'

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
  const platform = detectPlatform()

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
