import { Area, AreaChart, Bar, BarChart, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartGrid, ChartLegend } from '@/components/ui/chart'

export interface TrendSeries {
  key: string
  label: string
  color: string
  formatter: (value: number) => string
}

const tooltipStyle = {
  backgroundColor: 'var(--surface-elevated)',
  border: '1px solid var(--border)',
  borderRadius: '0.75rem',
  boxShadow: '0 12px 28px rgb(0 0 0 / 24%)',
  color: 'var(--foreground)',
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
      className="rounded-xl border border-border bg-card p-4 shadow-[0_8px_18px_rgb(16_44_37_/_6%)] dark:border-[#2b4a3d] dark:bg-[#102019] dark:shadow-[0_6px_18px_rgb(0_0_0_/_16%)]"
    >
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
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
                stroke="var(--muted-foreground)"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={44}
                stroke="var(--muted-foreground)"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              />
              <Tooltip
                cursor={false}
                contentStyle={tooltipStyle}
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
                stroke="var(--muted-foreground)"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={44}
                stroke="var(--muted-foreground)"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              />
              <Tooltip
                cursor={false}
                contentStyle={tooltipStyle}
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
