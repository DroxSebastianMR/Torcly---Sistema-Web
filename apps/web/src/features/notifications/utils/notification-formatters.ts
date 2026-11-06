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
          'bg-indigo-50/80 text-indigo-900 border border-indigo-300 dark:bg-indigo-500/15 dark:text-indigo-200 dark:border-indigo-400/40',
        bgIconClass:
          'bg-indigo-50 text-indigo-800 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-200 dark:border-indigo-400/40',
      }
    case 'APPOINTMENT_SCHEDULED':
    case 'APPOINTMENT_RESCHEDULED':
      return {
        key: 'citas' as NotificationCategoryKey,
        label: 'Citas',
        icon: CalendarDays,
        badgeClass:
          'bg-sky-50/80 text-sky-900 border border-sky-300 dark:bg-sky-500/15 dark:text-sky-200 dark:border-sky-400/40',
        bgIconClass:
          'bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-500/15 dark:text-sky-200 dark:border-sky-400/40',
      }
    case 'APPOINTMENT_OVERDUE':
      return {
        key: 'citas' as NotificationCategoryKey,
        label: 'Cita Vencida',
        icon: CalendarDays,
        badgeClass:
          'bg-rose-50/80 text-rose-900 border border-rose-300 dark:bg-rose-500/15 dark:text-rose-200 dark:border-rose-400/40',
        bgIconClass:
          'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-200 dark:border-rose-400/40',
      }
    case 'STOCK_LOW':
      return {
        key: 'inventario' as NotificationCategoryKey,
        label: 'Stock Bajo',
        icon: Warehouse,
        badgeClass:
          'bg-amber-50/80 text-amber-900 border border-amber-300 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-400/40',
        bgIconClass:
          'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-400/40',
      }
    case 'PURCHASE_RECEIVED':
      return {
        key: 'inventario' as NotificationCategoryKey,
        label: 'Inventario',
        icon: Truck,
        badgeClass:
          'bg-emerald-50/80 text-emerald-900 border border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-400/40',
        bgIconClass:
          'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-400/40',
      }
    case 'PAYMENT_COMPENSATED':
      return {
        key: 'caja' as NotificationCategoryKey,
        label: 'Caja',
        icon: Wallet,
        badgeClass:
          'bg-violet-50/80 text-violet-900 border border-violet-300 dark:bg-violet-500/15 dark:text-violet-200 dark:border-violet-400/40',
        bgIconClass:
          'bg-violet-50 text-violet-800 border border-violet-200 dark:bg-violet-500/15 dark:text-violet-200 dark:border-violet-400/40',
      }
    case 'PAYMENT_DUE':
      return {
        key: 'caja' as NotificationCategoryKey,
        label: 'Cobro Vencido',
        icon: Wallet,
        badgeClass:
          'bg-red-50/80 text-red-900 border border-red-300 dark:bg-red-500/15 dark:text-red-200 dark:border-red-400/40',
        bgIconClass:
          'bg-red-50 text-red-800 border border-red-200 dark:bg-red-500/15 dark:text-red-200 dark:border-red-400/40',
      }
    case 'SYSTEM':
    default:
      return {
        key: 'sistema' as NotificationCategoryKey,
        label: 'Sistema',
        icon: Bell,
        badgeClass:
          'bg-teal-50/80 text-teal-900 border border-teal-300 dark:bg-teal-500/15 dark:text-teal-200 dark:border-teal-400/40',
        bgIconClass:
          'bg-teal-50 text-teal-800 border border-teal-200 dark:bg-teal-500/15 dark:text-teal-200 dark:border-teal-400/40',
      }
  }
}
