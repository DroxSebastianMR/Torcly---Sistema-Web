import type { RequestHandler } from 'express'
import {
  announcementIdSchema,
  announcementQuerySchema,
  createAnnouncementSchema,
  updateAnnouncementSchema,
} from './announcements.schemas.js'
import { announcementsService } from './announcements.service.js'

export const listAnnouncements: RequestHandler = async (request, response) => {
  const filters = announcementQuerySchema.parse(request.query)
  const result = await announcementsService.listAnnouncements(
    request.auth!,
    filters,
  )
  response.json(result)
}

export const getUnreadCount: RequestHandler = async (request, response) => {
  const result = await announcementsService.getUnreadCount(request.auth!)
  response.json(result)
}

export const getActiveVersion: RequestHandler = async (_request, response) => {
  const result = await announcementsService.getActiveVersion()
  response.json(result)
}

export const getAnnouncementById: RequestHandler = async (
  request,
  response,
) => {
  const { id } = announcementIdSchema.parse(request.params)
  const result = await announcementsService.getAnnouncementById(
    id,
    request.auth!,
  )
  response.json(result)
}

export const markAsRead: RequestHandler = async (request, response) => {
  const { id } = announcementIdSchema.parse(request.params)
  const result = await announcementsService.markAsRead(id, request.auth!)
  response.json(result)
}

export const markAllAsRead: RequestHandler = async (request, response) => {
  const result = await announcementsService.markAllAsRead(request.auth!)
  response.json(result)
}

export const createAnnouncement: RequestHandler = async (request, response) => {
  const input = createAnnouncementSchema.parse(request.body)
  const result = await announcementsService.createAnnouncement(
    request.auth!,
    input,
  )
  response.status(201).json(result)
}

export const updateAnnouncement: RequestHandler = async (request, response) => {
  const { id } = announcementIdSchema.parse(request.params)
  const input = updateAnnouncementSchema.parse(request.body)
  const result = await announcementsService.updateAnnouncement(
    id,
    request.auth!,
    input,
  )
  response.json(result)
}

export const deleteAnnouncement: RequestHandler = async (request, response) => {
  const { id } = announcementIdSchema.parse(request.params)
  const result = await announcementsService.deleteAnnouncement(
    id,
    request.auth!,
  )
  response.json(result)
}

export const generateVersionReleaseAnnouncement: RequestHandler = async (
  request,
  response,
) => {
  const result = await announcementsService.generateVersionReleaseAnnouncement(
    request.auth!,
  )
  response.status(201).json(result)
}
