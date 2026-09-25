import { describe, expect, it } from 'vitest'
import {
  customerInputSchema,
  customerQuerySchema,
} from '../src/modules/customers/customers.schemas.js'

const naturalValid = {
  type: 'NATURAL',
  documentNumber: '12345678',
  firstName: 'María',
  lastName: 'Pérez',
  phone: '987654321',
}

const legalValid = {
  type: 'LEGAL',
  documentNumber: '20123456789',
  legalName: 'Torcly Repuestos S.A.C.',
  phone: '+51987654321',
}

describe('Schemas de clientes', () => {
  it('acepta persona natural completa y normaliza el correo vacío', () => {
    const result = customerInputSchema.parse(naturalValid)
    expect(result.type).toBe('NATURAL')
    expect(result.email).toBeNull()
  })

  it('acepta persona jurídica con RUC y teléfono internacional', () => {
    const result = customerInputSchema.parse(legalValid)
    if (result.type !== 'LEGAL') throw new Error('Debe ser persona jurídica')
    expect(result.legalName).toBe(legalValid.legalName)
  })

  it('rechaza DNI sin 8 dígitos y RUC sin 11 dígitos', () => {
    const badDni = customerInputSchema.safeParse({
      ...naturalValid,
      documentNumber: '1234',
    })
    const badRuc = customerInputSchema.safeParse({
      ...legalValid,
      documentNumber: '2012345678',
    })
    expect(badDni.success).toBe(false)
    expect(badRuc.success).toBe(false)
  })

  it('rechaza un teléfono inválido', () => {
    expect(
      customerInputSchema.safeParse({
        ...naturalValid,
        phone: 'abc',
      }).success,
    ).toBe(false)
  })

  it('exige los campos del tipo elegido y rechaza mezclas', () => {
    const missingLastName = customerInputSchema.safeParse({
      type: 'NATURAL',
      documentNumber: '12345678',
      firstName: 'María',
      phone: '987654321',
    })
    const missingLegalName = customerInputSchema.safeParse({
      ...legalValid,
      legalName: undefined,
    })
    expect(missingLastName.success).toBe(false)
    expect(missingLegalName.success).toBe(false)
  })

  it('rechaza un correo mal formado', () => {
    expect(
      customerInputSchema.safeParse({
        ...legalValid,
        email: 'no-es-correo',
      }).success,
    ).toBe(false)
  })

  it('aplica valores por defecto al listado', () => {
    expect(customerQuerySchema.parse({})).toEqual({
      search: undefined,
      type: 'all',
      page: 1,
      pageSize: 20,
    })
  })
})
