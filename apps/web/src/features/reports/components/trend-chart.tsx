import { Area, AreaChart, Bar, BarChart, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartGrid, ChartLegend } from '@/components/ui/chart'

export interface TrendSeries {
  key: string
  label: string
  color: string
  formatter: (value: number) => string
}

interface TrendChartProps<T extends object> {
  data: T[]
  series: TrendSeries[]
  type: 'area' | 'bar'
  title: string
  ariaLabel: string
  emptyMessage?: string
}

export function TrendChart<T extends object>({
  data,
  series,
  type,
  title,
  ariaLabel,
  emptyMessage = 'Sin datos en el período.',
}: TrendChartProps<T>) {
  const hasData = data.some((row) =>
    series.some(
      (item) => Number((row as Record<string, unknown>)[item.key] ?? 0) !== 0,
    ),
  )
  const config = Object.fromEntries(
    series.map((item) => [item.key, { label: item.label, color: item.color }]),
  )

  return (
    <section
      aria-label={ariaLabel}
      className="rounded-xl border border-border/75 bg-[linear-gradient(145deg,#ffffff,#f9fcfb)] p-4 shadow-[0_8px_18px_rgb(16_44_37_/_3%)]"
    >
      <h3 className="text-sm font-semibold text-brand-forest">{title}</h3>
      {!hasData ? (
        <p className="flex h-56 items-center justify-center text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        <ChartContainer config={config} className="mt-3 h-60">
          {type === 'area' ? (
            <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
              <ChartGrid />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                minTickGap={24}
              />
              <YAxis tickLine={false} axisLine={false} width={44} />
              <Tooltip
                cursor={false}
                formatter={(value, name) => {
                  const seriesItem = series.find(
                    (item) => item.key === name || item.label === name,
                  )
                  return [
                    seriesItem?.formatter(Number(value)) ?? String(value),
                    seriesItem?.label ?? String(name),
                  ]
                }}
              />
              <ChartLegend />
              {series.map((item) => (
                <Area
                  key={item.key}
                  type="monotone"
                  dataKey={item.key}
                  name={item.label}
                  stroke={item.color}
                  fill={item.color}
                  fillOpacity={0.14}
                  strokeWidth={2}
                  activeDot={{ r: 4 }}
                />
              ))}
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
              <ChartGrid />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                minTickGap={24}
              />
              <YAxis tickLine={false} axisLine={false} width={44} />
              <Tooltip
                cursor={false}
                formatter={(value, name) => {
                  const seriesItem = series.find(
                    (item) => item.key === name || item.label === name,
                  )
                  return [
                    seriesItem?.formatter(Number(value)) ?? String(value),
                    seriesItem?.label ?? String(name),
                  ]
                }}
              />
              <ChartLegend />
              {series.map((item) => (
                <Bar
                  key={item.key}
                  dataKey={item.key}
                  name={item.label}
                  fill={item.color}
                  radius={[5, 5, 0, 0]}
                />
              ))}
            </BarChart>
          )}
        </ChartContainer>
      )}
    </section>
  )
}
