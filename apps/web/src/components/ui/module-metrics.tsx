import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type MetricTone = 'default' | 'success' | 'warning' | 'danger' | 'info'

export interface ModuleMetric {
  label: string
  value: ReactNode
  description?: ReactNode
  valueLabel?: ReactNode
  detail?: ReactNode
  tone?: MetricTone
}

interface ModuleMetricsProps {
  items: readonly ModuleMetric[]
  className?: string
}

const toneClasses: Record<
  MetricTone,
  { value: string; glow: string; ring: string; label: string }
> = {
  default: {
    value: 'text-brand-forest',
    glow: 'bg-emerald-100/50',
    ring: 'border-emerald-100/70',
    label: 'text-muted-foreground',
  },
  success: {
    value: 'text-emerald-700',
    glow: 'bg-emerald-100/50',
    ring: 'border-emerald-100/70',
    label: 'text-muted-foreground',
  },
  warning: {
    value: 'text-amber-700',
    glow: 'bg-amber-100/55',
    ring: 'border-amber-100/70',
    label: 'text-muted-foreground',
  },
  danger: {
    value: 'text-rose-600',
    glow: 'bg-rose-100/50',
    ring: 'border-rose-100/70',
    label: 'text-muted-foreground',
  },
  info: {
    value: 'text-primary',
    glow: 'bg-teal-100/55',
    ring: 'border-teal-100/70',
    label: 'text-muted-foreground',
  },
}

/** Indicadores compactos y sin iconografía decorativa para las páginas de módulo. */
export function ModuleMetrics({ items, className }: ModuleMetricsProps) {
  return (
    <section
      aria-label="Resumen del módulo"
      className={cn(
        'grid grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] gap-4',
        className,
      )}
    >
      {items.map((item) => (
        <MetricCard key={item.label} item={item} />
      ))}
    </section>
  )
}

function MetricCard({ item }: { item: ModuleMetric }) {
  const tone = toneClasses[item.tone ?? 'default']
  const description = item.description ?? item.detail
  const valueLabel = item.valueLabel

  return (
    <article className="relative isolate min-h-[132px] overflow-hidden rounded-[22px] border border-[#e2ebe6] bg-card p-5 shadow-[0_8px_22px_rgb(16_44_37_/_7%),inset_0_1px_0_rgb(255_255_255_/_90%)] transition-[box-shadow,transform] duration-150 hover:-translate-y-px hover:shadow-[0_12px_28px_rgb(16_44_37_/_11%),inset_0_1px_0_rgb(255_255_255_/_90%)]">
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute -right-12 -bottom-16 -z-10 size-40 rounded-full opacity-55 blur-[1px]',
          tone.glow,
        )}
      />
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute -right-10 -bottom-20 -z-10 size-40 rounded-full border',
          tone.ring,
        )}
      />
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute -right-4 -bottom-14 -z-10 size-28 rounded-full border',
          tone.ring,
        )}
      />
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute right-2 -bottom-8 -z-10 size-16 rounded-full border',
          tone.ring,
        )}
      />
      <div className="min-w-0">
        <p className="text-[13px] font-semibold uppercase tracking-[0.01em] text-[#52645d]">
          {item.label}
        </p>
      </div>
      <div className="mt-3 flex items-end gap-2">
        <strong
          className={cn(
            'text-[29px] font-bold leading-none tracking-[-0.04em] tabular-nums sm:text-3xl',
            tone.value,
          )}
        >
          {item.value}
        </strong>
        {valueLabel && (
          <span
            className={cn(
              'mb-px min-w-0 truncate text-sm font-medium',
              tone.label,
            )}
          >
            {valueLabel}
          </span>
        )}
      </div>
      {description && (
        <p className="mt-3 truncate text-[13px] text-muted-foreground">
          {description}
        </p>
      )}
    </article>
  )
}
