export interface NotificationPreferences {
  stockLow: boolean
  purchaseReceived: boolean
  appointmentUpdates: boolean
  workOrderReady: boolean
  paymentCompensated: boolean
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  stockLow: true,
  purchaseReceived: true,
  appointmentUpdates: true,
  workOrderReady: true,
  paymentCompensated: true,
}

export interface ProfileResponse {
  id: string
  username: string
  email: string
  displayName: string
  roles: Array<{ id: string; code: string; name: string }>
  permissions: string[]
  notificationPreferences: NotificationPreferences
  createdAt: string
  updatedAt: string
}

export interface UpdateProfileInput {
  displayName: string
  notificationPreferences?: Partial<NotificationPreferences>
}

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}
