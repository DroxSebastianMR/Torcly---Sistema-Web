import { CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { NotificationFilters } from '../types/notifications.types'

interface NotificationsToolbarProps {
  filters: NotificationFilters
  unreadCount: number
  isMarkingAll: boolean
  onFilterChange: (filters: Partial<NotificationFilters>) => void
  onMarkAllAsRead: () => void
}

export function NotificationsToolbar({
  filters,
  unreadCount,
  isMarkingAll,
  onFilterChange,
  onMarkAllAsRead,
}: NotificationsToolbarProps) {
  const filterOptions: Array<{
    label: string
    value: NotificationFilters['read']
  }> = [
    { label: 'Todas', value: 'all' },
    { label: `No leídas (${unreadCount})`, value: 'false' },
    { label: 'Leídas', value: 'true' },
  ]

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div
        role="group"
        aria-label="Filtrar notificaciones por estado de lectura"
        className="flex rounded-lg border bg-muted/40 p-0.5"
      >
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onFilterChange({ read: opt.value, page: 1 })}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              filters.read === opt.value
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-pressed={filters.read === opt.value}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div>
        <Button
          variant="outline"
          disabled={isMarkingAll || unreadCount === 0}
          onClick={onMarkAllAsRead}
          className="h-8 px-3 text-xs"
        >
          <CheckCheck size={14} className="mr-1.5 text-muted-foreground" />
          Marcar todas como leídas
        </Button>
      </div>
    </div>
  )
}
