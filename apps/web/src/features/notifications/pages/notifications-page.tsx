import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/error-state'
import { NotificationsList } from '../components/notifications-list'
import { NotificationsToolbar } from '../components/notifications-toolbar'
import {
  useNotificationMutations,
  useNotifications,
  useUnreadNotificationsCount,
} from '../hooks/use-notifications'
import type { NotificationFilters } from '../types/notifications.types'

export default function NotificationsPage() {
  const [filters, setFilters] = useState<NotificationFilters>({
    read: 'all',
    page: 1,
    pageSize: 15,
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
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
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
          <p className="text-sm text-muted-foreground mt-1">
            Centro de avisos operativos: almacén, compras, citas, taller y caja.
          </p>
        </div>
      </div>

      <NotificationsToolbar
        filters={filters}
        unreadCount={unreadCount}
        isMarkingAll={mutations.markAllAsRead.isPending}
        onFilterChange={handleFilterChange}
        onMarkAllAsRead={handleMarkAllAsRead}
      />

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

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
          <span>
            Página {pagination.page} de {pagination.totalPages} (
            {pagination.total}{' '}
            {pagination.total === 1 ? 'notificación' : 'notificaciones'})
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={pagination.page <= 1}
              onClick={() =>
                handleFilterChange({ page: Math.max(1, pagination.page - 1) })
              }
              className="h-8 px-3 text-xs"
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => handleFilterChange({ page: pagination.page + 1 })}
              className="h-8 px-3 text-xs"
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
