import { describe, expect, it } from 'vitest'
import {
  vehicleInputSchema,
  vehicleQuerySchema,
  vehicleUpdateSchema,
} from '../src/modules/vehicles/vehicles.schemas.js'
import { VEHICLE_YEAR_MAX } from '../src/modules/vehicles/vehicles.utils.js'

const valid = {
  plate: 'ABC123',
  brand: 'Toyota',
  model: 'Corolla',
  year: 2021,
  customerId: '2b8a4c19-9d3e-4f1b-8a2c-4f1b2c3d4e5f',
}

describe('Schemas de vehículos', () => {
  it('normaliza la placa a mayúsculas sin espacios ni guiones', () => {
    expect(vehicleInputSchema.parse({ ...valid, plate: 'abc-123' }).plate).toBe(
      'ABC123',
    )
    expect(vehicleInputSchema.parse({ ...valid, plate: 'abc 123' }).plate).toBe(
      'ABC123',
    )
    expect(
      vehicleInputSchema.parse({ ...valid, plate: ' AB-C-1-2-3 ' }).plate,
    ).toBe('ABC123')
  })

  it('trata placas equivalentes (con y sin separadores) como la misma', () => {
    const withHyphen = vehicleInputSchema.parse({ ...valid, plate: 'ABC-123' })
    const compact = vehicleInputSchema.parse({ ...valid, plate: 'ABC123' })
    expect(withHyphen.plate).toBe(compact.plate)
  })

  it('rechaza una placa con caracteres o longitud inválida', () => {
    const badCharacters = vehicleInputSchema.safeParse({
      ...valid,
      plate: 'ABC*123',
    })
    const tooShort = vehicleInputSchema.safeParse({ ...valid, plate: 'AB1' })
    expect(badCharacters.success).toBe(false)
    expect(tooShort.success).toBe(false)
  })

  it('valida el rango de años documentado', () => {
    const tooOld = vehicleInputSchema.safeParse({
      ...valid,
      year: 1949,
    })
    const tooNew = vehicleInputSchema.safeParse({
      ...valid,
      year: VEHICLE_YEAR_MAX + 1,
    })
    const boundaryLow = vehicleInputSchema.safeParse({ ...valid, year: 1950 })
    const boundaryHigh = vehicleInputSchema.safeParse({
      ...valid,
      year: VEHICLE_YEAR_MAX,
    })
    expect(tooOld.success).toBe(false)
    expect(tooNew.success).toBe(false)
    expect(boundaryLow.success).toBe(true)
    expect(boundaryHigh.success).toBe(true)
  })

  it('rechaza campos obligatorios vacíos y propietario inválido', () => {
    const emptyBrand = vehicleInputSchema.safeParse({ ...valid, brand: '  ' })
    const emptyModel = vehicleInputSchema.safeParse({ ...valid, model: '' })
    const badOwner = vehicleInputSchema.safeParse({
      ...valid,
      customerId: 'no-es-uuid',
    })
    expect(emptyBrand.success).toBe(false)
    expect(emptyModel.success).toBe(false)
    expect(badOwner.success).toBe(false)
  })

  it('la actualización no transporta el propietario', () => {
    const withoutOwner = vehicleUpdateSchema.parse({
      plate: 'ABC123',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2021,
      customerId: '2b8a4c19-9d3e-4f1b-8a2c-4f1b2c3d4e5f',
    })
    expect('customerId' in withoutOwner).toBe(false)
  })

  it('aplica valores por defecto al listado', () => {
    expect(vehicleQuerySchema.parse({})).toEqual({
      search: undefined,
      customerId: undefined,
      page: 1,
      pageSize: 20,
    })
  })
})
