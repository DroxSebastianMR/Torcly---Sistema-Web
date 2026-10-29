import { useState } from 'react'
import { toast } from 'sonner'
import { ErrorState } from '@/components/ui/error-state'
import { ModuleMetrics } from '@/components/ui/module-metrics'
import { Pagination } from '@/components/ui/pagination'
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

      <ModuleMetrics
        items={[
          {
            label: 'Notificaciones',
            value: pagination?.total ?? 0,
          },
          {
            label: 'Sin leer',
            value: unreadCount,
            tone: unreadCount > 0 ? 'warning' : 'success',
          },
        ]}
      />

      <section
        aria-label="Filtros de notificaciones"
        className="rounded-2xl border bg-card p-4 shadow-[0_10px_28px_rgb(16_44_37_/_5%)] sm:p-5"
      >
        <NotificationsToolbar
          filters={filters}
          unreadCount={unreadCount}
          isMarkingAll={mutations.markAllAsRead.isPending}
          onFilterChange={handleFilterChange}
          onMarkAllAsRead={handleMarkAllAsRead}
        />
      </section>

      <section
        aria-label="Resultados de notificaciones"
        className="overflow-hidden rounded-2xl border bg-card shadow-[0_10px_35px_rgba(16,44,37,0.04)]"
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

        {pagination && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(page) => handleFilterChange({ page })}
          />
        )}
      </section>
    </div>
  )
}
