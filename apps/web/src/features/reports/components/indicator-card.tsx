import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type IndicatorTone = 'green' | 'amber' | 'blue' | 'red' | 'purple' | 'cyan'

interface IndicatorCardProps {
  label: string
  value: string
  hint?: string
  icon?: ReactNode
  tone?: IndicatorTone
}

const toneClasses: Record<
  IndicatorTone,
  { card: string; icon: string; value: string }
> = {
  green: {
    card: 'border-emerald-100 bg-[linear-gradient(145deg,#ffffff,#f0faf5)]',
    icon: 'text-emerald-700',
    value: 'text-brand-forest',
  },
  amber: {
    card: 'border-amber-100 bg-[linear-gradient(145deg,#ffffff,#fff8eb)]',
    icon: 'text-amber-700',
    value: 'text-amber-700',
  },
  blue: {
    card: 'border-sky-100 bg-[linear-gradient(145deg,#ffffff,#f0f9ff)]',
    icon: 'text-sky-700',
    value: 'text-sky-700',
  },
  red: {
    card: 'border-rose-100 bg-[linear-gradient(145deg,#ffffff,#fff3f3)]',
    icon: 'text-rose-700',
    value: 'text-rose-700',
  },
  purple: {
    card: 'border-violet-100 bg-[linear-gradient(145deg,#ffffff,#f7f3ff)]',
    icon: 'text-violet-600',
    value: 'text-violet-700',
  },
  cyan: {
    card: 'border-cyan-100 bg-[linear-gradient(145deg,#ffffff,#effcff)]',
    icon: 'text-cyan-700',
    value: 'text-cyan-800',
  },
}

export function IndicatorCard({
  label,
  value,
  hint,
  icon,
  tone = 'green',
}: IndicatorCardProps) {
  const styles = toneClasses[tone]
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border p-4 shadow-[0_8px_18px_rgb(16_44_37_/_5%)]',
        styles.card,
      )}
    >
      {icon && (
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute -bottom-7 -right-10 opacity-[0.12] [&>svg]:!size-32',
            styles.icon,
          )}
        >
          {icon}
        </span>
      )}
      <div className="relative z-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </p>
      </div>
      <p
        className={cn(
          'relative z-10 mt-1.5 text-2xl font-bold tracking-tight',
          styles.value,
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
