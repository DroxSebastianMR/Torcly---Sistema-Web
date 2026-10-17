import { isAxiosError } from 'axios'
import type { MaintenanceWindowStatus } from '../types/maintenance.types'

const dateTimeFormatter = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDateTime(value: string): string {
  return dateTimeFormatter.format(new Date(value))
}

export function formatWindowRange(startsAt: string, endsAt: string): string {
  return `${formatDateTime(startsAt)} — ${formatDateTime(endsAt)}`
}

export const maintenanceStatusLabels: Record<MaintenanceWindowStatus, string> =
  {
    scheduled: 'Programado',
    active: 'En curso',
    past: 'Finalizado',
  }

export function getMaintenanceErrorMessage(error: unknown): string {
  if (isAxiosError<{ error?: { message?: string } }>(error)) {
    return (
      error.response?.data.error?.message ??
      'No se pudo completar la operación.'
    )
  }
  return 'No se pudo completar la operación.'
}
