import { describe, expect, it } from 'vitest'
import {
  appointmentFormSchema,
  appointmentRescheduleFormSchema,
} from './appointment.schema'

const validCreate = {
  customerId: 'c1',
  vehicleId: 'v1',
  date: '2099-12-31',
  time: '10:00',
  reason: 'Cambio de aceite',
}

function todayIso() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function yesterdayIso() {
  const date = new Date()
  date.setDate(date.getDate() - 1)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

describe('Esquema de citas (web)', () => {
  it('acepta un formulario válido', () => {
    expect(appointmentFormSchema.safeParse(validCreate).success).toBe(true)
  })

  it('exige cliente y vehículo', () => {
    const result = appointmentFormSchema.safeParse({
      ...validCreate,
      customerId: '',
      vehicleId: '',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message)
      expect(messages).toContain('Selecciona un cliente.')
      expect(messages).toContain('Selecciona un vehículo.')
    }
  })

  it('exige fecha y hora con formato válido', () => {
    const result = appointmentFormSchema.safeParse({
      ...validCreate,
      date: '31/12/2099',
      time: '10-00',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message)
      expect(messages).toContain('Selecciona una fecha.')
      expect(messages).toContain('Selecciona una hora.')
    }
  })

  it('exige un motivo de entre 3 y 300 caracteres', () => {
    const corto = appointmentFormSchema.safeParse({
      ...validCreate,
      reason: '  a  ',
    })
    expect(corto.success).toBe(false)

    const largo = appointmentFormSchema.safeParse({
      ...validCreate,
      reason: 'a'.repeat(301),
    })
    expect(largo.success).toBe(false)
  })

  it('rechaza una cita en una fecha pasada', () => {
    const result = appointmentFormSchema.safeParse({
      ...validCreate,
      date: yesterdayIso(),
      time: '10:00',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) =>
            issue.path[0] === 'time' &&
            issue.message.includes('no pueden estar en el pasado'),
        ),
      ).toBe(true)
    }
  })

  it('rechaza una hora ya pasada el día de hoy', () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - 2)
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')

    const result = appointmentFormSchema.safeParse({
      ...validCreate,
      date: todayIso(),
      time: `${hours}:${minutes}`,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) => issue.path[0] === 'time' && !result.success,
        ),
      ).toBe(true)
    }
  })

  it('acepta reprogramar con una fecha futura válida', () => {
    const result = appointmentRescheduleFormSchema.safeParse({
      date: '2099-06-15',
      time: '14:30',
    })

    expect(result.success).toBe(true)
  })

  it('rechaza reprogramar con fecha y hora en el pasado', () => {
    const result = appointmentRescheduleFormSchema.safeParse({
      date: yesterdayIso(),
      time: '09:00',
    })

    expect(result.success).toBe(false)
  })
})
