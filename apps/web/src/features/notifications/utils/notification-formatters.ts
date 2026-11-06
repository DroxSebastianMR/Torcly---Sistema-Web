import {
  Bell,
  CalendarDays,
  ClipboardList,
  Truck,
  Wallet,
  Warehouse,
} from 'lucide-react'

export const notificationDateFormatter = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatNotificationDate(dateStr: string): string {
  try {
    return notificationDateFormatter.format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

export function formatRelativeNotificationDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHours = Math.floor(diffMin / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSec < 60) return 'Hace un momento'
    if (diffMin < 60) return `Hace ${diffMin} min`
    if (diffHours < 24) return `Hace ${diffHours} h`
    if (diffDays === 1) {
      const timeStr = date.toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
      })
      return `Ayer, ${timeStr}`
    }
    if (diffDays < 7) return `Hace ${diffDays} días`
    return notificationDateFormatter.format(date)
  } catch {
    return dateStr
  }
}

export type NotificationCategoryKey =
  | 'all'
  | 'taller'
  | 'citas'
  | 'inventario'
  | 'caja'
  | 'sistema'

export function getNotificationCategory(type: string) {
  switch (type) {
    case 'WORK_ORDER_READY':
      return {
        key: 'taller' as NotificationCategoryKey,
        label: 'Taller',
        icon: ClipboardList,
        badgeClass:
          'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
        bgIconClass:
          'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
      }
    case 'APPOINTMENT_SCHEDULED':
    case 'APPOINTMENT_RESCHEDULED':
      return {
        key: 'citas' as NotificationCategoryKey,
        label: 'Citas',
        icon: CalendarDays,
        badgeClass:
          'bg-sky-50 text-sky-700 border border-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20',
        bgIconClass:
          'bg-sky-50 text-sky-700 border border-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20',
      }
    case 'APPOINTMENT_OVERDUE':
      return {
        key: 'citas' as NotificationCategoryKey,
        label: 'Cita Vencida',
        icon: CalendarDays,
        badgeClass:
          'bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20',
        bgIconClass:
          'bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20',
      }
    case 'STOCK_LOW':
      return {
        key: 'inventario' as NotificationCategoryKey,
        label: 'Stock Bajo',
        icon: Warehouse,
        badgeClass:
          'bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
        bgIconClass:
          'bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
      }
    case 'PURCHASE_RECEIVED':
      return {
        key: 'inventario' as NotificationCategoryKey,
        label: 'Inventario',
        icon: Truck,
        badgeClass:
          'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
        bgIconClass:
          'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
      }
    case 'PAYMENT_COMPENSATED':
      return {
        key: 'caja' as NotificationCategoryKey,
        label: 'Caja',
        icon: Wallet,
        badgeClass:
          'bg-violet-50 text-violet-700 border border-violet-100 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20',
        bgIconClass:
          'bg-violet-50 text-violet-700 border border-violet-100 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20',
      }
    case 'PAYMENT_DUE':
      return {
        key: 'caja' as NotificationCategoryKey,
        label: 'Cobro Vencido',
        icon: Wallet,
        badgeClass:
          'bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20',
        bgIconClass:
          'bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20',
      }
    case 'SYSTEM':
    default:
      return {
        key: 'sistema' as NotificationCategoryKey,
        label: 'Sistema',
        icon: Bell,
        badgeClass:
          'bg-cyan-50 text-cyan-700 border border-cyan-100 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/20',
        bgIconClass:
          'bg-cyan-50 text-cyan-700 border border-cyan-100 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/20',
      }
  }
}
