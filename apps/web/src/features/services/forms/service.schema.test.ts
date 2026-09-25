import { describe, expect, it } from 'vitest'
import { serviceFormSchema } from './service.schema'

describe('Esquema de servicios (web)', () => {
  it('acepta un servicio válido y convierte los valores', () => {
    const result = serviceFormSchema.safeParse({
      code: 'CAMBIO-BOMBA',
      name: 'Cambio de bomba de agua',
      description: 'Servicio completo',
      price: '250.5',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.price).toBe(250.5)
    }
  })

  it('rechaza un código con espacios en blanco o caracteres inválidos', () => {
    const blank = serviceFormSchema.safeParse({
      code: '  ',
      name: 'Servicio',
      description: '',
      price: 10,
    })
    expect(blank.success).toBe(false)

    const invalid = serviceFormSchema.safeParse({
      code: 'cambio con espacios',
      name: 'Servicio',
      description: '',
      price: 10,
    })
    expect(invalid.success).toBe(false)
  })

  it('rechaza un precio negativo', () => {
    const result = serviceFormSchema.safeParse({
      code: 'SVC-01',
      name: 'Servicio',
      description: '',
      price: -5,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'El precio no puede ser negativo.',
      )
    }
  })

  it('exige el nombre del servicio', () => {
    const result = serviceFormSchema.safeParse({
      code: 'SVC-01',
      name: '   ',
      description: '',
      price: 10,
    })
    expect(result.success).toBe(false)
  })

  it('limita la descripción a 500 caracteres', () => {
    const result = serviceFormSchema.safeParse({
      code: 'SVC-01',
      name: 'Servicio',
      description: 'a'.repeat(501),
      price: 10,
    })
    expect(result.success).toBe(false)
  })
})
