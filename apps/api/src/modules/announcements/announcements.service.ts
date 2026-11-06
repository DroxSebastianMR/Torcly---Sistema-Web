import { AppError } from '../../shared/errors/app-error.js'
import type { AuthUser } from '../auth/auth.types.js'
import { announcementsRepository } from './announcements.repository.js'
import type {
  AnnouncementFilters,
  AnnouncementItem,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
} from './announcements.types.js'

function toAnnouncementItem(record: {
  id: string
  title: string
  summary: string
  content: string
  type: AnnouncementItem['type']
  status: AnnouncementItem['status']
  versionTag: string | null
  videoUrl: string | null
  startsAt: Date | null
  endsAt: Date | null
  publishedAt: Date
  createdBy: string
  createdAt: Date
  updatedAt: Date
  reads?: Array<{ readAt: Date }>
}): AnnouncementItem {
  const firstRead = record.reads?.[0]
  const readAt = firstRead?.readAt ? firstRead.readAt.toISOString() : null
  const isRead = Boolean(firstRead)

  return {
    id: record.id,
    title: record.title,
    summary: record.summary,
    content: record.content,
    type: record.type,
    status: record.status,
    versionTag: record.versionTag,
    videoUrl: record.videoUrl,
    startsAt: record.startsAt ? record.startsAt.toISOString() : null,
    endsAt: record.endsAt ? record.endsAt.toISOString() : null,
    publishedAt: record.publishedAt.toISOString(),
    createdBy: record.createdBy,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    isRead,
    readAt,
  }
}

function paginate(total: number, page: number, pageSize: number) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

export const CURRENT_SAAS_VERSION = '2.1.2'

export const announcementsService = {
  async listAnnouncements(authUser: AuthUser, filters: AnnouncementFilters) {
    const isPlatformAdmin = Boolean(authUser.isPlatformAdmin)
    const result = await announcementsRepository.listAnnouncements(
      filters,
      authUser.id,
      isPlatformAdmin,
    )

    return {
      data: result.records.map(toAnnouncementItem),
      pagination: paginate(result.total, filters.page, filters.pageSize),
    }
  },

  async getUnreadCount(authUser: AuthUser) {
    const count = await announcementsRepository.getUnreadCount(authUser.id)
    return { count }
  },

  async getAnnouncementById(id: string, authUser: AuthUser) {
    const isPlatformAdmin = Boolean(authUser.isPlatformAdmin)
    const record = await announcementsRepository.findById(
      id,
      authUser.id,
      isPlatformAdmin,
    )

    if (!record) {
      throw new AppError(
        404,
        'ANNOUNCEMENT_NOT_FOUND',
        'Anuncio o novedad no encontrado.',
      )
    }

    return toAnnouncementItem(record)
  },

  async markAsRead(id: string, authUser: AuthUser) {
    const isPlatformAdmin = Boolean(authUser.isPlatformAdmin)
    const existing = await announcementsRepository.findById(
      id,
      authUser.id,
      isPlatformAdmin,
    )

    if (!existing) {
      throw new AppError(
        404,
        'ANNOUNCEMENT_NOT_FOUND',
        'Anuncio o novedad no encontrado.',
      )
    }

    await announcementsRepository.markAsRead(id, authUser.id)
    const updated = await announcementsRepository.findById(
      id,
      authUser.id,
      isPlatformAdmin,
    )
    if (!updated) {
      throw new AppError(
        404,
        'ANNOUNCEMENT_NOT_FOUND',
        'Anuncio o novedad no encontrado.',
      )
    }
    return toAnnouncementItem(updated)
  },

  async markAllAsRead(authUser: AuthUser) {
    return announcementsRepository.markAllAsRead(authUser.id)
  },

  async getActiveVersion() {
    return {
      version: CURRENT_SAAS_VERSION,
      versionTag: `v${CURRENT_SAAS_VERSION}`,
      releasedAt: '2026-11-05T00:00:00.000Z',
      productName: 'Torcly SaaS Platform',
    }
  },

  async createAnnouncement(authUser: AuthUser, input: CreateAnnouncementInput) {
    if (!authUser.isPlatformAdmin) {
      throw new AppError(
        403,
        'FORBIDDEN',
        'Solo los administradores de plataforma pueden crear anuncios.',
      )
    }

    const created = await announcementsRepository.createAnnouncement(
      input,
      authUser.name || authUser.username,
    )

    if (input.notifyUsers && (input.status === 'PUBLISHED' || !input.status)) {
      await announcementsRepository.broadcastToActiveUsers(created)
    }

    return toAnnouncementItem(created)
  },

  async updateAnnouncement(
    id: string,
    authUser: AuthUser,
    input: UpdateAnnouncementInput,
  ) {
    if (!authUser.isPlatformAdmin) {
      throw new AppError(
        403,
        'FORBIDDEN',
        'Solo los administradores de plataforma pueden editar anuncios.',
      )
    }

    const existing = await announcementsRepository.findById(
      id,
      authUser.id,
      true,
    )
    if (!existing) {
      throw new AppError(
        404,
        'ANNOUNCEMENT_NOT_FOUND',
        'Anuncio o novedad no encontrado.',
      )
    }

    const updated = await announcementsRepository.updateAnnouncement(id, input)

    if (input.notifyUsers && updated.status === 'PUBLISHED') {
      await announcementsRepository.broadcastToActiveUsers(updated)
    }

    return toAnnouncementItem(updated)
  },

  async deleteAnnouncement(id: string, authUser: AuthUser) {
    if (!authUser.isPlatformAdmin) {
      throw new AppError(
        403,
        'FORBIDDEN',
        'Solo los administradores de plataforma pueden eliminar anuncios.',
      )
    }

    const existing = await announcementsRepository.findById(
      id,
      authUser.id,
      true,
    )
    if (!existing) {
      throw new AppError(
        404,
        'ANNOUNCEMENT_NOT_FOUND',
        'Anuncio o novedad no encontrado.',
      )
    }

    await announcementsRepository.deleteAnnouncement(id)
    return { success: true, id }
  },

  async generateVersionReleaseAnnouncement(authUser: AuthUser) {
    if (!authUser.isPlatformAdmin) {
      throw new AppError(
        403,
        'FORBIDDEN',
        'Solo los administradores de plataforma pueden generar anuncios de versión.',
      )
    }

    const defaultReleaseInput: CreateAnnouncementInput = {
      title: `Torcly v${CURRENT_SAAS_VERSION} — Centro de Notificaciones y Experiencia SaaS`,
      summary: `Nueva versión con centro de notificaciones unificado, filtrado rápido por categorías y avisos en tiempo real para todos los talleres.`,
      content:
        `### Resumen de la Versión v${CURRENT_SAAS_VERSION}\n\n` +
        `Nos complace anunciar el despliegue oficial de **Torcly v${CURRENT_SAAS_VERSION}** con importantes mejoras en la productividad de los talleres y la comunicación de plataforma:\n\n` +
        `1. **Centro de Notificaciones Unificado:** Nueva campana interactiva con categorías operativas (Órdenes de trabajo, Inventario, Clientes y Facturación).\n` +
        `2. **Bandeja Completa y Filtros Rápidos:** Visualización por rangos de tiempo (Hoy, 7 días, 30 días, 90 días) con colores visuales suaves identificativos.\n` +
        `3. **Módulo de Novedades y Anuncios SaaS:** Espacio centralizado para consultar releases, cambios en el sistema y ventanas de mantenimiento programadas.\n` +
        `4. **Mejoras de Rendimiento:** Optimización de consultas en base de datos y reducción de latencia en carga de vistas operativas.\n\n` +
        `Si tienes dudas o consultas sobre el uso de las nuevas herramientas, revisa nuestro video tutorial explicativo o contacta al equipo de soporte de Torcly.`,
      type: 'UPDATE',
      status: 'PUBLISHED',
      versionTag: `v${CURRENT_SAAS_VERSION}`,
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      notifyUsers: true,
    }

    const created = await announcementsRepository.createAnnouncement(
      defaultReleaseInput,
      authUser.name || authUser.username,
    )

    await announcementsRepository.broadcastToActiveUsers(created)
    return toAnnouncementItem(created)
  },
}
