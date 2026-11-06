import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type KpiTone = 'primary' | 'success' | 'warning' | 'danger'

interface KpiCardProps {
  label: string
  value: ReactNode
  detail?: ReactNode
  icon?: ReactNode
  tone?: KpiTone
  className?: string
}

const iconTone: Record<KpiTone, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/55 dark:text-emerald-300',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/55 dark:text-amber-300',
  danger: 'bg-red-50 text-red-700 dark:bg-red-950/55 dark:text-red-300',
}

export function KpiCard({
  label,
  value,
  detail,
  icon,
  tone = 'primary',
  className,
}: KpiCardProps) {
  return (
    <article
      className={cn(
        'flex min-h-[138px] items-center gap-[18px] rounded-2xl border border-border bg-card p-6 shadow-[0_8px_24px_rgb(16_44_37_/_6%)] dark:shadow-[0_8px_24px_rgb(0_0_0_/_18%)]',
        className,
      )}
    >
      {icon && (
        <span
          aria-hidden
          className={cn(
            'grid size-12 shrink-0 place-items-center rounded-full',
            iconTone[tone],
          )}
        >
          {icon}
        </span>
      )}
      <div className="grid min-w-0 gap-1">
        <p className="text-[13px] text-muted-foreground">{label}</p>
        <strong className="font-sans text-[28px] font-bold leading-none tracking-tight text-foreground tabular-nums">
          {value}
        </strong>
        {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
      </div>
    </article>
  )
}
