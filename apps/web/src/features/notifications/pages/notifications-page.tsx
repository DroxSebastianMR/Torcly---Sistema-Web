import { useState } from 'react'
import { toast } from 'sonner'
import { ErrorState } from '@/components/ui/error-state'
import { Pagination } from '@/components/ui/pagination'
import { NotificationsList } from '../components/notifications-list'
import { NotificationsToolbar } from '../components/notifications-toolbar'
import {
  useNotificationMutations,
  useNotifications,
  useUnreadNotificationsCount,
} from '../hooks/use-notifications'
import type { NotificationFilters } from '../types/notifications.types'

const TIME_FILTERS: Array<{
  label: string
  days?: number
}> = [
  { label: 'Todo' },
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
]

export default function NotificationsPage() {
  const [filters, setFilters] = useState<NotificationFilters>({
    read: 'all',
    page: 1,
    pageSize: 10,
  })

  const {
    data: notificationsData,
    isLoading,
    isError,
    refetch,
  } = useNotifications(filters)
  const { data: unreadData } = useUnreadNotificationsCount()
  const mutations = useNotificationMutations()

  const unreadCount = unreadData?.count ?? 0
  const notifications = notificationsData?.data ?? []
  const pagination = notificationsData?.pagination

  const handleFilterChange = (newFilters: Partial<NotificationFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      await mutations.markAsRead.mutateAsync(id)
      toast.success('Notificación marcada como leída.')
    } catch {
      toast.error('No se pudo marcar la notificación.')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const res = await mutations.markAllAsRead.mutateAsync()
      toast.success(
        res.updatedCount > 0
          ? `${res.updatedCount} notificaciones marcadas como leídas.`
          : 'Todas las notificaciones ya estaban leídas.',
      )
    } catch {
      toast.error('No se pudieron marcar todas las notificaciones.')
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Top Header with title and quick time pills */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Notificaciones
            </h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {unreadCount} {unreadCount === 1 ? 'nueva' : 'nuevas'}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Bandeja centralizada de eventos del taller: órdenes de trabajo,
            citas, stock, cobros y sistema.
          </p>
        </div>

        {/* Quick Date Pills (Image 2 reference) */}
        <div
          role="group"
          aria-label="Filtrar por antigüedad"
          className="inline-flex rounded-full border bg-muted/30 p-1 text-xs"
        >
          {TIME_FILTERS.map((tf) => {
            const isSelected = filters.days === tf.days
            return (
              <button
                key={tf.label}
                type="button"
                onClick={() =>
                  handleFilterChange({
                    days: tf.days,
                    page: 1,
                  })
                }
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tf.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Categories and Filters Bar */}
      <section
        aria-label="Filtros de notificaciones"
        className="rounded-2xl border bg-card p-4 shadow-[0_4px_20px_rgb(0_0_0_/_3%)]"
      >
        <NotificationsToolbar
          filters={filters}
          unreadCount={unreadCount}
          isMarkingAll={mutations.markAllAsRead.isPending}
          onFilterChange={handleFilterChange}
          onMarkAllAsRead={handleMarkAllAsRead}
        />
      </section>

      {/* Main Unified Notifications List */}
      <section
        aria-label="Resultados de notificaciones"
        className="overflow-hidden rounded-2xl border bg-card shadow-[0_8px_30px_rgb(0_0_0_/_4%)]"
      >
        {isError ? (
          <ErrorState
            title="No se pudieron cargar las notificaciones"
            description="Ocurrió un inconveniente al consultar tu bandeja de avisos."
            action={{
              label: 'Reintentar',
              onClick: () => refetch(),
            }}
          />
        ) : (
          <NotificationsList
            notifications={notifications}
            loading={isLoading}
            onMarkAsRead={handleMarkAsRead}
            isMarking={mutations.markAsRead.isPending}
          />
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="border-t p-4">
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(page) => handleFilterChange({ page })}
            />
          </div>
        )}
      </section>
    </div>
  )
}
