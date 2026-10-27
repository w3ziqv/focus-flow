import { useRef } from 'react'

interface TabItem<T extends string> {
  id: T
  label: string
}

interface SegmentedTabsProps<T extends string> {
  tabs: Array<TabItem<T>>
  value: T
  onChange: (id: T) => void
  ariaLabel: string
}

export function SegmentedTabs<T extends string>({ tabs, value, onChange, ariaLabel }: SegmentedTabsProps<T>): React.JSX.Element {
  const refs = useRef<Array<HTMLButtonElement | null>>([])
  const activeIndex = Math.max(0, tabs.findIndex((tab) => tab.id === value))

  const select = (next: number) => {
    if (!tabs.length) return
    onChange(tabs[next].id)
    refs.current[next]?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="relative mx-auto flex w-full max-w-[380px] rounded-full bg-sunken p-1"
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') {
          event.preventDefault()
          select((activeIndex + 1) % tabs.length)
        }
        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          select((activeIndex - 1 + tabs.length) % tabs.length)
        }
        if (event.key === 'Home' || event.key === 'End') {
          event.preventDefault()
          select(event.key === 'Home' ? 0 : tabs.length - 1)
        }
      }}
    >
      <span
        aria-hidden="true"
        className="absolute top-1 bottom-1 left-1 rounded-full bg-[var(--ac-soft)] transition-transform duration-[220ms] [transition-timing-function:var(--ease-standard)]"
        style={{
          width: `calc((100% - 8px) / ${Math.max(1, tabs.length)})`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />
      {tabs.map((tab, index) => {
        const active = tab.id === value
        return (
          <button
            type="button"
            key={tab.id}
            ref={(el) => {
              refs.current[index] = el
            }}
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={`relative z-10 flex-1 rounded-full py-3 text-caption font-medium transition-colors duration-150 [transition-timing-function:var(--ease-micro)] ${
              active ? 'text-[var(--ac-strong)]' : 'text-ink-2 hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
