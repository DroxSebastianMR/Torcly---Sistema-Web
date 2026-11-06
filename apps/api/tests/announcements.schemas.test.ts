import { describe, expect, it } from 'vitest'
import {
  announcementIdSchema,
  announcementQuerySchema,
  createAnnouncementSchema,
  updateAnnouncementSchema,
} from '../src/modules/announcements/announcements.schemas.js'

describe('announcementIdSchema', () => {
  it('acepta uuid válido', () => {
    const result = announcementIdSchema.parse({
      id: 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d',
    })
    expect(result.id).toBe('a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d')
  })

  it('rechaza id que no es uuid', () => {
    expect(() => announcementIdSchema.parse({ id: 'invalido' })).toThrow()
  })
})

describe('announcementQuerySchema', () => {
  it('aplica valores predeterminados', () => {
    const result = announcementQuerySchema.parse({})
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(10)
    expect(result.type).toBeUndefined()
    expect(result.status).toBeUndefined()
  })

  it('valida tipos y estados válidos', () => {
    const result = announcementQuerySchema.parse({
      type: 'UPDATE',
      status: 'PUBLISHED',
      unreadOnly: 'true',
      page: '2',
      pageSize: '20',
    })
    expect(result.type).toBe('UPDATE')
    expect(result.status).toBe('PUBLISHED')
    expect(result.unreadOnly).toBe(true)
    expect(result.page).toBe(2)
    expect(result.pageSize).toBe(20)
  })

  it('rechaza tipo inexistente', () => {
    expect(() =>
      announcementQuerySchema.parse({
        type: 'INVALID_TYPE',
      }),
    ).toThrow()
  })
})

describe('createAnnouncementSchema', () => {
  it('valida creación válida con campos completos', () => {
    const result = createAnnouncementSchema.parse({
      title: 'Versión v1.1.2 Lanzada',
      summary: 'Resumen descriptivo de la versión.',
      content: 'Contenido extenso de novedades y correcciones del sistema.',
      type: 'UPDATE',
      versionTag: 'v1.1.2',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      notifyUsers: true,
    })
    expect(result.title).toBe('Versión v1.1.2 Lanzada')
    expect(result.type).toBe('UPDATE')
    expect(result.status).toBe('PUBLISHED')
    expect(result.notifyUsers).toBe(true)
    expect(result.versionTag).toBe('v1.1.2')
  })

  it('rechaza título demasiado corto', () => {
    expect(() =>
      createAnnouncementSchema.parse({
        title: 'ab',
        summary: 'Resumen suficientemente largo',
        content: 'Contenido descriptivo',
        type: 'COMMUNICATION',
      }),
    ).toThrow()
  })
})

describe('updateAnnouncementSchema', () => {
  it('permite actualización parcial', () => {
    const result = updateAnnouncementSchema.parse({
      title: 'Título actualizado',
      status: 'ARCHIVED',
    })
    expect(result.title).toBe('Título actualizado')
    expect(result.status).toBe('ARCHIVED')
  })
})
