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
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/60" />
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
      <EmptyState
        icon={Bell}
        title="Bandeja al día"
        description="No tienes notificaciones pendientes con el filtro actual."
      />
    )
  }

  return (
    <div className="space-y-3">
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
