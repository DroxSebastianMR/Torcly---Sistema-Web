import { describe, expect, it } from 'vitest'
import {
  announcementFormSchema,
  emptyAnnouncement,
  mapAnnouncementToFormValues,
  mapFormValuesToCreatePayload,
} from './announcement.schema'
import type { AnnouncementItem } from '../types/announcements.types'

describe('Validación de formulario de anuncios SaaS', () => {
  it('valida un anuncio válido correctamente', () => {
    const valid = {
      ...emptyAnnouncement,
      title: 'Torcly v1.1.3 — Módulo de Reportes',
      summary: 'Nueva versión con exportación a PDF y Excel para contabilidad.',
      content:
        'Detalle exhaustivo de todos los cambios incorporados en la versión.',
      type: 'UPDATE' as const,
      status: 'PUBLISHED' as const,
      versionTag: 'v1.1.3',
      videoUrl: 'https://youtube.com/watch?v=demo123',
    }

    const result = announcementFormSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rechaza títulos con menos de 3 caracteres', () => {
    const invalid = {
      ...emptyAnnouncement,
      title: 'ab',
      summary: 'Resumen descriptivo del cambio',
      content: 'Contenido completo del anuncio',
    }

    const result = announcementFormSchema.safeParse(invalid)
    expect(result.success).toBe(false)
    expect(
      result.error?.issues.find((i) => i.path[0] === 'title')?.message,
    ).toBe('El título debe tener al menos 3 caracteres.')
  })

  it('rechaza resúmenes con menos de 5 caracteres', () => {
    const invalid = {
      ...emptyAnnouncement,
      title: 'Versión 2.0',
      summary: 'hola',
      content: 'Contenido completo del anuncio',
    }

    const result = announcementFormSchema.safeParse(invalid)
    expect(result.success).toBe(false)
    expect(
      result.error?.issues.find((i) => i.path[0] === 'summary')?.message,
    ).toBe('El resumen debe tener al menos 5 caracteres.')
  })

  it('rechaza contenido completo con menos de 10 caracteres', () => {
    const invalid = {
      ...emptyAnnouncement,
      title: 'Versión 2.0',
      summary: 'Resumen descriptivo del cambio',
      content: 'corto',
    }

    const result = announcementFormSchema.safeParse(invalid)
    expect(result.success).toBe(false)
    expect(
      result.error?.issues.find((i) => i.path[0] === 'content')?.message,
    ).toBe('El contenido debe tener al menos 10 caracteres.')
  })

  it('rechaza URLs de video no válidas', () => {
    const invalid = {
      ...emptyAnnouncement,
      title: 'Versión 2.0',
      summary: 'Resumen descriptivo del cambio',
      content: 'Contenido completo del anuncio con más de diez caracteres.',
      videoUrl: 'no-es-una-url',
    }

    const result = announcementFormSchema.safeParse(invalid)
    expect(result.success).toBe(false)
    expect(
      result.error?.issues.find((i) => i.path[0] === 'videoUrl')?.message,
    ).toBe('Ingresa una URL válida de video (ej. YouTube o Loom).')
  })

  it('rechaza ventana de mantenimiento con fin anterior al inicio', () => {
    const invalid = {
      ...emptyAnnouncement,
      title: 'Mantenimiento Preventivo Servidores',
      summary: 'Ventana de mantenimiento programada de base de datos',
      content:
        'El servicio estará pausado durante la ventana de mantenimiento.',
      type: 'MAINTENANCE' as const,
      startsAt: '2026-11-10T10:00',
      endsAt: '2026-11-10T08:00',
    }

    const result = announcementFormSchema.safeParse(invalid)
    expect(result.success).toBe(false)
    expect(
      result.error?.issues.find((i) => i.path[0] === 'endsAt')?.message,
    ).toBe('La fecha de fin no puede ser anterior a la de inicio.')
  })

  it('mapea correctamente un AnnouncementItem a AnnouncementFormValues', () => {
    const item: AnnouncementItem = {
      id: 'ann-1',
      title: 'Actualización Torcly',
      summary: 'Resumen del anuncio',
      content: 'Contenido completo de la actualización',
      type: 'UPDATE',
      status: 'PUBLISHED',
      versionTag: 'v1.1.2',
      videoUrl: null,
      startsAt: null,
      endsAt: null,
      publishedAt: '2026-11-05T20:00:00.000Z',
      createdBy: 'admin',
      createdAt: '2026-11-05T20:00:00.000Z',
      updatedAt: '2026-11-05T20:00:00.000Z',
      isRead: false,
      readAt: null,
    }

    const values = mapAnnouncementToFormValues(item)
    expect(values.title).toBe(item.title)
    expect(values.videoUrl).toBe('')
    expect(values.notifyUsers).toBe(false)
  })

  it('mapea form values a payload de creación correctamente', () => {
    const values = {
      ...emptyAnnouncement,
      title: '  Nuevo release  ',
      summary: '  Resumen con espacios  ',
      content: '  Contenido de prueba con espacios  ',
      versionTag: '  v1.1.2  ',
      videoUrl: '',
      startsAt: '',
      endsAt: '',
    }

    const payload = mapFormValuesToCreatePayload(values)
    expect(payload.title).toBe('Nuevo release')
    expect(payload.summary).toBe('Resumen con espacios')
    expect(payload.content).toBe('Contenido de prueba con espacios')
    expect(payload.versionTag).toBe('v1.1.2')
    expect(payload.videoUrl).toBeNull()
    expect(payload.startsAt).toBeNull()
    expect(payload.endsAt).toBeNull()
  })

  it('omite la etiqueta de versión cuando el tipo es comunicado o mantenimiento', () => {
    const commValues = {
      ...emptyAnnouncement,
      title: 'Políticas de Respaldo',
      summary: 'Recomendaciones clave para talleres',
      content: 'Contenido completo para el comunicado general del sistema.',
      type: 'COMMUNICATION' as const,
      versionTag: 'v1.1.2',
    }

    const payload = mapFormValuesToCreatePayload(commValues)
    expect(payload.versionTag).toBeNull()

    const maintValues = {
      ...emptyAnnouncement,
      title: 'Mantenimiento de Servidores',
      summary: 'Ventana técnica de base de datos',
      content: 'Contenido completo para mantenimiento preventivo.',
      type: 'MAINTENANCE' as const,
      versionTag: 'v1.1.2',
    }

    const maintPayload = mapFormValuesToCreatePayload(maintValues)
    expect(maintPayload.versionTag).toBeNull()
  })
})
