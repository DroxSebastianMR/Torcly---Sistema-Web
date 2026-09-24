import { describe, expect, it } from 'vitest'
import {
  productInputSchema,
  productQuerySchema,
} from '../src/modules/products/products.schemas.js'

const validProduct = {
  code: 'rep-001',
  barcode: '7751234567890',
  name: 'Filtro de aceite',
  description: 'Repuesto para mantenimiento preventivo',
  categoryId: '3da6aac9-6b4f-4698-95e4-7ca4520c4563',
  brandId: null,
  unitId: 'b59bf1f8-0991-4622-bcf0-57c72fe6f7eb',
  salePrice: 35.5,
  minimumStock: 4,
}

describe('Validación de productos', () => {
  it('normaliza el código y acepta datos válidos', () => {
    const parsed = productInputSchema.parse(validProduct)
    expect(parsed.code).toBe('REP-001')
    expect(parsed.salePrice).toBe(35.5)
  })

  it('rechaza precios y stock mínimo negativos', () => {
    const result = productInputSchema.safeParse({
      ...validProduct,
      salePrice: -1,
      minimumStock: -2,
    })
    expect(result.success).toBe(false)
  })

  it('limita la paginación y valida la categoría', () => {
    expect(
      productQuerySchema.safeParse({ page: 0, pageSize: 500 }).success,
    ).toBe(false)
    expect(
      productQuerySchema.safeParse({ categoryId: 'invalid' }).success,
    ).toBe(false)
  })
})
