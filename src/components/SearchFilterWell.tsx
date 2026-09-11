import { useId } from 'react'
import { Search, X } from 'lucide-react'
import { useI18n } from '../lib/i18n'

interface SearchFilterWellProps {
  query: string
  onQueryChange: (query: string) => void
  dateFilter: string
  onDateFilterChange: (date: string) => void
  totalCount: number
  filteredCount: number
}

export function SearchFilterWell({
  query,
  onQueryChange,
  dateFilter,
  onDateFilterChange,
  totalCount,
  filteredCount,
}: SearchFilterWellProps): React.JSX.Element {
  const { t } = useI18n()
  const searchInputId = useId()
  const dateInputId = useId()

  const hasFilter = query.trim().length > 0 || dateFilter.length > 0

  const handleClear = () => {
    onQueryChange('')
    onDateFilterChange('')
  }

  return (
    <div className="rounded-2xl border border-line bg-card p-4 space-y-3">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <label htmlFor={searchInputId} className="sr-only">
            {t('log.searchPlaceholder')}
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-3"
            aria-hidden="true"
          />
          <input
            id={searchInputId}
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t('log.searchPlaceholder')}
            className="w-full rounded-xl border border-line-subtle bg-sunken py-2 pl-9 pr-3 text-[14px] text-ink placeholder:text-ink-3 focus:border-[var(--ac)] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor={dateInputId} className="sr-only">
            {t('log.dateFilter')}
          </label>
          <input
            id={dateInputId}
            type="date"
            value={dateFilter}
            onChange={(e) => onDateFilterChange(e.target.value)}
            className="rounded-xl border border-line-subtle bg-sunken px-3 py-2 text-[13px] text-ink focus:border-[var(--ac)] focus:outline-none"
          />

          {hasFilter && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1 rounded-xl border border-line px-2.5 py-2 text-[12px] font-medium text-ink-2 hover:bg-sunken focus-visible:ring-2 focus-visible:ring-[var(--ac)]"
            >
              <X className="size-3.5" aria-hidden="true" />
              <span>{t('log.clearFilter')}</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-[12px] text-ink-3">
        <span>
          {hasFilter
            ? t('log.filterResults', { filtered: filteredCount, total: totalCount })
            : t('log.totalSessions', { count: totalCount })}
        </span>
      </div>
    </div>
  )
}
