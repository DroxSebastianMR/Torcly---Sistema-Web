import { cn } from '@/lib/utils'

export interface ChartRow {
  key: string
  label: string
  count: number
  amount: number
}

export interface BarChartProps {
  rows: ChartRow[]
  primary: 'count' | 'amount'
  label: string
  ariaLabel: string
  caption: string
  countLabel: string
  amountLabel: string
  countFormatter: (value: number) => string
  amountFormatter: (value: number) => string
  emptyMessage?: string
  className?: string
}

function barHeight(value: number, max: number) {
  if (max <= 0 || value === 0) return 6
  return Math.max(8, Math.min(100, (Math.abs(value) / max) * 100))
}

export function BarChart({
  rows,
  primary,
  label,
  ariaLabel,
  caption,
  countLabel,
  amountLabel,
  countFormatter,
  amountFormatter,
  emptyMessage = 'Sin datos en el período.',
  className,
}: BarChartProps) {
  const values = rows.map((row) => row[primary])
  const max = Math.max(...values.map((value) => Math.abs(value)), 0)
  const hasData = rows.some((row) => row[primary] !== 0)

  return (
    <div className={cn('space-y-2', className)}>
      <h3 className="text-sm font-semibold text-brand-forest">{label}</h3>
      <div
        role="img"
        aria-label={`${ariaLabel} ${hasData ? '' : emptyMessage}`}
        className="flex h-44 items-end gap-1.5 border-b border-border/70 pb-1 sm:gap-2"
      >
        {!hasData ? (
          <p className="w-full text-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          rows.map((row) => {
            const value = row[primary]
            const formatted =
              primary === 'count'
                ? countFormatter(value)
                : amountFormatter(value)
            const negative = value < 0
            return (
              <div
                key={row.key}
                className="group flex min-w-0 flex-1 flex-col items-center gap-1"
              >
                <span className="text-[10px] leading-none text-muted-foreground">
                  {formatted}
                </span>
                <div
                  className={cn(
                    'w-full max-w-12 rounded-t-md transition-colors',
                    negative
                      ? 'bg-destructive/70 group-hover:bg-destructive'
                      : 'bg-primary/60 group-hover:bg-primary',
                  )}
                  style={{ height: `${barHeight(value, max)}%` }}
                />
                <span className="truncate text-[10px] leading-none text-muted-foreground">
                  {row.label}
                </span>
              </div>
            )
          })
        )}
      </div>
      <table className="w-full text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th scope="col" className="py-1.5 font-medium">
              Período
            </th>
            <th scope="col" className="py-1.5 text-right font-medium">
              {countLabel}
            </th>
            <th scope="col" className="py-1.5 text-right font-medium">
              {amountLabel}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b text-muted-foreground">
              <th scope="row" className="py-1.5 text-left font-normal">
                {row.label}
              </th>
              <td className="py-1.5 text-right tabular-nums">
                {countFormatter(row.count)}
              </td>
              <td className="py-1.5 text-right tabular-nums">
                {amountFormatter(row.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
