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

  it('exige un stock mínimo mayor que cero', () => {
    expect(
      productFormSchema.safeParse({ ...validForm, minimumStock: 0 }).success,
    ).toBe(false)
  })

  it('permite código de barras vacío para digitación opcional', () => {
    expect(
      productFormSchema.safeParse({ ...validForm, barcode: '' }).success,
    ).toBe(true)
  })

  it('rechaza códigos demasiado cortos o con caracteres inválidos', () => {
    expect(
      productFormSchema.safeParse({ ...validForm, code: 'A' }).success,
    ).toBe(false)
    expect(
      productFormSchema.safeParse({ ...validForm, code: 'REP_001*' }).success,
    ).toBe(false)
  })

  it('rechaza un código de barras mal formado', () => {
    expect(
      productFormSchema.safeParse({ ...validForm, barcode: '12' }).success,
    ).toBe(false)
  })

  it('exige categoría y unidad para el registro', () => {
    expect(
      productFormSchema.safeParse({ ...validForm, categoryId: '' }).success,
    ).toBe(false)
    expect(
      productFormSchema.safeParse({ ...validForm, unitId: '' }).success,
    ).toBe(false)
  })
})
