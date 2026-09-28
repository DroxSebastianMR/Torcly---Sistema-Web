import { describe, expect, it } from 'vitest'
import {
  APPOINTMENT_SLOT_CAPACITY,
  assertActiveSlotCount,
  assertIsProgramada,
  assertNotPast,
  dateToString,
  isValidDateString,
  timeToString,
  toDateOnly,
  toTimeOnly,
} from '../src/modules/appointments/appointment.rules.js'

const pad = (value: number) => String(value).padStart(2, '0')

function localTodayISO() {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function isoInDays(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

describe('Reglas de citas', () => {
  it('valida fechas en formato ISO reales', () => {
    expect(isValidDateString('2099-12-31')).toBe(true)
    expect(isValidDateString(isoInDays(5))).toBe(true)
    expect(isValidDateString('2026-02-30')).toBe(false)
    expect(isValidDateString('2099-13-01')).toBe(false)
    expect(isValidDateString('not-a-date')).toBe(false)
  })

  it('convierte fecha y hora a valores y de vuelta a texto', () => {
    expect(dateToString(toDateOnly('2099-12-31'))).toBe('2099-12-31')
    expect(timeToString(toTimeOnly('09:30'))).toBe('09:30')
  })

  it('rechaza citas con fecha pasada', () => {
    expect(() => assertNotPast('2020-01-01', '10:00')).toThrowError(
      expect.objectContaining({
        status: 400,
        code: 'APPOINTMENT_PAST_DATE',
      }),
    )
  })

  it('rechaza citas de hoy con hora ya transcurrida', () => {
    expect(() => assertNotPast(localTodayISO(), '00:00')).toThrowError(
      expect.objectContaining({
        status: 400,
        code: 'APPOINTMENT_PAST_TIME',
      }),
    )
  })

  it('acepta fechas y horas futuras', () => {
    expect(() => assertNotPast(isoInDays(5), '10:00')).not.toThrow()
  })

  it('aplica la capacidad de 8 citas activas por horario', () => {
    expect(APPOINTMENT_SLOT_CAPACITY).toBe(8)
    expect(() => assertActiveSlotCount(7)).not.toThrow()
    expect(() => assertActiveSlotCount(8)).toThrowError(
      expect.objectContaining({
        status: 409,
        code: 'APPOINTMENT_SLOT_FULL',
      }),
    )
    expect(() => assertActiveSlotCount(20)).toThrowError(
      expect.objectContaining({
        status: 409,
        code: 'APPOINTMENT_SLOT_FULL',
      }),
    )
  })

  it('solo permite modificar citas programadas', () => {
    expect(() =>
      assertIsProgramada({ code: 'CITA-000001', status: 'PROGRAMADA' }),
    ).not.toThrow()
    expect(() =>
      assertIsProgramada({ code: 'CITA-000002', status: 'CANCELADA' }),
    ).toThrowError(
      expect.objectContaining({
        status: 409,
        code: 'APPOINTMENT_NOT_PROGRAMADA',
      }),
    )
  })
})
