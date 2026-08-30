import { useState } from 'react'
import { useI18n } from '../lib/i18n'
import type { Stats } from '../types'
import { groupByDay, loadSessions, timeLabel } from '../lib/sessions'
import { StatCard } from '../components/StatCard'
import { WeekChart } from '../components/WeekChart'

interface StatsViewProps {
  stats: Stats
  lang: 'pl' | 'en'
  chartDays: ReturnType<typeof import('../lib/stats').last7Days>
  totalMinutes: number
}

export function StatsView({ stats, lang, chartDays, totalMinutes }: StatsViewProps) {
  const { t } = useI18n()
  const [sessions] = useState(loadSessions)
  const days = groupByDay(sessions, lang)

  return (
    <div className="fade-up mx-auto w-full max-w-[640px] px-4 pt-12 pb-16 md:pt-24">
      <p className="text-overline text-ink-3">{t('app.name')}</p>
      <h1 className="mt-2 font-serif text-[2rem] font-[500] tracking-[-0.01em] text-ink">{t('stats.view')}</h1>

      <div className="mt-8 grid grid-cols-2 gap-y-8 sm:flex sm:items-start">
        <StatCard value={stats.today} label={t('stat.today')} emphasized />
        <StatCard value={stats.week} label={t('stat.week')} />
        <StatCard value={stats.streak} label={t('stat.streak')} />
        <StatCard value={stats.minutes} label={t('stat.minutes')} />
      </div>

      <div className="mt-10">
        <WeekChart days={chartDays} totalMinutes={totalMinutes} />
      </div>

      <div className="mt-12">
        <p className="text-overline text-ink-3">{t('log.title')}</p>
        {days.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-line bg-card p-5 text-[14px] leading-relaxed text-ink-2">
            {t('log.empty')}
          </p>
        ) : (
          <div className="mt-4 space-y-6">
            {days.map((day) => (
              <section key={day.key}>
                <p className="text-caption font-semibold text-ink">{day.label}</p>
                <ul className="mt-2 space-y-2">
                  {day.entries.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-baseline justify-between gap-3 rounded-xl border border-line bg-card px-4 py-3"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[14px] text-ink">
                          {entry.task ?? t('log.noTask')}
                        </span>
                        <span className="text-[12px] text-ink-3">{timeLabel(entry.date, lang)}</span>
                      </span>
                      <span className="tnum shrink-0 text-[14px] font-medium text-[var(--ac-strong)]">
                        {entry.minutes} min
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default StatsView
