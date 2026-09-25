import { describe, expect, it } from 'vitest'
import {
  appointmentIdSchema,
  appointmentInputSchema,
  appointmentQuerySchema,
  appointmentRescheduleSchema,
} from '../src/modules/appointments/appointment.schemas.js'

const customerId = 'a0000000-0000-4000-8000-000000000001'
const vehicleId = 'a0000000-0000-4000-8000-000000000002'

const validAppointment = {
  customerId,
  vehicleId,
  date: '2099-12-31',
  time: '09:30',
  reason: 'Cambio de aceite',
}

describe('Validación de citas', () => {
  it('acepta una cita válida', () => {
    const parsed = appointmentInputSchema.parse(validAppointment)
    expect(parsed).toEqual(validAppointment)
  })

  it('rechaza campos obligatorios ausentes', () => {
    expect(
      appointmentInputSchema.safeParse({
        ...validAppointment,
        customerId: undefined,
      }).success,
    ).toBe(false)
    expect(
      appointmentInputSchema.safeParse({
        ...validAppointment,
        vehicleId: undefined,
      }).success,
    ).toBe(false)
    expect(
      appointmentInputSchema.safeParse({ ...validAppointment, reason: '' })
        .success,
    ).toBe(false)
    expect(
      appointmentInputSchema.safeParse({ ...validAppointment, reason: 'ab' })
        .success,
    ).toBe(false)
  })

  it('rechaza fechas y horas mal formadas o inexistentes', () => {
    expect(
      appointmentInputSchema.safeParse({
        ...validAppointment,
        date: '2099-02-30',
      }).success,
    ).toBe(false)
    expect(
      appointmentInputSchema.safeParse({
        ...validAppointment,
        date: '31-12-2099',
      }).success,
    ).toBe(false)
    expect(
      appointmentInputSchema.safeParse({ ...validAppointment, time: '25:30' })
        .success,
    ).toBe(false)
    expect(
      appointmentInputSchema.safeParse({ ...validAppointment, time: '09:75' })
        .success,
    ).toBe(false)
  })

  it('rechaza identificadores inválidos y campos desconocidos', () => {
    expect(
      appointmentInputSchema.safeParse({
        ...validAppointment,
        customerId: 'no-uuid',
      }).success,
    ).toBe(false)
    expect(
      appointmentInputSchema.safeParse({ ...validAppointment, discount: 5 })
        .success,
    ).toBe(false)
    expect(appointmentIdSchema.safeParse({ id: 'raro' }).success).toBe(false)
    expect(appointmentIdSchema.safeParse({ id: customerId }).success).toBe(true)
  })

  it('valida la reprogramación con el mismo horario', () => {
    expect(
      appointmentRescheduleSchema.safeParse({
        date: '2099-12-31',
        time: '14:00',
      }).success,
    ).toBe(true)
    expect(
      appointmentRescheduleSchema.safeParse({
        date: '2099-12-31',
      }).success,
    ).toBe(false)
    expect(
      appointmentRescheduleSchema.safeParse({
        date: '2099-12-31',
        time: '24:00',
      }).success,
    ).toBe(false)
  })

  it('valida paginación, filtros y estado en la consulta', () => {
    expect(appointmentQuerySchema.parse({}).status).toBe('all')
    expect(appointmentQuerySchema.parse({ status: 'PROGRAMADA' }).status).toBe(
      'PROGRAMADA',
    )
    expect(appointmentQuerySchema.parse({ date: '2099-12-31' }).date).toBe(
      '2099-12-31',
    )
    expect(appointmentQuerySchema.safeParse({ status: 'PAID' }).success).toBe(
      false,
    )
    expect(
      appointmentQuerySchema.safeParse({ date: '2099-02-30' }).success,
    ).toBe(false)
    expect(appointmentQuerySchema.safeParse({ pageSize: 500 }).success).toBe(
      false,
    )
    expect(appointmentQuerySchema.safeParse({ page: 0 }).success).toBe(false)
    expect(
      appointmentQuerySchema.safeParse({ customerId: 'no-uuid' }).success,
    ).toBe(false)
  })
})
