import type { ChartDay } from '../lib/stats'
import { useI18n } from '../lib/i18n'

interface WeekChartProps {
  days: ChartDay[]
  totalMinutes: number
}

export function WeekChart({ days, totalMinutes }: WeekChartProps) {
  const { t } = useI18n()
  const max = Math.max(...days.map((d) => d.minutes), 1)

  return (
    <div className="mx-auto w-full max-w-[420px]">
      <p className="mb-4 text-center text-overline text-ink-3">{t('chart.label')}</p>
      <div
        role="img"
        aria-label={t('chart.aria', { total: totalMinutes })}
        className="flex h-24 items-end gap-2"
      >
        {days.map((day, index) => {
          const height = Math.max(3, Math.round((day.minutes / max) * 96))
          return (
            <div key={index} className="flex flex-1 flex-col items-center justify-end gap-2 self-stretch">
              <div
                title={t('chart.day', { day: day.label, minutes: day.minutes })}
                className={`w-full max-w-[28px] origin-bottom rounded-t-[3px] chart-bar ${
                  day.isToday ? 'bg-[var(--ac)]' : day.minutes > 0 ? 'bg-line' : 'bg-line-subtle'
                }`}
                style={{ height: `${height}px`, animationDelay: `${index * 40}ms` }}
              />
              <span className="text-[11px] text-ink-3">{day.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
