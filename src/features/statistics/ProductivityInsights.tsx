import type { ProductivityInsights as InsightsType, TimeOfDay } from '../../lib/stats'
import { useI18n } from '../../lib/i18n'

interface ProductivityInsightsProps {
  insights: InsightsType
}

const TIME_LABEL_KEYS: Record<TimeOfDay, 'stats.timeMorning' | 'stats.timeAfternoon' | 'stats.timeEvening' | 'stats.timeNight'> = {
  morning: 'stats.timeMorning',
  afternoon: 'stats.timeAfternoon',
  evening: 'stats.timeEvening',
  night: 'stats.timeNight',
}

export function ProductivityInsights({ insights }: ProductivityInsightsProps): React.JSX.Element | null {
  const { t } = useI18n()

  if (insights.totalSessions === 0) {
    return null
  }

  const peakTimeLabel = insights.peakTime ? t(TIME_LABEL_KEYS[insights.peakTime]) : null

  return (
    <div className="px-5 py-4">
      <h2 className="text-body-sm font-medium text-ink">{t('stats.insightsTitle')}</h2>

      <div className="mt-4 grid gap-4">
        {peakTimeLabel && (
          <div>
            <div>
              <p className="text-caption font-semibold text-ink">{t('stats.peakTime')}</p>
              <p className="mt-0.5 text-[13px] leading-snug text-ink-2">
                {t('stats.peakTimeDesc', { time: peakTimeLabel })}
              </p>
            </div>
          </div>
        )}

        <div>
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
