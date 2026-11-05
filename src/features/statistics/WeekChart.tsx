import type { ChartDay } from '../../lib/stats'
import { useI18n } from '../../lib/i18n'

interface WeekChartProps {
  days: ChartDay[]
  totalMinutes: number
  title?: string
  showTitle?: boolean
}

export function WeekChart({ days, totalMinutes, title, showTitle = true }: WeekChartProps): React.JSX.Element {
  const { t } = useI18n()
  const max = Math.max(...days.map((d) => d.minutes), 1)
  const isMonthly = days.length > 7

  return (
    <div className="mx-auto w-full">
      {showTitle && <h2 className="mb-4 text-body-sm font-medium text-ink">{title ?? t('chart.label')}</h2>}
      <div
        role="img"
        aria-label={t('chart.aria', { total: totalMinutes })}
        className={`flex h-36 items-end ${isMonthly ? 'gap-1' : 'gap-2'}`}
      >
        {days.map((day, index) => {
          const height = Math.max(0, Math.round((day.minutes / max) * 120))
          return (
            <div key={index} className="flex min-w-0 flex-1 flex-col items-center justify-end self-stretch">
              <div
                title={t('chart.day', { day: day.label, minutes: day.minutes })}
                className={`w-full ${isMonthly ? 'max-w-[10px]' : 'max-w-[28px]'} origin-bottom rounded-t-[3px] transition-colors ${
                  day.isToday ? 'bg-[var(--ac)]' : day.minutes > 0 ? 'bg-line' : 'bg-line-subtle'
                }`}
                style={{ height: `${height}px`, animationDelay: `${Math.min(index * 20, 300)}ms` }}
              />
              {!isMonthly && (
                <span className="mt-2 truncate text-[11px] text-ink-3">{day.label}</span>
              )}
            </div>
          )
        })}
      </div>

      {isMonthly && (
        <div className="mt-3 flex items-center justify-between text-[11px] text-ink-3" aria-hidden="true">
          <span>{days[0]?.label}</span>
          <span>{days[Math.floor(days.length / 2)]?.label}</span>
          <span>{days[days.length - 1]?.label}</span>
        </div>
      )}
    </div>
  )
}
