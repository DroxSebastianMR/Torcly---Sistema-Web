import { describe, expect, it } from 'vitest'
import {
  confirmPurchaseSchema,
  purchaseInputSchema,
  purchaseQuerySchema,
  supplierInputSchema,
  supplierQuerySchema,
} from '../src/modules/purchases/purchases.schemas.js'

describe('supplierInputSchema', () => {
  it('acepta un proveedor válido', () => {
    const result = supplierInputSchema.parse({
      legalName: 'Repuestos SA',
      documentNumber: 'RUC-123456',
      contactName: 'Juan',
      phone: '+51 999 000 111',
      email: 'contacto@repuestos.com',
    })
    expect(result.legalName).toBe('Repuestos SA')
    expect(result.email).toBe('contacto@repuestos.com')
  })

  it('rechaza razón social vacía o muy corta', () => {
    expect(() =>
      supplierInputSchema.parse({
        legalName: 'A',
        documentNumber: 'RUC-123',
      }),
    ).toThrow()
  })

  it('rechaza correo inválido', () => {
    expect(() =>
      supplierInputSchema.parse({
        legalName: 'Repuestos SA',
        documentNumber: 'RUC-123',
        email: 'no-es-email',
      }),
    ).toThrow()
  })

  it('convierte nullish a null', () => {
    const result = supplierInputSchema.parse({
      legalName: 'Repuestos SA',
      documentNumber: 'RUC-123456',
    })
    expect(result.contactName).toBeNull()
    expect(result.phone).toBeNull()
    expect(result.email).toBeNull()
  })

  it('rechaza claves desconocidas', () => {
    expect(() =>
      supplierInputSchema.parse({
        legalName: 'Repuestos SA',
        documentNumber: 'RUC-123',
        unknown: 'field',
      }),
    ).toThrow()
  })
})

describe('supplierQuerySchema', () => {
  it('aplica valores por defecto', () => {
    const result = supplierQuerySchema.parse({})
    expect(result.active).toBe('all')
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(20)
  })

  it('acepta filtros válidos', () => {
    const result = supplierQuerySchema.parse({
      search: 'Repuestos',
      active: 'true',
      page: '3',
      pageSize: '50',
    })
    expect(result.search).toBe('Repuestos')
    expect(result.active).toBe('true')
    expect(result.page).toBe(3)
    expect(result.pageSize).toBe(50)
  })
})

describe('purchaseInputSchema', () => {
  const validBase = {
    supplierId: '11111111-1111-4111-8111-111111111111',
    purchaseDate: '2026-10-24',
    lines: [
      {
        productId: '22222222-2222-4222-8222-222222222222',
        quantity: 5,
        unitCost: 12.5,
      },
    ],
  }

  it('acepta una compra válida', () => {
    const result = purchaseInputSchema.parse(validBase)
    expect(result.lines).toHaveLength(1)
    expect(result.lines[0]?.quantity).toBe(5)
  })

  it('acepta cantidades decimales de hasta tres decimales', () => {
    const result = purchaseInputSchema.parse({
      ...validBase,
      lines: [{ ...validBase.lines[0], quantity: 1.234 }],
    })
    expect(result.lines[0]?.quantity).toBe(1.234)
  })

  it('rechaza cantidades con más de tres decimales', () => {
    expect(() =>
      purchaseInputSchema.parse({
        ...validBase,
        lines: [{ ...validBase.lines[0], quantity: 1.2345 }],
      }),
    ).toThrow()
  })

  it('rechaza cantidad cero', () => {
    expect(() =>
      purchaseInputSchema.parse({
        ...validBase,
        lines: [{ ...validBase.lines[0], quantity: 0 }],
      }),
    ).toThrow()
  })

  it('rechaza lista de líneas vacía', () => {
    expect(() =>
      purchaseInputSchema.parse({ ...validBase, lines: [] }),
    ).toThrow()
  })

  it('rechaza un producto repetido en las líneas', () => {
    expect(() =>
      purchaseInputSchema.parse({
        ...validBase,
        lines: [validBase.lines[0], { ...validBase.lines[0], quantity: 2 }],
      }),
    ).toThrow(/solo puede agregarse una vez/)
  })

  it('rechaza costo unitario negativo', () => {
    expect(() =>
      purchaseInputSchema.parse({
        ...validBase,
        lines: [{ ...validBase.lines[0], unitCost: -1 }],
      }),
    ).toThrow()
  })

  it('rechaza fecha inválida', () => {
    expect(() =>
      purchaseInputSchema.parse({ ...validBase, purchaseDate: 'no-es-fecha' }),
    ).toThrow()
  })

  it('rechaza claves desconocidas', () => {
    expect(() =>
      purchaseInputSchema.parse({ ...validBase, extra: true }),
    ).toThrow()
  })
})

describe('purchaseQuerySchema', () => {
  it('aplica valores por defecto', () => {
    const result = purchaseQuerySchema.parse({})
    expect(result.status).toBe('all')
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(20)
  })

  it('acepta filtros válidos', () => {
    const result = purchaseQuerySchema.parse({
      status: 'DRAFT',
      page: '2',
      pageSize: '50',
      from: '2026-01-01',
      to: '2026-12-31',
    })
    expect(result.status).toBe('DRAFT')
    expect(result.page).toBe(2)
  })
})

describe('confirmPurchaseSchema', () => {
  it('acepta requestId válido', () => {
    const result = confirmPurchaseSchema.parse({ requestId: 'req-abc-123' })
    expect(result.requestId).toBe('req-abc-123')
  })

  it('rechaza requestId vacío', () => {
    expect(() => confirmPurchaseSchema.parse({ requestId: '' })).toThrow()
  })

  it('rechaza claves adicionales', () => {
    expect(() =>
      confirmPurchaseSchema.parse({ requestId: 'req-1', extra: true }),
    ).toThrow()
  })
})
