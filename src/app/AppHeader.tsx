import { memo } from 'react'
import { Download } from 'lucide-react'
import { useI18n } from '../lib/i18n'
import { SyncStatusIndicator } from '../features/sync/SyncStatusIndicator'
import { NavPill } from './NavPill'

interface Props {
  view: 'timer' | 'stats' | 'tips'
  onView: (view: Props['view']) => void
  onOpenSettings: () => void
  onOpenCloud: () => void
  onOpenData: () => void
}

/** Stable commands and status, independent of timer ticks. */
export const AppHeader: React.NamedExoticComponent<Props> = memo(function AppHeader(props: Props): React.JSX.Element {
  const { t } = useI18n()
  return <header className="app-header">
    <span className="app-brand font-serif text-xl font-medium">{t('app.name')}</span>
    <NavPill view={props.view} onView={props.onView} onOpenSettings={props.onOpenSettings} />
    <div className="app-utilities">
      <SyncStatusIndicator onClick={props.onOpenCloud} />
      <button type="button" onClick={props.onOpenData} title={t('data.export')} className="inline-flex min-h-target items-center justify-center gap-2 rounded-control px-3 text-caption text-ink-2 hover:bg-sunken hover:text-ink">
        <Download size={16} aria-hidden="true" /><span className="sr-only md:not-sr-only">{t('data.export')}</span>
      </button>
    </div>
  </header>
})
