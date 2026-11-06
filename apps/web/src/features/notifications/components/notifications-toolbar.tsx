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

const CATEGORIES = [
  { value: 'all', label: 'Todas las áreas' },
  { value: 'taller', label: 'Taller' },
  { value: 'citas', label: 'Citas' },
  { value: 'inventario', label: 'Inventario' },
  { value: 'caja', label: 'Caja' },
  { value: 'sistema', label: 'Sistema' },
]

export function NotificationsToolbar({
  filters,
  unreadCount,
  isMarkingAll,
  onFilterChange,
  onMarkAllAsRead,
}: NotificationsToolbarProps) {
  const readOptions: Array<{
    label: string
    value: NotificationFilters['read']
  }> = [
    { label: 'Todas', value: 'all' },
    {
      label: unreadCount > 0 ? `No leídas (${unreadCount})` : 'No leídas',
      value: 'false',
    },
    { label: 'Leídas', value: 'true' },
  ]

  const activeCategory = filters.category || 'all'

  return (
    <div className="flex flex-col gap-4">
      {/* Category tabs */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex items-center gap-1.5">
          {CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat.value
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() =>
                  onFilterChange({
                    category: cat.value === 'all' ? undefined : cat.value,
                    page: 1,
                  })
                }
                className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-xs dark:bg-[#1b7e58]'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {cat.label}
              </button>
            )
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={isMarkingAll || unreadCount === 0}
          onClick={onMarkAllAsRead}
          className="h-8 shrink-0 text-xs font-medium"
        >
          <CheckCheck size={14} className="mr-1.5 text-muted-foreground" />
          Marcar todas como leídas
        </Button>
      </div>

      {/* Secondary filter: Read state */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <div
          role="group"
          aria-label="Filtrar por lectura"
          className="inline-flex rounded-lg border bg-muted/30 p-0.5"
        >
          {readOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onFilterChange({ read: opt.value, page: 1 })}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                filters.read === opt.value
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-pressed={filters.read === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
