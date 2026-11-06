import { Cell, Pie, PieChart, Tooltip } from 'recharts'
import { ChartContainer } from '@/components/ui/chart'

interface CompositionRow {
  key: string
  label: string
  value: number
  color: string
}

interface CompositionChartProps {
  title: string
  ariaLabel: string
  rows: CompositionRow[]
  formatter?: (value: number) => string
}

const tooltipStyle = {
  backgroundColor: 'var(--surface-elevated)',
  border: '1px solid var(--border)',
  borderRadius: '0.75rem',
  boxShadow: '0 12px 28px rgb(0 0 0 / 24%)',
  color: 'var(--foreground)',
}

/** Distribución no temporal; acompaña las tablas sin reemplazar sus valores exactos. */
export function CompositionChart({
  title,
  ariaLabel,
  rows,
  formatter = (value) => String(value),
}: CompositionChartProps) {
  const data = rows.filter((row) => row.value > 0)
  return (
    <section
      aria-label={ariaLabel}
      className="rounded-xl border border-border bg-card p-4 shadow-[0_8px_18px_rgb(16_44_37_/_6%)] dark:border-[#2b4a3d] dark:bg-[#102019] dark:shadow-[0_6px_18px_rgb(0_0_0_/_16%)]"
    >
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {data.length === 0 ? (
        <p className="flex h-52 items-center justify-center text-sm text-muted-foreground">
          Sin datos en el período.
        </p>
      ) : (
        <div className="grid items-center gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
          <ChartContainer
            config={Object.fromEntries(
              data.map((row) => [
                row.key,
                { label: row.label, color: row.color },
              ]),
            )}
            className="h-52"
          >
            <PieChart>
              <Tooltip
                cursor={false}
                contentStyle={tooltipStyle}
                formatter={(value) => formatter(Number(value))}
              />
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                innerRadius={48}
                outerRadius={76}
                paddingAngle={2}
              >
                {data.map((row) => (
                  <Cell key={row.key} fill={row.color} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <ul className="space-y-2 text-xs">
            {data.map((row) => (
              <li
                key={row.key}
                className="flex items-center justify-between gap-2"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: row.color }}
                  />
                  <span className="truncate">{row.label}</span>
                </span>
                <strong className="tabular-nums">{formatter(row.value)}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
