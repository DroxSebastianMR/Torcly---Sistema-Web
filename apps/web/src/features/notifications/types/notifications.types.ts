export type NotificationType =
  | 'STOCK_LOW'
  | 'PURCHASE_RECEIVED'
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

export interface NotificationsResponse {
  data: NotificationItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface UnreadCountResponse {
  count: number
}
