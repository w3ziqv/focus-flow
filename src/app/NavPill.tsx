import { memo, useLayoutEffect, useRef } from 'react'
import { Settings2 } from 'lucide-react'
import { useI18n } from '../lib/i18n'

interface NavPillProps {
  view: 'timer' | 'stats' | 'tips'
  onView: (view: 'timer' | 'stats' | 'tips') => void
  onOpenSettings: () => void
}

export const NavPill: React.NamedExoticComponent<NavPillProps> = memo(function NavPill({ view, onView, onOpenSettings }: NavPillProps): React.JSX.Element {
  const { t } = useI18n()
  const links = useRef<HTMLDivElement>(null)
  const indicator = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const root = links.current
    if (!root) return
    const measure = () => {
      const active = root.querySelector<HTMLElement>('[aria-current="page"]')
      if (!active || !indicator.current) return
      indicator.current.style.width = `${Math.max(0, active.offsetWidth - 24)}px`
      indicator.current.style.transform = `translateX(${active.offsetLeft + 12}px)`
    }
    measure()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    for (const button of root.querySelectorAll('button')) observer.observe(button)
    return () => observer.disconnect()
  }, [view, t])

  const linkClass = (active: boolean) =>
    `rounded-control px-3 py-3 text-caption font-medium transition-colors duration-150 [transition-timing-function:var(--ease-micro)] hover:bg-sunken ${
      active ? 'text-ink' : 'text-ink-2 hover:text-ink'
    }`

  return (
    <nav
      aria-label={t('app.name')}
      className="app-nav"
    >
      <div className="app-nav-controls">
        <div ref={links} className="app-nav-links">
        <span ref={indicator} className="nav-active-indicator" aria-hidden="true" />
        <button type="button" aria-current={view === 'timer' ? 'page' : undefined} onClick={() => onView('timer')} className={linkClass(view === 'timer')}>
          {t('nav.timer')}
        </button>
        <button type="button" aria-current={view === 'stats' ? 'page' : undefined} onClick={() => onView('stats')} className={linkClass(view === 'stats')}>
          {t('stats.view')}
        </button>
        <button type="button" aria-current={view === 'tips' ? 'page' : undefined} onClick={() => onView('tips')} className={linkClass(view === 'tips')}>
          {t('nav.tips')}
        </button>
        </div>
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
