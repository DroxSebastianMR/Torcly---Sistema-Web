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
          'bg-[#E6F7ED] text-[#059669] dark:bg-emerald-950/70 dark:text-emerald-300',
        bgIconClass:
          'bg-[#E6F7ED] text-[#059669] dark:bg-emerald-950/70 dark:text-emerald-300',
      }
    case 'APPOINTMENT_SCHEDULED':
    case 'APPOINTMENT_RESCHEDULED':
      return {
        key: 'citas' as NotificationCategoryKey,
        label: 'Citas',
        icon: CalendarDays,
        badgeClass:
          'bg-[#EFF6FF] text-[#2563EB] dark:bg-blue-950/70 dark:text-blue-300',
        bgIconClass:
          'bg-[#EFF6FF] text-[#2563EB] dark:bg-blue-950/70 dark:text-blue-300',
      }
    case 'APPOINTMENT_OVERDUE':
      return {
        key: 'citas' as NotificationCategoryKey,
        label: 'Cita Vencida',
        icon: CalendarDays,
        badgeClass:
          'bg-[#FEF2F2] text-[#E11D48] dark:bg-rose-950/70 dark:text-rose-300',
        bgIconClass:
          'bg-[#FEF2F2] text-[#E11D48] dark:bg-rose-950/70 dark:text-rose-300',
      }
    case 'STOCK_LOW':
      return {
        key: 'inventario' as NotificationCategoryKey,
        label: 'Stock Bajo',
        icon: Warehouse,
        badgeClass:
          'bg-[#FEFCE8] text-[#D97706] dark:bg-amber-950/70 dark:text-amber-300',
        bgIconClass:
          'bg-[#FEFCE8] text-[#D97706] dark:bg-amber-950/70 dark:text-amber-300',
      }
    case 'PURCHASE_RECEIVED':
      return {
        key: 'inventario' as NotificationCategoryKey,
        label: 'Inventario',
        icon: Truck,
        badgeClass:
          'bg-[#E6F7ED] text-[#059669] dark:bg-emerald-950/70 dark:text-emerald-300',
        bgIconClass:
          'bg-[#E6F7ED] text-[#059669] dark:bg-emerald-950/70 dark:text-emerald-300',
      }
    case 'PAYMENT_COMPENSATED':
      return {
        key: 'caja' as NotificationCategoryKey,
        label: 'Caja',
        icon: Wallet,
        badgeClass:
          'bg-[#FDF2F8] text-[#C026D3] dark:bg-fuchsia-950/70 dark:text-fuchsia-300',
        bgIconClass:
          'bg-[#FDF2F8] text-[#C026D3] dark:bg-fuchsia-950/70 dark:text-fuchsia-300',
      }
    case 'PAYMENT_DUE':
      return {
        key: 'caja' as NotificationCategoryKey,
        label: 'Cobro Vencido',
        icon: Wallet,
        badgeClass:
          'bg-[#FEFCE8] text-[#D97706] dark:bg-amber-950/70 dark:text-amber-300',
        bgIconClass:
          'bg-[#FEFCE8] text-[#D97706] dark:bg-amber-950/70 dark:text-amber-300',
      }
    case 'SYSTEM':
    default:
      return {
        key: 'sistema' as NotificationCategoryKey,
        label: 'Sistema',
        icon: Bell,
        badgeClass:
          'bg-[#F5F3FF] text-[#7C3AED] dark:bg-violet-950/70 dark:text-violet-300',
        bgIconClass:
          'bg-[#F5F3FF] text-[#7C3AED] dark:bg-violet-950/70 dark:text-violet-300',
      }
  }
}
