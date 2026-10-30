import type { ReactElement, ReactNode } from 'react'
import { CartesianGrid, Legend, ResponsiveContainer, Tooltip } from 'recharts'
import { cn } from '@/lib/utils'

export type ChartConfig = Record<string, { label: string; color: string }>

interface ChartContainerProps {
  config: ChartConfig
  className?: string
  children: ReactNode
}

/** Base compartida para gráficos accesibles y consistentes de Torcly. */
export function ChartContainer({
  config,
  className,
  children,
}: ChartContainerProps) {
  return (
    <div
      className={cn(
        'h-56 w-full text-xs [&_.recharts-surface]:outline-none [&_.recharts-surface:focus]:outline-none',
        className,
      )}
      style={Object.fromEntries(
        Object.entries(config).map(([key, value]) => [
          `--color-${key}`,
          value.color,
        ]),
      )}
    >
      <ResponsiveContainer width="100%" height="100%">
        {children as ReactElement}
      </ResponsiveContainer>
    </div>
  )
}

export function ChartGrid() {
  return <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
}

export function ChartTooltip() {
  return <Tooltip cursor={false} />
}

export function ChartLegend() {
  return <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '0.5rem' }} />
}
