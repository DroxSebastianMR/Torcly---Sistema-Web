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
          'bg-[#E7F6EF] text-[#329B78] border border-[#329B78]/40 dark:bg-[#329B78]/15 dark:text-[#6EE7B7] dark:border-[#329B78]/40',
        bgIconClass:
          'bg-[#E7F6EF] text-[#329B78] border border-[#329B78]/30 dark:bg-[#329B78]/15 dark:text-[#6EE7B7] dark:border-[#329B78]/40',
      }
    case 'APPOINTMENT_SCHEDULED':
    case 'APPOINTMENT_RESCHEDULED':
      return {
        key: 'citas' as NotificationCategoryKey,
        label: 'Citas',
        icon: CalendarDays,
        badgeClass:
          'bg-[#EAF4FD] text-[#4385C7] border border-[#4385C7]/40 dark:bg-[#4385C7]/15 dark:text-[#93C5FD] dark:border-[#4385C7]/40',
        bgIconClass:
          'bg-[#EAF4FD] text-[#4385C7] border border-[#4385C7]/30 dark:bg-[#4385C7]/15 dark:text-[#93C5FD] dark:border-[#4385C7]/40',
      }
    case 'APPOINTMENT_OVERDUE':
      return {
        key: 'citas' as NotificationCategoryKey,
        label: 'Cita Vencida',
        icon: CalendarDays,
        badgeClass:
          'bg-[#FFF0F4] text-[#CE4779] border border-[#CE4779]/40 dark:bg-[#CE4779]/15 dark:text-[#FDA4AF] dark:border-[#CE4779]/40',
        bgIconClass:
          'bg-[#FFF0F4] text-[#CE4779] border border-[#CE4779]/30 dark:bg-[#CE4779]/15 dark:text-[#FDA4AF] dark:border-[#CE4779]/40',
      }
    case 'STOCK_LOW':
      return {
        key: 'inventario' as NotificationCategoryKey,
        label: 'Stock Bajo',
        icon: Warehouse,
        badgeClass:
          'bg-[#FFFBE8] text-[#C58A24] border border-[#C58A24]/40 dark:bg-[#C58A24]/15 dark:text-[#FCD34D] dark:border-[#C58A24]/40',
        bgIconClass:
          'bg-[#FFFBE8] text-[#C58A24] border border-[#C58A24]/30 dark:bg-[#C58A24]/15 dark:text-[#FCD34D] dark:border-[#C58A24]/40',
      }
    case 'PURCHASE_RECEIVED':
      return {
        key: 'inventario' as NotificationCategoryKey,
        label: 'Inventario',
        icon: Truck,
        badgeClass:
          'bg-[#E7F6EF] text-[#329B78] border border-[#329B78]/40 dark:bg-[#329B78]/15 dark:text-[#6EE7B7] dark:border-[#329B78]/40',
        bgIconClass:
          'bg-[#E7F6EF] text-[#329B78] border border-[#329B78]/30 dark:bg-[#329B78]/15 dark:text-[#6EE7B7] dark:border-[#329B78]/40',
      }
    case 'PAYMENT_COMPENSATED':
      return {
        key: 'caja' as NotificationCategoryKey,
        label: 'Caja',
        icon: Wallet,
        badgeClass:
          'bg-[#FCEBFA] text-[#C34AB7] border border-[#C34AB7]/40 dark:bg-[#C34AB7]/15 dark:text-[#F472B6] dark:border-[#C34AB7]/40',
        bgIconClass:
          'bg-[#FCEBFA] text-[#C34AB7] border border-[#C34AB7]/30 dark:bg-[#C34AB7]/15 dark:text-[#F472B6] dark:border-[#C34AB7]/40',
      }
    case 'PAYMENT_DUE':
      return {
        key: 'caja' as NotificationCategoryKey,
        label: 'Cobro Vencido',
        icon: Wallet,
        badgeClass:
          'bg-[#FFF0F4] text-[#CE4779] border border-[#CE4779]/40 dark:bg-[#CE4779]/15 dark:text-[#FDA4AF] dark:border-[#CE4779]/40',
        bgIconClass:
          'bg-[#FFF0F4] text-[#CE4779] border border-[#CE4779]/30 dark:bg-[#CE4779]/15 dark:text-[#FDA4AF] dark:border-[#CE4779]/40',
      }
    case 'SYSTEM':
    default:
      return {
        key: 'sistema' as NotificationCategoryKey,
        label: 'Sistema',
        icon: Bell,
        badgeClass:
          'bg-[#F3EFFD] text-[#7852C9] border border-[#7852C9]/40 dark:bg-[#7852C9]/15 dark:text-[#C4B5FD] dark:border-[#7852C9]/40',
        bgIconClass:
          'bg-[#F3EFFD] text-[#7852C9] border border-[#7852C9]/30 dark:bg-[#7852C9]/15 dark:text-[#C4B5FD] dark:border-[#7852C9]/40',
      }
  }
}
