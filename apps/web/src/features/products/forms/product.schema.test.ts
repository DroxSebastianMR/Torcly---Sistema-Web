import { describe, expect, it } from 'vitest'
import { productFormSchema } from './product.schema'

const validForm = {
  code: 'REP-001',
  barcode: '7751234567890',
  name: 'Filtro de aceite',
  description: '',
  categoryId: 'category-id',
  brandId: '',
  unitId: 'unit-id',
  salePrice: 29.9,
  minimumStock: 3,
}

describe('Formulario de productos', () => {
  it('acepta el producto con campos obligatorios completos', () => {
    expect(productFormSchema.safeParse(validForm).success).toBe(true)
  })

  it('rechaza precio negativo y código con espacios', () => {
    const result = productFormSchema.safeParse({
      ...validForm,
      code: 'REP 001',
      salePrice: -10,
    })
    expect(result.success).toBe(false)
  })

  it('permite código de barras vacío para digitación opcional', () => {
    expect(
      productFormSchema.safeParse({ ...validForm, barcode: '' }).success,
    ).toBe(true)
  })
})
