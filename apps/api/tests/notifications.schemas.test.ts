import { describe, expect, it } from 'vitest'
import {
  notificationIdSchema,
  notificationQuerySchema,
} from '../src/modules/notifications/notifications.schemas.js'

describe('notificationIdSchema', () => {
  it('acepta uuid válido', () => {
    const result = notificationIdSchema.parse({
      id: 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d',
    })
    expect(result.id).toBe('a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d')
  })

  it('rechaza uuid inválido', () => {
    expect(() => notificationIdSchema.parse({ id: 'invalido' })).toThrow()
  })
})

describe('notificationQuerySchema', () => {
  it('aplica valores por defecto', () => {
    const result = notificationQuerySchema.parse({})
    expect(result.read).toBe('all')
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(20)
    expect(result.type).toBeUndefined()
  })

  it('acepta parámetros personalizados', () => {
    const result = notificationQuerySchema.parse({
      read: 'false',
      type: 'STOCK_LOW',
      page: '3',
      pageSize: '50',
    })
    expect(result.read).toBe('false')
    expect(result.type).toBe('STOCK_LOW')
    expect(result.page).toBe(3)
    expect(result.pageSize).toBe(50)
  })

  it('rechaza filtro de lectura inválido', () => {
    expect(() =>
      notificationQuerySchema.parse({
        read: 'invalid',
      }),
    ).toThrow()
  })
})
