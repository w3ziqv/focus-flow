import type { HeatmapDay } from '../lib/stats'
import { useI18n } from '../lib/i18n'

interface ActivityHeatmapProps {
  days: HeatmapDay[]
  totalMinutes: number
}

const LEVEL_CLASSES: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'bg-sunken border-line-subtle',
  1: 'bg-[var(--ac-soft)]/60 border-[var(--ac)]/30',
  2: 'bg-[var(--ac-soft)] border-[var(--ac)]/50',
  3: 'bg-[var(--ac)]/70 border-[var(--ac)]',
  4: 'bg-[var(--ac)] border-[var(--ac-strong)]',
}

export function ActivityHeatmap({ days, totalMinutes }: ActivityHeatmapProps) {
  const { t } = useI18n()

  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-overline text-ink-3">{t('stats.heatmapTitle')}</p>
        <span className="text-caption text-ink-3">{totalMinutes} min</span>
      </div>

      <div
        role="img"
        aria-label={t('stats.heatmapAria', { total: totalMinutes })}
        className="mt-4 grid grid-cols-6 gap-2 sm:grid-cols-10"
      >
        {days.map((day) => (
          <div
            key={day.dateKey}
            title={t('stats.heatmapDay', { date: day.dateLabel, minutes: day.minutes })}
            className={`aspect-square rounded-md border transition-transform duration-150 hover:scale-110 ${
              LEVEL_CLASSES[day.level]
            } ${day.isToday ? 'ring-1 ring-[var(--ac)] ring-offset-1 ring-offset-card' : ''}`}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 text-[11px] text-ink-3" aria-hidden="true">
        <span>{t('stats.heatmapLess')}</span>
        <span className="size-2.5 rounded-[2px] border border-line-subtle bg-sunken" />
        <span className="size-2.5 rounded-[2px] border border-[var(--ac)]/30 bg-[var(--ac-soft)]/60" />
        <span className="size-2.5 rounded-[2px] border border-[var(--ac)]/50 bg-[var(--ac-soft)]" />
        <span className="size-2.5 rounded-[2px] border border-[var(--ac)] bg-[var(--ac)]/70" />
        <span className="size-2.5 rounded-[2px] border border-[var(--ac-strong)] bg-[var(--ac)]" />
        <span>{t('stats.heatmapMore')}</span>
      </div>
    </div>
  )
}
