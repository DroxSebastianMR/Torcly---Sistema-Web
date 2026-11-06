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
    card:
      'border-emerald-100 bg-gradient-to-br from-card to-emerald-50 dark:border-emerald-800/70 dark:bg-[#10271d] dark:bg-none',
    icon: 'text-emerald-700 dark:text-emerald-300',
    value: 'text-emerald-700 dark:text-emerald-300',
  },
  amber: {
    card:
      'border-amber-100 bg-gradient-to-br from-card to-amber-50 dark:border-amber-700/70 dark:bg-[#292615] dark:bg-none',
    icon: 'text-amber-700 dark:text-amber-300',
    value: 'text-amber-700 dark:text-amber-300',
  },
  blue: {
    card:
      'border-sky-100 bg-gradient-to-br from-card to-sky-50 dark:border-sky-700/70 dark:bg-[#10282d] dark:bg-none',
    icon: 'text-sky-700 dark:text-sky-300',
    value: 'text-sky-700 dark:text-sky-300',
  },
  red: {
    card:
      'border-rose-100 bg-gradient-to-br from-card to-rose-50 dark:border-rose-700/70 dark:bg-[#2a1b21] dark:bg-none',
    icon: 'text-rose-700 dark:text-rose-300',
    value: 'text-rose-700 dark:text-rose-300',
  },
  purple: {
    card:
      'border-violet-100 bg-gradient-to-br from-card to-violet-50 dark:border-violet-700/70 dark:bg-[#211c31] dark:bg-none',
    icon: 'text-violet-600 dark:text-violet-300',
    value: 'text-violet-700 dark:text-violet-300',
  },
  cyan: {
    card:
      'border-cyan-100 bg-gradient-to-br from-card to-cyan-50 dark:border-cyan-700/70 dark:bg-[#102a2b] dark:bg-none',
    icon: 'text-cyan-700 dark:text-cyan-300',
    value: 'text-cyan-800 dark:text-cyan-300',
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
        'relative overflow-hidden rounded-xl border p-4 shadow-[0_8px_18px_rgb(16_44_37_/_5%)] dark:shadow-[0_6px_18px_rgb(0_0_0_/_16%)]',
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
