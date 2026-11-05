import type { NotificationPreferences } from '../profile/profile.types.js'

export type NotificationType =
  | 'STOCK_LOW'
  | 'PURCHASE_RECEIVED'
  | 'APPOINTMENT_SCHEDULED'
  | 'APPOINTMENT_RESCHEDULED'
  | 'WORK_ORDER_READY'
  | 'PAYMENT_COMPENSATED'
  | 'SYSTEM'

export interface NotificationItem {
  id: string
  title: string
  message: string
  type: string
  link: string | null
  permissionRequired: string | null
  read: boolean
  readAt: string | null
  createdAt: string
}

export interface NotificationFilters {
  read: 'all' | 'true' | 'false'
  type?: string
  page: number
  pageSize: number
}

export interface NotificationCreateInput {
  organizationId: string
  userId: string
  title: string
  message: string
  type: string
  link?: string | null
  permissionRequired?: string | null
}

export interface OperationalNotificationEvent {
  /**
   * Las notificaciones operativas pertenecen siempre a un taller. La
   * plataforma no recibe eventos de la operación de sus organizaciones.
   */
  organizationId: string
  permission: string
  type: NotificationType
  preferenceKey?: keyof NotificationPreferences
  title: string
  message: string
  link?: string
}
