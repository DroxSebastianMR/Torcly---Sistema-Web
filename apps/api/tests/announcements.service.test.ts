import { beforeEach, describe, expect, it, vi } from 'vitest'
import { announcementsRepository } from '../src/modules/announcements/announcements.repository.js'
import {
  CURRENT_SAAS_VERSION,
  announcementsService,
} from '../src/modules/announcements/announcements.service.js'
import type { AuthUser } from '../src/modules/auth/auth.types.js'

vi.mock('../src/modules/announcements/announcements.repository.js')

const standardUser: AuthUser = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Juan Pérez',
  email: 'juan@taller.com',
  username: 'jperez',
  permissions: ['work_orders:read'],
  isPlatformAdmin: false,
}

const platformAdminUser: AuthUser = {
  id: '33333333-3333-4333-8333-333333333333',
  name: 'Admin Plataforma',
  email: 'admin@torcly.com',
  username: 'admin',
  permissions: ['*'],
  isPlatformAdmin: true,
}

const mockAnnouncement = {
  id: 'ann-1',
  title: 'Nueva versión v1.1.2',
  summary: 'Resumen de novedades',
  content: 'Contenido completo',
  type: 'UPDATE' as const,
  status: 'PUBLISHED' as const,
  versionTag: 'v1.1.2',
  videoUrl: 'https://youtube.com',
  startsAt: null,
  endsAt: null,
  publishedAt: new Date('2026-11-05T00:00:00Z'),
  createdBy: 'Admin Plataforma',
  createdAt: new Date('2026-11-05T00:00:00Z'),
  updatedAt: new Date('2026-11-05T00:00:00Z'),
  reads: [],
}

describe('announcementsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna la versión activa del SaaS', async () => {
    const versionInfo = await announcementsService.getActiveVersion()
    expect(versionInfo.version).toBe(CURRENT_SAAS_VERSION)
    expect(versionInfo.versionTag).toBe(`v${CURRENT_SAAS_VERSION}`)
  })

  it('lista anuncios mapeando isRead y paginación para usuario estándar', async () => {
    vi.mocked(announcementsRepository.listAnnouncements).mockResolvedValueOnce({
      records: [mockAnnouncement],
      total: 1,
    })

    const result = await announcementsService.listAnnouncements(standardUser, {
      page: 1,
      pageSize: 10,
    })

    expect(result.data).toHaveLength(1)
    expect(result.data[0].id).toBe('ann-1')
    expect(result.data[0].isRead).toBe(false)
    expect(result.pagination.total).toBe(1)
  })

  it('obtiene conteo de no leídos', async () => {
    vi.mocked(announcementsRepository.getUnreadCount).mockResolvedValueOnce(3)

    const result = await announcementsService.getUnreadCount(standardUser)
    expect(result.count).toBe(3)
  })

  it('impide a usuario no superadmin crear anuncios', async () => {
    await expect(
      announcementsService.createAnnouncement(standardUser, {
        title: 'Anuncio Prohibido',
        summary: 'Resumen',
        content: 'Contenido',
        type: 'COMMUNICATION',
      }),
    ).rejects.toThrow(
      'Solo los administradores de plataforma pueden crear anuncios.',
    )
  })

  it('permite a superadmin crear anuncio y difunde si notifyUsers es true', async () => {
    vi.mocked(announcementsRepository.createAnnouncement).mockResolvedValueOnce(
      mockAnnouncement,
    )
    vi.mocked(
      announcementsRepository.broadcastToActiveUsers,
    ).mockResolvedValueOnce(undefined)

    const result = await announcementsService.createAnnouncement(
      platformAdminUser,
      {
        title: 'Nueva versión v1.1.2',
        summary: 'Resumen',
        content: 'Contenido',
        type: 'UPDATE',
        notifyUsers: true,
      },
    )

    expect(result.title).toBe('Nueva versión v1.1.2')
    expect(announcementsRepository.broadcastToActiveUsers).toHaveBeenCalledWith(
      mockAnnouncement,
    )
  })
})
