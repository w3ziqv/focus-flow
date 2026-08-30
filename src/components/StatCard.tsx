interface StatCardProps {
  value: number | string
  label: string
  emphasized?: boolean
}

export function StatCard({ value, label, emphasized = false }: StatCardProps) {
  return (
    <div className="flex flex-col items-center gap-1 sm:flex-1 sm:border-l sm:border-line sm:px-6 sm:first:border-l-0">
      <span
        className={`tnum font-serif text-[1.75rem] leading-none font-[400] ${
          emphasized ? 'text-[var(--ac-strong)]' : 'text-ink'
        }`}
      >
        {value}
      </span>
      <span className="text-overline text-ink-3">{label}</span>
    </div>
  )
}
