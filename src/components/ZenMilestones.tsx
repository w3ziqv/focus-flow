import type { MilestoneRecord, StatsV2, SessionLogEntryV2 } from '../types'
import { useI18n } from '../lib/i18n'
import type { TranslationKey } from '../lib/translations'
import { ZEN_MILESTONES, type ZenMilestoneId, evaluateMilestones } from '../lib/stats'
import { useMemo } from 'react'

interface ZenMilestonesProps {
  stats: StatsV2
  sessions: SessionLogEntryV2[]
}

interface MilestoneDef {
  id: ZenMilestoneId
  titleKey: TranslationKey
  descKey: TranslationKey
  thresholdKey: TranslationKey
}

const MILESTONE_DEFS: MilestoneDef[] = [
  {
    id: 'the_first_step',
    titleKey: 'milestone.firstStep.title',
    descKey: 'milestone.firstStep.desc',
    thresholdKey: 'milestone.firstStep.req',
  },
  {
    id: 'pebble_of_rhythm',
    titleKey: 'milestone.pebbleRhythm.title',
    descKey: 'milestone.pebbleRhythm.desc',
    thresholdKey: 'milestone.pebbleRhythm.req',
  },
  {
    id: 'stone_of_stillness',
    titleKey: 'milestone.stoneStillness.title',
    descKey: 'milestone.stoneStillness.desc',
    thresholdKey: 'milestone.stoneStillness.req',
  },
  {
    id: 'garden_of_flow',
    titleKey: 'milestone.gardenFlow.title',
    descKey: 'milestone.gardenFlow.desc',
    thresholdKey: 'milestone.gardenFlow.req',
  },
  {
    id: 'century_of_craft',
    titleKey: 'milestone.centuryCraft.title',
    descKey: 'milestone.centuryCraft.desc',
    thresholdKey: 'milestone.centuryCraft.req',
  },
]

function formatDate(iso: string, lang: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).toUpperCase()
  } catch {
    return ''
  }
}

/**
 * Zen Stone Cairn Vector Graphic (Minimalist balanced rock garden stamp)
 */
function ZenStoneStamp({ unlocked, id }: { unlocked: boolean; id: ZenMilestoneId }): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 48 48"
      className={'size-10 transition-colors duration-300 ' + (unlocked ? 'text-[var(--ac-strong)]' : 'text-ink-3/30')}
      fill="none"
      stroke="currentColor"
      strokeWidth={unlocked ? 1.8 : 1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {id === 'the_first_step' && (
        <path
          d="M16 32 C 16 26, 32 26, 32 32 C 32 37, 16 37, 16 32 Z"
          fill={unlocked ? 'var(--ac-soft)' : 'none'}
          strokeDasharray={unlocked ? undefined : '2 2'}
        />
      )}
      {id === 'pebble_of_rhythm' && (
        <>
          <path
            d="M14 34 C 14 29, 34 29, 34 34 C 34 38, 14 38, 14 34 Z"
            fill={unlocked ? 'var(--ac-soft)' : 'none'}
            strokeDasharray={unlocked ? undefined : '2 2'}
          />
          <path
            d="M18 26 C 18 22, 30 22, 30 26 C 30 29, 18 29, 18 26 Z"
            fill={unlocked ? 'var(--ac-soft)' : 'none'}
            strokeDasharray={unlocked ? undefined : '2 2'}
          />
        </>
      )}
      {id === 'stone_of_stillness' && (
        <>
          <path
            d="M12 35 C 12 30, 36 30, 36 35 C 36 39, 12 39, 12 35 Z"
            fill={unlocked ? 'var(--ac-soft)' : 'none'}
            strokeDasharray={unlocked ? undefined : '2 2'}
          />
          <path
            d="M16 27 C 16 23, 32 23, 32 27 C 32 30, 16 30, 16 27 Z"
            fill={unlocked ? 'var(--ac-soft)' : 'none'}
            strokeDasharray={unlocked ? undefined : '2 2'}
          />
          <path
            d="M20 20 C 20 17, 28 17, 28 20 C 28 23, 20 23, 20 20 Z"
            fill={unlocked ? 'var(--ac-soft)' : 'none'}
            strokeDasharray={unlocked ? undefined : '2 2'}
          />
        </>
      )}
      {id === 'garden_of_flow' && (
        <>
          <path
            d="M10 36 C 10 31, 38 31, 38 36 C 38 40, 10 40, 10 36 Z"
            fill={unlocked ? 'var(--ac-soft)' : 'none'}
            strokeDasharray={unlocked ? undefined : '2 2'}
          />
          <path
            d="M14 28 C 14 24, 34 24, 34 28 C 34 31, 14 31, 14 28 Z"
            fill={unlocked ? 'var(--ac-soft)' : 'none'}
            strokeDasharray={unlocked ? undefined : '2 2'}
          />
          <path
            d="M18 21 C 18 18, 30 18, 30 21 C 30 24, 18 24, 18 21 Z"
            fill={unlocked ? 'var(--ac-soft)' : 'none'}
            strokeDasharray={unlocked ? undefined : '2 2'}
          />
          <circle
            cx="24"
            cy="14"
            r="3.5"
            fill={unlocked ? 'var(--ac)' : 'none'}
            strokeDasharray={unlocked ? undefined : '2 2'}
          />
        </>
      )}
      {id === 'century_of_craft' && (
        <>
          <path
            d="M8 37 C 8 32, 40 32, 40 37 C 40 41, 8 41, 8 37 Z"
            fill={unlocked ? 'var(--ac-soft)' : 'none'}
            strokeDasharray={unlocked ? undefined : '2 2'}
          />
          <path
            d="M13 29 C 13 25, 35 25, 35 29 C 35 32, 13 32, 13 29 Z"
            fill={unlocked ? 'var(--ac-soft)' : 'none'}
            strokeDasharray={unlocked ? undefined : '2 2'}
          />
          <path
            d="M17 22 C 17 19, 31 19, 31 22 C 31 25, 17 25, 17 22 Z"
            fill={unlocked ? 'var(--ac-soft)' : 'none'}
            strokeDasharray={unlocked ? undefined : '2 2'}
          />
          <circle
            cx="24"
            cy="15"
            r="3.5"
            fill={unlocked ? 'var(--ac-soft)' : 'none'}
            strokeDasharray={unlocked ? undefined : '2 2'}
          />
          <circle
            cx="24"
            cy="8"
            r="2"
            fill={unlocked ? 'var(--ac)' : 'none'}
            strokeDasharray={unlocked ? undefined : '2 2'}
          />
        </>
      )}
    </svg>
  )
}

export function ZenMilestones({ stats, sessions }: ZenMilestonesProps): React.JSX.Element {
  const { t, lang } = useI18n()

  const evaluated = useMemo(() => {
    return evaluateMilestones(stats.milestones, stats, sessions)
  }, [stats, sessions])

  const unlockedMap = useMemo(() => {
    const map = new Map<string, MilestoneRecord>()
    for (const record of evaluated) {
      map.set(record.id, record)
    }
    return map
  }, [evaluated])

  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-overline text-ink-3">{t('milestones.title')}</p>
          <h2 className="mt-1 font-serif text-[18px] font-medium text-ink">{t('milestones.subtitle')}</h2>
        </div>
        <span className="text-caption text-ink-3">
          {t('milestones.progress', { unlocked: evaluated.length, total: ZEN_MILESTONES.length })}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MILESTONE_DEFS.map((def) => {
          const record = unlockedMap.get(def.id)
          const isUnlocked = Boolean(record)

          return (
            <div
              key={def.id}
              className={
                'flex items-start gap-3.5 rounded-xl border p-3.5 transition-colors ' +
                (isUnlocked
                  ? 'border-line bg-surface/50 shadow-[0_1px_4px_rgba(20,20,19,0.03)]'
                  : 'border-line-subtle/80 bg-sunken/30 opacity-70')
              }
            >
              <div className="shrink-0 mt-0.5">
                <ZenStoneStamp unlocked={isUnlocked} id={def.id} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className={'text-[14px] font-medium ' + (isUnlocked ? 'text-ink' : 'text-ink-2')}>
                    {t(def.titleKey)}
                  </p>
                </div>
                <p className="text-[12px] leading-relaxed text-ink-3 mt-0.5">{t(def.descKey)}</p>
                <div className="mt-2 flex items-center justify-between gap-2 text-[10px]">
                  <span className="text-ink-3/80">{t(def.thresholdKey)}</span>
                  {isUnlocked && record?.unlockedAt && (
                    <span className="tnum font-medium text-[var(--ac-strong)]">
                      {formatDate(record.unlockedAt, lang)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
