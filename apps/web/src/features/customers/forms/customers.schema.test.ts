import { describe, expect, it } from 'vitest'
import { customerInputSchema } from './customers.schema'

const naturalValid = {
  type: 'NATURAL' as const,
  documentNumber: '12345678',
  firstName: 'María',
  lastName: 'Pérez',
  legalName: '',
  phone: '987654321',
  email: '',
  registerVehicle: false,
  vehiclePlate: '',
  vehicleBrand: '',
  vehicleModel: '',
  vehicleYear: 2022,
  vehicleMileage: '',
}

const legalValid = {
  type: 'LEGAL' as const,
  documentNumber: '20123456789',
  firstName: '',
  lastName: '',
  legalName: 'Torcly Repuestos S.A.C.',
  phone: '+51987654321',
  email: 'ventas@torcly.local',
  registerVehicle: false,
  vehiclePlate: '',
  vehicleBrand: '',
  vehicleModel: '',
  vehicleYear: 2022,
  vehicleMileage: '',
}

describe('Validación de clientes', () => {
  it('acepta una persona natural válida', () => {
    expect(customerInputSchema.safeParse(naturalValid).success).toBe(true)
  })

  it('acepta una persona jurídica válida', () => {
    expect(customerInputSchema.safeParse(legalValid).success).toBe(true)
  })

  it('rechaza DNI sin 8 dígitos y RUC sin 11 dígitos', () => {
    const shortDni = customerInputSchema.safeParse({
      ...naturalValid,
      documentNumber: '123',
    })
    expect(shortDni.success).toBe(false)
    expect(
      shortDni.error?.issues.find((issue) => issue.path[0] === 'documentNumber')
        ?.message,
    ).toBe('El DNI debe tener 8 dígitos.')

    const shortRuc = customerInputSchema.safeParse({
      ...legalValid,
      documentNumber: '12345678',
    })
    expect(shortRuc.success).toBe(false)
    expect(
      shortRuc.error?.issues.find((issue) => issue.path[0] === 'documentNumber')
        ?.message,
    ).toBe('El RUC debe tener 11 dígitos.')
  })

  it('exige nombres y apellidos en natural y razón social en jurídica', () => {
    const sinNombres = customerInputSchema.safeParse({
      ...naturalValid,
      firstName: '',
    })
    expect(sinNombres.success).toBe(false)
    expect(
      sinNombres.error?.issues.find((issue) => issue.path[0] === 'firstName')
        ?.message,
    ).toBe('Ingresa los nombres.')

    const sinRazonSocial = customerInputSchema.safeParse({
      ...legalValid,
      legalName: '',
    })
    expect(sinRazonSocial.success).toBe(false)
    expect(
      sinRazonSocial.error?.issues.find(
        (issue) => issue.path[0] === 'legalName',
      )?.message,
    ).toBe('Ingresa la razón social.')
  })

  it('rechaza teléfono y correo inválidos', () => {
    expect(
      customerInputSchema.safeParse({ ...naturalValid, phone: 'abc' }).success,
    ).toBe(false)
    expect(
      customerInputSchema.safeParse({
        ...naturalValid,
        email: 'correo-invalido',
      }).success,
    ).toBe(false)
  })

  it('tolera el correo vacío (opcional) y supera el límite de razón social', () => {
    expect(customerInputSchema.safeParse(naturalValid).success).toBe(true)
    expect(
      customerInputSchema.safeParse({
        ...legalValid,
        legalName: 'X'.repeat(161),
      }).success,
    ).toBe(false)
  })

  it('valida datos del vehículo cuando registerVehicle está activo', () => {
    const validWithVehicle = customerInputSchema.safeParse({
      ...naturalValid,
      registerVehicle: true,
      vehiclePlate: 'ABC-123',
      vehicleBrand: 'Toyota',
      vehicleModel: 'Corolla',
      vehicleYear: 2022,
      vehicleMileage: 40000,
    })
    expect(validWithVehicle.success).toBe(true)

    const invalidVehicle = customerInputSchema.safeParse({
      ...naturalValid,
      registerVehicle: true,
      vehiclePlate: '',
      vehicleBrand: '',
      vehicleModel: '',
    })
    expect(invalidVehicle.success).toBe(false)
    expect(
      invalidVehicle.error?.issues.find(
        (issue) => issue.path[0] === 'vehiclePlate',
      )?.message,
    ).toBe('Ingresa la placa del vehículo.')
  })
})
