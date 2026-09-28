import { AppError } from '../../shared/errors/app-error.js'
import type { AppointmentStatus } from './appointment.types.js'

export const APPOINTMENT_SLOT_CAPACITY = 8

export function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  if (year < 2000 || year > 2100) return false
  const probe = new Date(Date.UTC(year, month - 1, day))
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
  )
}

export function toDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`)
}

export function toTimeOnly(value: string): Date {
  return new Date(`2000-01-01T${value}:00.000Z`)
}

export function dateToString(value: Date): string {
  return value.toISOString().slice(0, 10)
}

export function timeToString(value: Date): string {
  return value.toISOString().slice(11, 16)
}

export function todayLocalParts(): { dateISO: string; time: string } {
  const now = new Date()
  const dateISO = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes(),
  ).padStart(2, '0')}`
  return { dateISO, time }
}

export function assertNotPast(dateISO: string, time: string): void {
  const now = todayLocalParts()
  if (dateISO < now.dateISO) {
    throw new AppError(
      400,
      'APPOINTMENT_PAST_DATE',
      'La fecha de la cita no puede estar en el pasado.',
    )
  }
  if (dateISO === now.dateISO && time <= now.time) {
    throw new AppError(
      400,
      'APPOINTMENT_PAST_TIME',
      'La hora de la cita no puede estar en el pasado.',
    )
  }
}

export function assertActiveSlotCount(count: number): void {
  if (count >= APPOINTMENT_SLOT_CAPACITY) {
    throw new AppError(
      409,
      'APPOINTMENT_SLOT_FULL',
      `El horario seleccionado ya alcanzó su capacidad de ${APPOINTMENT_SLOT_CAPACITY} citas activas.`,
    )
  }
}

export function assertIsProgramada(appointment: {
  code: string
  status: AppointmentStatus
}): void {
  if (appointment.status !== 'PROGRAMADA') {
    throw new AppError(
      409,
      'APPOINTMENT_NOT_PROGRAMADA',
      `La cita ${appointment.code} ya no está programada y no se puede modificar.`,
    )
  }
}
