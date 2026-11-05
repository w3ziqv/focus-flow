interface StatCardProps {
  value: number | string
  label: string
  emphasized?: boolean
}

export function StatCard({ value, label, emphasized = false }: StatCardProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-start gap-2 sm:flex-1">
      <span
        className={`tnum whitespace-nowrap font-serif text-[1.75rem] leading-none font-[400] ${
          emphasized ? 'text-[var(--ac-strong)]' : 'text-ink'
        }`}
      >
        {value}
      </span>
      <span className="text-overline text-ink-2">{label}</span>
    </div>
  )
}
