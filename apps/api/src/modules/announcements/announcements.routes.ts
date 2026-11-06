import { Router } from 'express'
import { requireAuth, requirePlatformAdmin } from '../auth/auth.middleware.js'
import {
  createAnnouncement,
  deleteAnnouncement,
  generateVersionReleaseAnnouncement,
  getActiveVersion,
  getAnnouncementById,
  getUnreadCount,
  listAnnouncements,
  markAllAsRead,
  markAsRead,
  updateAnnouncement,
} from './announcements.controller.js'

export const announcementsRouter = Router()

announcementsRouter.use(requireAuth)

// Rutas accesibles por todos los usuarios autenticados
announcementsRouter.get('/', listAnnouncements)
announcementsRouter.get('/unread-count', getUnreadCount)
announcementsRouter.get('/active-version', getActiveVersion)
announcementsRouter.get('/:id', getAnnouncementById)
announcementsRouter.post('/:id/read', markAsRead)
announcementsRouter.post('/mark-all-read', markAllAsRead)

// Rutas administrativas (Superadmin de plataforma)
announcementsRouter.post(
  '/generate-version-release',
  requirePlatformAdmin,
  generateVersionReleaseAnnouncement,
)
announcementsRouter.post('/', requirePlatformAdmin, createAnnouncement)
announcementsRouter.patch('/:id', requirePlatformAdmin, updateAnnouncement)
announcementsRouter.delete('/:id', requirePlatformAdmin, deleteAnnouncement)
