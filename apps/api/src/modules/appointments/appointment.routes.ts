import { Router } from 'express'
import { requireAuth, requirePermission } from '../auth/auth.middleware.js'
import {
  cancelAppointment,
  createAppointment,
  getAppointment,
  listAppointments,
  rescheduleAppointment,
} from './appointment.controller.js'

export const appointmentsRouter = Router()

appointmentsRouter.use(requireAuth)
appointmentsRouter.get(
  '/',
  requirePermission('appointments:read'),
  listAppointments,
)
appointmentsRouter.get(
  '/:id',
  requirePermission('appointments:read'),
  getAppointment,
)
appointmentsRouter.post(
  '/',
  requirePermission('appointments:write'),
  createAppointment,
)
appointmentsRouter.put(
  '/:id/reschedule',
  requirePermission('appointments:write'),
  rescheduleAppointment,
)
appointmentsRouter.post(
  '/:id/cancel',
  requirePermission('appointments:write'),
  cancelAppointment,
)
