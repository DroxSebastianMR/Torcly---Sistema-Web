interface IndicatorCardProps {
  label: string
  value: string
  hint?: string
}

export function IndicatorCard({ label, value, hint }: IndicatorCardProps) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-brand-forest">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
