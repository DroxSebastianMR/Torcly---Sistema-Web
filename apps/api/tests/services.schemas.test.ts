import { describe, expect, it } from 'vitest'
import {
  serviceInputSchema,
  serviceQuerySchema,
  serviceStatusSchema,
  serviceUpdateSchema,
} from '../src/modules/services/services.schemas.js'

const validService = {
  code: 'cambio-aceite',
  name: 'Cambio de aceite',
  description: 'Servicio de mantenimiento básico',
  price: 35.5,
}

describe('Validación de servicios', () => {
  it('normaliza el código y acepta datos válidos', () => {
    const parsed = serviceInputSchema.parse(validService)
    expect(parsed.code).toBe('CAMBIO-ACEITE')
    expect(parsed.price).toBe(35.5)
  })

  it('rechaza precios negativos y códigos inválidos', () => {
    expect(
      serviceInputSchema.safeParse({ ...validService, price: -1 }).success,
    ).toBe(false)
    expect(
      serviceInputSchema.safeParse({ ...validService, code: 'ó ' }).success,
    ).toBe(false)
  })

  it('rechaza campos desconocidos con el esquema estricto', () => {
    expect(
      serviceInputSchema.safeParse({ ...validService, stock: 100 }).success,
    ).toBe(false)
    expect(
      serviceInputSchema.safeParse({ ...validService, active: true }).success,
    ).toBe(false)
  })

  it('rechaza un payload incompleto', () => {
    expect(serviceInputSchema.safeParse({}).success).toBe(false)
    expect(
      serviceInputSchema.safeParse({ code: 'x', name: 'Servicio' }).success,
    ).toBe(false)
  })

  it('valida el mismo payload en la actualización', () => {
    expect(serviceUpdateSchema.safeParse(validService).success).toBe(true)
  })

  it('limita la paginación y valida estado, y exige el booleano de estado', () => {
    expect(
      serviceQuerySchema.safeParse({ page: 0, pageSize: 500 }).success,
    ).toBe(false)
    expect(serviceQuerySchema.safeParse({ status: 'all' }).success).toBe(true)
    expect(serviceStatusSchema.safeParse({ active: 'yes' }).success).toBe(false)
    expect(serviceStatusSchema.safeParse({}).success).toBe(false)
  })
})
