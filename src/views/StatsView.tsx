import { useMemo, useState, useRef, useEffect } from 'react'
import { Edit2, Trash2, Check, X, Share2 } from 'lucide-react'
import { useI18n } from '../lib/i18n'
import type { StatsV2, SessionLogEntryV2 } from '../types'
import { groupByDay, loadSessions, timeLabel } from '../lib/sessions'
import { updateSessionTask } from '../lib/storage'
import {
  aggregateTaskBreakdown,
  calculateInsights,
  generateHeatmap,
  lastNDays,
  last7Days,
  sumMinutes,
  deleteSessionWithStats,
} from '../lib/stats'
import { StatCard } from '../components/StatCard'
import { WeekChart } from '../components/WeekChart'
import { ActivityHeatmap } from '../components/ActivityHeatmap'
import { TaskBreakdown } from '../components/TaskBreakdown'
import { ProductivityInsights } from '../components/ProductivityInsights'
import { SegmentedTabs } from '../components/SegmentedTabs'
import { ZenMilestones } from '../components/ZenMilestones'
import { SearchFilterWell } from '../components/SearchFilterWell'
import { ExportCardModal } from '../components/ExportCardModal'
import { PillButton } from '../components/PillButton'
import type { WeeklyCardData } from '../lib/cardExport'

interface StatsViewProps {
  stats: StatsV2
  lang: 'pl' | 'en'
  chartDays?: ReturnType<typeof last7Days>
  totalMinutes?: number
  onStatsChange?: (next: StatsV2) => void
}

type Range = '7' | '30'

export function StatsView({ stats: propStats, lang, onStatsChange }: StatsViewProps): React.JSX.Element {
  const { t } = useI18n()
  const [deletedStatsOverride, setDeletedStatsOverride] = useState<StatsV2 | null>(null)
  const stats = deletedStatsOverride ?? propStats
  const [sessions, setSessions] = useState<SessionLogEntryV2[]>(loadSessions)
  const [range, setRange] = useState<Range>('7')
  const [exportModalOpen, setExportModalOpen] = useState(false)

  // Search and date filters
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTaskText, setEditTaskText] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingId])

  // Filter sessions based on search and date filter
  const filteredSessions = useMemo(() => {
    let result = sessions
    const query = searchQuery.trim().toLowerCase()
    if (query) {
      result = result.filter((s) => {
        const taskMatch = s.task?.toLowerCase().includes(query) ?? false
        const dateMatch = s.date.toLowerCase().includes(query)
        return taskMatch || dateMatch
      })
    }
    if (dateFilter) {
      result = result.filter((s) => {
        return s.date.startsWith(dateFilter)
      })
    }
    return result
  }, [sessions, searchQuery, dateFilter])

  const days = useMemo(() => groupByDay(filteredSessions, lang), [filteredSessions, lang])

  const heatmapDays = useMemo(() => generateHeatmap(stats, lang, 30), [stats, lang])
  const heatmapTotalMinutes = useMemo(
    () => heatmapDays.reduce((acc, d) => acc + d.minutes, 0),
    [heatmapDays],
  )

  const activeChartDays = useMemo(
    () => lastNDays(stats, lang, range === '7' ? 7 : 30),
    [stats, lang, range],
  )
  const activeChartTotal = useMemo(() => sumMinutes(activeChartDays), [activeChartDays])

  const taskBreakdown = useMemo(
    () => aggregateTaskBreakdown(sessions, t('log.noTask'), 5),
    [sessions, t],
  )

  const insights = useMemo(() => calculateInsights(sessions), [sessions])

  const rangeTabs: Array<{ id: Range; label: string }> = [
    { id: '7', label: t('stats.range7') },
    { id: '30', label: t('stats.range30') },
  ]

  // Inline task title commit
  const handleStartEdit = (entry: SessionLogEntryV2) => {
    setEditingId(entry.id)
    setEditTaskText(entry.task ?? '')
  }

  const handleSaveEdit = (id: string) => {
    const updated = updateSessionTask(id, editTaskText)
    setSessions(updated)
    setEditingId(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditTaskText('')
  }

  // Deletion with atomic stats decrement
  const handleDeleteSession = (id: string) => {
    if (window.confirm(t('log.deleteConfirm'))) {
      const result = deleteSessionWithStats(id)
      setSessions(result.sessions)
      setDeletedStatsOverride(result.stats)
      if (onStatsChange) {
        onStatsChange(result.stats)
      }
    }
  }

  // Card export data preparation
  const weeklyCardData: WeeklyCardData = useMemo(() => {
    const chart7 = last7Days(stats, lang)
    const activeDaysCount = chart7.filter((d) => d.minutes > 0).length
    const startLabel = chart7[0]?.label ?? ''
    const endLabel = chart7[chart7.length - 1]?.label ?? ''
    const dateRangeLabel = startLabel + ' — ' + endLabel
    return {
      lang,
      totalMinutes: sumMinutes(chart7),
      chartDays: chart7,
      topTasks: taskBreakdown,
      activeDaysCount,
      dateRangeLabel,
    }
  }, [stats, lang, taskBreakdown])

  return (
    <div className="fade-up mx-auto w-full max-w-[640px] px-4 pt-12 pb-16 md:pt-24 space-y-10">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-overline text-ink-3">{t('app.name')}</p>
            <h1 className="mt-2 font-serif text-[2rem] font-[500] tracking-[-0.01em] text-ink">{t('stats.view')}</h1>
          </div>
          <PillButton
            variant="secondary"
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-2 mt-2 text-[13px]"
          >
            <Share2 className="size-4 text-[var(--ac-strong)]" />
            <span>{t('stats.exportCard')}</span>
          </PillButton>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-y-8 sm:flex sm:items-start">
          <StatCard value={stats.today} label={t('stat.today')} emphasized />
          <StatCard value={stats.week} label={t('stat.week')} />
          <StatCard value={stats.streak} label={t('stat.streak')} />
          <StatCard value={stats.minutes} label={t('stat.minutes')} />
        </div>
      </div>

      <ZenMilestones stats={stats} sessions={sessions} />

      <ActivityHeatmap days={heatmapDays} totalMinutes={heatmapTotalMinutes} />

      <div className="rounded-2xl border border-line bg-card p-5">
        <div className="mb-4 flex justify-end">
          <div className="w-40">
            <SegmentedTabs tabs={rangeTabs} value={range} onChange={setRange} ariaLabel={t('stats.chart7Title')} />
          </div>
        </div>
        <WeekChart
          days={activeChartDays}
          totalMinutes={activeChartTotal}
          title={range === '7' ? t('stats.chart7Title') : t('stats.chart30Title')}
        />
      </div>

      <TaskBreakdown items={taskBreakdown} />

      <ProductivityInsights insights={insights} />

      {/* Session History & Management */}
      <div className="space-y-4">
        <div className="flex items-baseline justify-between">
          <p className="text-overline text-ink-3">{t('log.title')}</p>
        </div>

        <SearchFilterWell
          query={searchQuery}
          onQueryChange={setSearchQuery}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          totalCount={sessions.length}
          filteredCount={filteredSessions.length}
        />

        {days.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-line bg-card p-5 text-[14px] leading-relaxed text-ink-2">
            {sessions.length === 0 ? t('log.empty') : t('stats.tasksEmpty')}
          </p>
        ) : (
          <div className="mt-4 space-y-6">
            {days.map((day) => (
              <section key={day.key}>
                <p className="text-caption font-semibold text-ink">{day.label}</p>
                <ul className="mt-2 space-y-2">
                  {day.entries.map((entry) => {
                    const isEditing = editingId === entry.id
                    const completedMicrosteps = entry.checklist?.filter((c) => c.completed).length ?? 0
                    const totalMicrosteps = entry.checklist?.length ?? 0

                    return (
                      <li
                        key={entry.id}
                        className="group flex flex-col gap-2 rounded-xl border border-line bg-card p-4 transition-colors hover:border-line-subtle"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <input
                                  ref={editInputRef}
                                  type="text"
                                  value={editTaskText}
                                  maxLength={200}
                                  onChange={(e) => setEditTaskText(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit(entry.id)
                                    if (e.key === 'Escape') handleCancelEdit()
                                  }}
                                  onBlur={() => handleSaveEdit(entry.id)}
                                  className="w-full rounded-lg border border-[var(--ac)] bg-sunken px-2.5 py-1 text-[14px] text-ink focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(entry.id)}
                                  className="p-1 text-[var(--ac-strong)] hover:bg-sunken rounded"
                                  aria-label={t('log.saveTask')}
                                >
                                  <Check className="size-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEdit}
                                  className="p-1 text-ink-3 hover:bg-sunken rounded"
                                  aria-label={t('log.cancelEdit')}
                                >
                                  <X className="size-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="block truncate text-[14px] font-medium text-ink">
                                  {entry.task ?? t('log.noTask')}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(entry)}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-ink-3 hover:text-ink transition-opacity rounded focus-visible:opacity-100"
                                  aria-label={t('log.editTask')}
                                >
                                  <Edit2 className="size-3.5" />
                                </button>
                              </div>
                            )}

                            <div className="flex items-center gap-3 mt-1 text-[12px] text-ink-3">
                              <span>{timeLabel(entry.date, lang)}</span>
                              {totalMicrosteps > 0 && (
                                <>
                                  <span>•</span>
                                  <span>
                                    {t('log.microstepsCount', {
                                      completed: completedMicrosteps,
                                      total: totalMicrosteps,
                                    })}
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Show micro-steps details if present */}
                            {entry.checklist && entry.checklist.length > 0 && (
                              <div className="mt-2 space-y-1 pl-1">
                                {entry.checklist.map((chk) => (
                                  <div key={chk.id} className="flex items-center gap-2 text-[12px] text-ink-2">
                                    <span
                                      className={
                                        'size-1.5 rounded-full ' +
                                        (chk.completed ? 'bg-[var(--ac)]' : 'bg-line-subtle')
                                      }
                                    />
                                    <span className={chk.completed ? 'line-through text-ink-3' : ''}>
                                      {chk.text}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="tnum text-[14px] font-medium text-[var(--ac-strong)]">
                              {entry.minutes} min
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteSession(entry.id)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 text-ink-3 hover:text-red-500 transition-opacity rounded focus-visible:opacity-100"
                              aria-label={t('log.deleteSession')}
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      <ExportCardModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        cardData={weeklyCardData}
      />
    </div>
  )
}

export default StatsView
