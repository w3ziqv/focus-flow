import type { TaskBreakdownItem } from '../lib/stats'
import { useI18n } from '../lib/i18n'

interface TaskBreakdownProps {
  items: TaskBreakdownItem[]
}

export function TaskBreakdown({ items }: TaskBreakdownProps) {
  const { t } = useI18n()

  if (items.length === 0) {
    return null
  }

  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <p className="text-overline text-ink-3">{t('stats.tasksTitle')}</p>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.name} className="space-y-1.5">
            <div className="flex items-center justify-between text-[14px]">
              <span className="truncate font-medium text-ink pr-2">{item.name}</span>
              <span className="shrink-0 text-caption text-ink-2">
                <span className="tnum font-medium text-ink">{item.minutes} min</span>{' '}
                <span className="text-ink-3">({item.percentage}%)</span>
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-sunken">
              <div
                className="h-full rounded-full bg-[var(--ac)] transition-all duration-300"
                style={{ width: `${Math.max(4, item.percentage)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
