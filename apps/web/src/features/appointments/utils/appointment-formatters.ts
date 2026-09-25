import { isAxiosError } from 'axios'
import type {
  Appointment,
  AppointmentStatus,
} from '../types/appointments.types'

export const APPOINTMENT_SLOT_CAPACITY = 8

export function getAppointmentErrorMessage(error: unknown) {
  if (isAxiosError<{ error?: { message?: string } }>(error)) {
    return (
      error.response?.data.error?.message ??
      'No se pudo completar la operación.'
    )
  }
  return 'No se pudo completar la operación.'
}

export function appointmentStatusLabel(status: AppointmentStatus) {
  return status === 'PROGRAMADA' ? 'Programada' : 'Cancelada'
}

export function formatAppointmentDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return value
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}

export function formatAppointmentSchedule(date: string, time: string) {
  return `${formatAppointmentDate(date)} · ${time} h`
}

export function todayISO() {
  return toIsoDate(new Date())
}

export function nowTime() {
  return toTime(new Date())
}

export function isSlotPast(date: string, time: string) {
  const dateValue = toIsoDate(new Date())
  const timeValue = toTime(new Date())
  if (date < dateValue) return true
  if (date === dateValue) return time <= timeValue
  return false
}

export function appointmentVehicleLabel(appointment: Appointment) {
  return `${appointment.vehicle.plate} · ${appointment.vehicle.brand} ${appointment.vehicle.model}`
}

function toIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toTime(date: Date) {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}
