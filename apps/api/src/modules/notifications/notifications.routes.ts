import { Router } from 'express'
import { requireAuth, requirePermission } from '../auth/auth.middleware.js'
import {
  getUnreadCount,
  listNotifications,
  markAllAsRead,
  markAsRead,
} from './notifications.controller.js'

export const notificationsRouter = Router()

notificationsRouter.use(requireAuth)
notificationsRouter.use(requirePermission('notifications:read'))

notificationsRouter.get('/', listNotifications)
notificationsRouter.get('/unread-count', getUnreadCount)
notificationsRouter.patch('/:id/read', markAsRead)
notificationsRouter.post('/mark-all-read', markAllAsRead)
