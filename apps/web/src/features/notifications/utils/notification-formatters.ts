import {
  Bell,
  CalendarDays,
  ClipboardList,
  Truck,
  Wallet,
  Warehouse,
  type LucideIcon,
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

export interface CategoryAppearance {
  key: NotificationCategoryKey
  label: string
  icon: LucideIcon
  bg: string
  accent: string
}

export function getNotificationCategory(type: string): CategoryAppearance {
  switch (type) {
    case 'WORK_ORDER_READY':
      return {
        key: 'taller',
        label: 'Taller',
        icon: ClipboardList,
        bg: '#E7F6EF', // Verde menta
        accent: '#329B78',
      }
    case 'APPOINTMENT_SCHEDULED':
    case 'APPOINTMENT_RESCHEDULED':
      return {
        key: 'citas',
        label: 'Citas',
        icon: CalendarDays,
        bg: '#EAF4FD', // Azul cielo
        accent: '#4385C7',
      }
    case 'APPOINTMENT_OVERDUE':
      return {
        key: 'citas',
        label: 'Cita Vencida',
        icon: CalendarDays,
        bg: '#FFF0F4', // Rosa suave
        accent: '#CE4779',
      }
    case 'STOCK_LOW':
      return {
        key: 'inventario',
        label: 'Stock Bajo',
        icon: Warehouse,
        bg: '#FFFBE8', // Amarillo crema
        accent: '#C58A24',
      }
    case 'PURCHASE_RECEIVED':
      return {
        key: 'inventario',
        label: 'Inventario',
        icon: Truck,
        bg: '#E7F6EF', // Verde menta
        accent: '#329B78',
      }
    case 'PAYMENT_COMPENSATED':
      return {
        key: 'caja',
        label: 'Caja',
        icon: Wallet,
        bg: '#FCEBFA', // Rosa lavanda
        accent: '#C34AB7',
      }
    case 'PAYMENT_DUE':
      return {
        key: 'caja',
        label: 'Cobro Vencido',
        icon: Wallet,
        bg: '#FFF0F4', // Rosa suave
        accent: '#CE4779',
      }
    case 'SYSTEM':
    default:
      return {
        key: 'sistema',
        label: 'Sistema',
        icon: Bell,
        bg: '#EAF4FD', // Azul cielo
        accent: '#4385C7',
      }
  }
}
