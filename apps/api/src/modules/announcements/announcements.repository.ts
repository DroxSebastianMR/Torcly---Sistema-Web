import type { Prisma } from '../../generated/prisma/client.js'
import { databaseService } from '../../infrastructure/database/prisma.service.js'
import type {
  AnnouncementFilters,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
} from './announcements.types.js'

export const announcementsRepository = {
  async listAnnouncements(
    filters: AnnouncementFilters,
    userId: string,
    isPlatformAdmin: boolean,
  ) {
    const where: Prisma.AnnouncementWhereInput = {}

    if (!isPlatformAdmin) {
      where.status = 'PUBLISHED'
    } else if (filters.status) {
      where.status = filters.status
    }

    if (filters.type) {
      where.type = filters.type
    }

    if (filters.unreadOnly) {
      where.reads = {
        none: {
          userId,
        },
      }
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { summary: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const [records, total] = await Promise.all([
      databaseService.client.announcement.findMany({
        where,
        include: {
          reads: {
            where: { userId },
            select: { readAt: true },
          },
        },
        orderBy: { publishedAt: 'desc' },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      databaseService.client.announcement.count({ where }),
    ])

    return { records, total }
  },

  async getUnreadCount(userId: string): Promise<number> {
    return databaseService.client.announcement.count({
      where: {
        status: 'PUBLISHED',
        reads: {
          none: {
            userId,
          },
        },
      },
    })
  },

  async findById(id: string, userId: string, isPlatformAdmin: boolean) {
    const record = await databaseService.client.announcement.findUnique({
      where: { id },
      include: {
        reads: {
          where: { userId },
          select: { readAt: true },
        },
      },
    })

    if (!record) return null
    if (!isPlatformAdmin && record.status !== 'PUBLISHED') return null

    return record
  },

  async markAsRead(announcementId: string, userId: string) {
    return databaseService.client.announcementRead.upsert({
      where: {
        announcementId_userId: {
          announcementId,
          userId,
        },
      },
      update: {},
      create: {
        announcementId,
        userId,
      },
    })
  },

  async markAllAsRead(userId: string) {
    const unread = await databaseService.client.announcement.findMany({
      where: {
        status: 'PUBLISHED',
        reads: {
          none: {
            userId,
          },
        },
      },
      select: { id: true },
    })

    if (!unread.length) return { updatedCount: 0 }

    await databaseService.client.announcementRead.createMany({
      data: unread.map((a: { id: string }) => ({
        announcementId: a.id,
        userId,
      })),
      skipDuplicates: true,
    })

    return { updatedCount: unread.length }
  },

  async createAnnouncement(data: CreateAnnouncementInput, createdBy: string) {
    return databaseService.client.announcement.create({
      data: {
        title: data.title,
        summary: data.summary,
        content: data.content,
        type: data.type,
        status: data.status ?? 'PUBLISHED',
        versionTag: data.versionTag ?? null,
        videoUrl: data.videoUrl ?? null,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        createdBy,
      },
    })
  },

  async updateAnnouncement(id: string, data: UpdateAnnouncementInput) {
    return databaseService.client.announcement.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.summary !== undefined ? { summary: data.summary } : {}),
        ...(data.content !== undefined ? { content: data.content } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.versionTag !== undefined
          ? { versionTag: data.versionTag }
          : {}),
        ...(data.videoUrl !== undefined ? { videoUrl: data.videoUrl } : {}),
        ...(data.startsAt !== undefined
          ? { startsAt: data.startsAt ? new Date(data.startsAt) : null }
          : {}),
        ...(data.endsAt !== undefined
          ? { endsAt: data.endsAt ? new Date(data.endsAt) : null }
          : {}),
      },
    })
  },

  async deleteAnnouncement(id: string) {
    return databaseService.client.announcement.delete({
      where: { id },
    })
  },

  async broadcastToActiveUsers(announcement: {
    id: string
    title: string
    summary: string
    type: string
  }) {
    try {
      const activeUsers = await databaseService.client.user.findMany({
        where: {
          active: true,
          organizationMemberships: {
            some: {
              active: true,
            },
          },
        },
        select: {
          id: true,
          organizationMemberships: {
            where: { active: true },
            select: { organizationId: true },
            take: 1,
          },
        },
      })

      const notifications = activeUsers
        .filter(
          (u: { organizationMemberships: Array<{ organizationId: string }> }) =>
            u.organizationMemberships.length > 0,
        )
        .map(
          (u: {
            id: string
            organizationMemberships: Array<{ organizationId: string }>
          }) => ({
            organizationId: u.organizationMemberships[0].organizationId,
            userId: u.id,
            title:
              announcement.type === 'UPDATE'
                ? `Nueva versión disponible: ${announcement.title}`
                : announcement.type === 'MAINTENANCE'
                  ? `Aviso de mantenimiento: ${announcement.title}`
                  : `Comunicado Torcly: ${announcement.title}`,
            message: announcement.summary,
            type:
              announcement.type === 'MAINTENANCE'
                ? 'SYSTEM_MAINTENANCE'
                : 'SYSTEM_UPDATE',
            link: '/novedades',
            permissionRequired: null,
            read: false,
          }),
        )

      if (notifications.length > 0) {
        await databaseService.client.notification.createMany({
          data: notifications,
        })
      }
    } catch (err) {
      console.warn('[announcements] broadcastToActiveUsers failed safe', err)
    }
  },
}
