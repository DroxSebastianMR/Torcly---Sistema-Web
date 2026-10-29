import type { ReplenishmentPriority } from '../types/replenishment.types'
import { priorityLabels } from '../utils/replenishment-formatters'

const priorityTone: Record<ReplenishmentPriority, string> = {
  CRITICA: 'bg-rose-50 text-rose-700',
  ALTA: 'bg-amber-50 text-amber-700',
  MEDIA: 'bg-sky-50 text-sky-700',
  BAJA: 'bg-emerald-50 text-emerald-700',
}

interface PriorityBadgeProps {
  priority: ReplenishmentPriority | null
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  if (!priority) {
    return <span className="text-muted-foreground/70">—</span>
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${priorityTone[priority]}`}
    >
      {priorityLabels[priority]}
    </span>
  )
}
