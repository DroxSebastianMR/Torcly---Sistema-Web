import type { RequestHandler } from 'express'
import { getRequestContext } from '../auth/auth.middleware.js'
import {
  notificationIdSchema,
  notificationQuerySchema,
} from './notifications.schemas.js'
import { notificationsService } from './notifications.service.js'

export const listNotifications: RequestHandler = async (request, response) => {
  const filters = notificationQuerySchema.parse(request.query)
  const result = await notificationsService.listNotifications(
    request.auth!,
    filters,
  )
  response.json(result)
}

export const getUnreadCount: RequestHandler = async (request, response) => {
  const result = await notificationsService.getUnreadCount(request.auth!)
  response.json(result)
}

export const markAsRead: RequestHandler = async (request, response) => {
  const { id } = notificationIdSchema.parse(request.params)
  const result = await notificationsService.markAsRead(
    id,
    request.auth!,
    getRequestContext(request, response),
  )
  response.json(result)
}

export const markAllAsRead: RequestHandler = async (request, response) => {
  const result = await notificationsService.markAllAsRead(
    request.auth!,
    getRequestContext(request, response),
  )
  response.json(result)
}
