import { Link } from 'react-router-dom'
import { Check, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { NotificationItem } from '../types/notifications.types'
import {
  formatNotificationDate,
  formatRelativeNotificationDate,
  getNotificationCategory,
} from '../utils/notification-formatters'

interface NotificationCardProps {
  notification: NotificationItem
  onMarkAsRead: (id: string) => void
  isMarking: boolean
}

export function NotificationCard({
  notification,
  onMarkAsRead,
  isMarking,
}: NotificationCardProps) {
  const category = getNotificationCategory(notification.type)
  const Icon = category.icon

  return (
    <div
      className={`group flex items-start justify-between gap-4 px-5 py-4.5 transition-colors hover:bg-muted/40 sm:px-6 ${
        notification.read ? 'bg-card' : 'bg-primary/[0.02]'
      }`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3.5">
        {/* Subtle category icon */}
        <div
          className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${category.bgIconClass}`}
        >
          <Icon size={16} />
        </div>

        {/* Text details */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {!notification.read && (
              <span
                className="size-2 shrink-0 rounded-full bg-emerald-500"
                title="No leída"
                aria-label="No leída"
              />
            )}
            <h3
              className={`text-sm ${
                notification.read
                  ? 'font-medium text-foreground/80'
                  : 'font-bold text-foreground'
              }`}
            >
              {notification.title}
            </h3>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            {notification.message}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {notification.link && (
              <Link
                to={notification.link}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <span>Ver detalle</span>
                <ExternalLink size={12} />
              </Link>
            )}

            {!notification.read && (
              <Button
                variant="ghost"
                size="sm"
                disabled={isMarking}
                onClick={() => onMarkAsRead(notification.id)}
                className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <Check size={12} className="mr-1" />
                Marcar como leída
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Right column: Vivid Category badge + timestamp */}
      <div className="flex shrink-0 flex-col items-end justify-start self-stretch pl-2 text-right">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${category.badgeClass}`}
        >
          {category.label}
        </span>
        <span
          className="mt-1.5 text-xs text-muted-foreground"
          title={formatNotificationDate(notification.createdAt)}
        >
          {formatRelativeNotificationDate(notification.createdAt)}
        </span>
      </div>
    </div>
  )
}
