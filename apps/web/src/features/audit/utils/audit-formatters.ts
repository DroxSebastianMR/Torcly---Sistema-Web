import { isAxiosError } from 'axios'

export const auditEventLabels: Record<string, string> = {
  LOGIN_SUCCESS: 'Inicio de sesión correcto',
  LOGIN_FAILURE: 'Intento de sesión fallido',
  ACCOUNT_LOCKED: 'Cuenta bloqueada',
  LOGOUT: 'Cierre de sesión',
  SESSION_EXPIRED: 'Sesión expirada',
  ACCESS_DENIED: 'Acceso denegado',
  PASSWORD_RESET_REQUESTED: 'Recuperación solicitada',
  PASSWORD_RESET_COMPLETED: 'Contraseña restablecida',
  USER_CREATED: 'Usuario creado',
  USER_UPDATED: 'Usuario actualizado',
  USER_ROLE_CHANGED: 'Rol de usuario cambiado',
  USER_DEACTIVATED: 'Usuario desactivado',
  USER_ACTIVATED: 'Usuario activado',
  MAINTENANCE_SCHEDULED: 'Mantenimiento programado',
  MAINTENANCE_CANCELLED: 'Mantenimiento cancelado',
}

export const auditEventOptions = Object.entries(auditEventLabels).map(
  ([value, label]) => ({ value, label }),
)

export function formatAuditEvent(event: string): string {
  return auditEventLabels[event] ?? event
}

const dateTimeFormatter = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatAuditDate(value: string): string {
  return dateTimeFormatter.format(new Date(value))
}

export function getAuditErrorMessage(error: unknown): string {
  if (isAxiosError<{ error?: { message?: string } }>(error)) {
    return (
      error.response?.data.error?.message ??
      'No se pudo completar la operación.'
    )
  }
  return 'No se pudo completar la operación.'
}
