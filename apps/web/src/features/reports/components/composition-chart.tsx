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
      className="rounded-xl border border-border/75 bg-[linear-gradient(145deg,#ffffff,#f9fcfb)] p-4 shadow-[0_8px_18px_rgb(16_44_37_/_3%)]"
    >
      <h3 className="text-sm font-semibold text-brand-forest">{title}</h3>
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
