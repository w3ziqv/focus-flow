import type { Theme } from '../types'
import { useI18n } from '../lib/i18n'
import { Modal } from './Modal'
import { SegmentedTabs } from './SegmentedTabs'

interface AppSettingsModalProps {
  open: boolean
  theme: Theme
  onTheme: (theme: Theme) => void
  onClose: () => void
}

export function AppSettingsModal({ open, theme, onTheme, onClose }: AppSettingsModalProps) {
  const { t, lang, setLang } = useI18n()

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
    </Modal>
  )
}
