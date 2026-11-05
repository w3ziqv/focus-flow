import { memo } from 'react'
import { Settings2 } from 'lucide-react'
import { useI18n } from '../lib/i18n'

interface NavPillProps {
  view: 'timer' | 'stats' | 'tips'
  onView: (view: 'timer' | 'stats' | 'tips') => void
  onOpenSettings: () => void
}

export const NavPill: React.NamedExoticComponent<NavPillProps> = memo(function NavPill({ view, onView, onOpenSettings }: NavPillProps): React.JSX.Element {
  const { t } = useI18n()

  const linkClass = (active: boolean) =>
    `rounded-control px-3 py-3 text-caption font-medium transition-colors duration-150 [transition-timing-function:var(--ease-micro)] hover:bg-sunken ${
      active ? 'text-ink underline decoration-2 underline-offset-8' : 'text-ink-2 hover:text-ink'
    }`

  return (
    <nav
      aria-label={t('app.name')}
      className="app-nav"
    >
      <div className="app-nav-controls">
        <button type="button" aria-current={view === 'timer' ? 'page' : undefined} onClick={() => onView('timer')} className={linkClass(view === 'timer')}>
          {t('nav.timer')}
        </button>
        <button type="button" aria-current={view === 'stats' ? 'page' : undefined} onClick={() => onView('stats')} className={linkClass(view === 'stats')}>
          {t('stats.view')}
        </button>
        <button type="button" aria-current={view === 'tips' ? 'page' : undefined} onClick={() => onView('tips')} className={linkClass(view === 'tips')}>
          {t('nav.tips')}
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label={t('settings.app')}
          className="flex size-11 items-center justify-center rounded-control text-ink-2 transition-colors duration-150 hover:bg-sunken hover:text-ink"
        >
          <Settings2 size={18} aria-hidden="true" />
        </button>
      </div>
    </nav>
  )
})
