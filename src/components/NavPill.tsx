import { Moon, Sun } from 'lucide-react'
import type { Lang, Theme } from '../types'
import { useI18n } from '../lib/i18n'

interface NavPillProps {
  view: 'timer' | 'tips'
  onView: (view: 'timer' | 'tips') => void
  theme: Theme
  onTheme: () => void
  lang: Lang
  onLang: () => void
}

export function NavPill({ view, onView, theme, onTheme, lang, onLang }: NavPillProps) {
  const { t } = useI18n()

  const linkClass = (active: boolean) =>
    `rounded-full px-4 py-3 text-caption font-medium transition-colors duration-150 [transition-timing-function:var(--ease-micro)] ${
      active ? 'bg-sunken text-ink' : 'text-ink-2 hover:text-ink'
    }`

  return (
    <nav
      aria-label={t('app.name')}
      className="nav-mobile-bottom fixed inset-x-0 top-3 z-40 flex justify-center max-md:top-auto"
    >
      <div className="flex items-center gap-1 rounded-full border border-line-subtle bg-card/85 px-2 py-1.5 shadow-halo backdrop-blur-md">
        <span className="flex items-center gap-2 px-3 max-sm:hidden">
          <span aria-hidden="true" className="size-2 rounded-full bg-[var(--ac)]" />
          <span className="font-serif text-[15px] font-[500] text-ink">{t('app.name')}</span>
        </span>
        <button type="button" aria-current={view === 'timer' ? 'page' : undefined} onClick={() => onView('timer')} className={linkClass(view === 'timer')}>
          {t('nav.timer')}
        </button>
        <button type="button" aria-current={view === 'tips' ? 'page' : undefined} onClick={() => onView('tips')} className={linkClass(view === 'tips')}>
          {t('nav.tips')}
        </button>
        <span aria-hidden="true" className="mx-1 h-5 w-px bg-line" />
        <button
          type="button"
          onClick={onTheme}
          aria-label={t('nav.theme')}
          className="flex size-11 items-center justify-center rounded-full text-ink-2 transition-colors duration-150 hover:bg-sunken hover:text-ink"
        >
          {theme === 'dark' ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
        </button>
        <button
          type="button"
          onClick={onLang}
          aria-label={`${t('nav.lang')} → ${lang === 'pl' ? 'EN' : 'PL'}`}
          className="flex h-11 min-w-11 items-center justify-center rounded-full px-2 text-[12px] font-semibold tracking-[0.06em] text-ink-2 transition-colors duration-150 hover:bg-sunken hover:text-ink"
        >
          {lang === 'pl' ? 'EN' : 'PL'}
        </button>
      </div>
    </nav>
  )
}
