import { Link } from 'react-router-dom'
import {
  Bell,
  CalendarDays,
  Check,
  ClipboardList,
  ExternalLink,
  Truck,
  Wallet,
  Warehouse,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { NotificationItem } from '../types/notifications.types'
import { formatNotificationDate } from '../utils/notification-formatters'

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
  const getIconConfig = () => {
    switch (notification.type) {
      case 'STOCK_LOW':
        return {
          icon: Warehouse,
          bg: 'bg-amber-100 text-amber-700',
        }
      case 'PURCHASE_RECEIVED':
        return {
          icon: Truck,
          bg: 'bg-emerald-100 text-emerald-700',
        }
      case 'APPOINTMENT_RESCHEDULED':
      case 'APPOINTMENT_SCHEDULED':
        return {
          icon: CalendarDays,
          bg: 'bg-sky-100 text-sky-700',
        }
      case 'WORK_ORDER_READY':
        return {
          icon: ClipboardList,
          bg: 'bg-indigo-100 text-indigo-700',
        }
      case 'PAYMENT_COMPENSATED':
        return {
          icon: Wallet,
          bg: 'bg-purple-100 text-purple-700',
        }
      default:
        return {
          icon: Bell,
          bg: 'bg-primary/10 text-primary',
        }
    }
  }

  const { icon: Icon, bg } = getIconConfig()

  return (
    <div
      className={`flex items-start gap-4 rounded-xl border p-4 transition-colors ${
        notification.read
          ? 'bg-card text-muted-foreground'
          : 'bg-card border-primary/20 shadow-xs text-foreground'
      }`}
    >
      <div
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${bg}`}
      >
        <Icon size={18} />
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {!notification.read && (
              <span
                className="size-2 rounded-full bg-primary shrink-0"
                title="No leída"
                aria-label="No leída"
              />
            )}
            <h3
              className={`text-sm ${notification.read ? 'font-medium' : 'font-bold text-foreground'}`}
            >
              {notification.title}
            </h3>
          </div>
          <span className="text-[11px] text-muted-foreground shrink-0">
            {formatNotificationDate(notification.createdAt)}
          </span>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {notification.message}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
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
              disabled={isMarking}
              onClick={() => onMarkAsRead(notification.id)}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <Check size={13} className="mr-1" />
              Marcar como leída
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
