import { Bell } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import type { NotificationItem } from '../types/notifications.types'
import { NotificationCard } from './notification-card'

interface NotificationsListProps {
  notifications: NotificationItem[]
  loading: boolean
  onMarkAsRead: (id: string) => void
  isMarking: boolean
}

function NotificationsSkeleton() {
  return (
    <div className="divide-y divide-border/60">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-4 p-5 animate-pulse">
          <div className="size-9 rounded-xl bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 rounded bg-muted" />
            <div className="h-3 w-2/3 rounded bg-muted" />
          </div>
          <div className="h-5 w-16 rounded-full bg-muted" />
        </div>
      ))}
    </div>
  )
}

export function NotificationsList({
  notifications,
  loading,
  onMarkAsRead,
  isMarking,
}: NotificationsListProps) {
  if (loading) {
    return <NotificationsSkeleton />
  }

  if (!notifications.length) {
    return (
      <div className="p-8">
        <EmptyState
          icon={Bell}
          title="Bandeja al día"
          description="No tienes notificaciones con los filtros seleccionados."
        />
      </div>
    )
  }

  return (
    <div className="divide-y divide-border/60">
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
          isMarking={isMarking}
        />
      ))}
    </div>
  )
}
