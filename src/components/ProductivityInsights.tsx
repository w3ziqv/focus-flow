import { Clock, Flame, Zap } from 'lucide-react'
import type { ProductivityInsights as InsightsType, TimeOfDay } from '../lib/stats'
import { useI18n } from '../lib/i18n'

interface ProductivityInsightsProps {
  insights: InsightsType
}

const TIME_LABEL_KEYS: Record<TimeOfDay, 'stats.timeMorning' | 'stats.timeAfternoon' | 'stats.timeEvening' | 'stats.timeNight'> = {
  morning: 'stats.timeMorning',
  afternoon: 'stats.timeAfternoon',
  evening: 'stats.timeEvening',
  night: 'stats.timeNight',
}

export function ProductivityInsights({ insights }: ProductivityInsightsProps) {
  const { t } = useI18n()

  if (insights.totalSessions === 0) {
    return null
  }

  const peakTimeLabel = insights.peakTime ? t(TIME_LABEL_KEYS[insights.peakTime]) : null

  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <div className="flex items-center gap-2">
        <Zap size={15} className="text-[var(--ac)]" aria-hidden="true" />
        <p className="text-overline text-ink-3">{t('stats.insightsTitle')}</p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {peakTimeLabel && (
          <div className="flex items-start gap-3 rounded-xl border border-line-subtle bg-sunken/60 p-3.5">
            <Clock size={18} className="mt-0.5 shrink-0 text-ink-2" aria-hidden="true" />
            <div>
              <p className="text-caption font-semibold text-ink">{t('stats.peakTime')}</p>
              <p className="mt-0.5 text-[13px] leading-snug text-ink-2">
                {t('stats.peakTimeDesc', { time: peakTimeLabel })}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3 rounded-xl border border-line-subtle bg-sunken/60 p-3.5">
          <Flame size={18} className="mt-0.5 shrink-0 text-[var(--ac)]" aria-hidden="true" />
          <div>
            <p className="text-caption font-semibold text-ink">{t('stats.avgDaily')}</p>
            <p className="mt-0.5 text-[13px] leading-snug text-ink-2">
              {t('stats.avgDailyDesc', { minutes: insights.avgMinutesPerActiveDay })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
