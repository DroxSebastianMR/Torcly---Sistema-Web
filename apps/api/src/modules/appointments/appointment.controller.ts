import type { Request, RequestHandler } from 'express'
import { getRequestContext } from '../auth/auth.middleware.js'
import { requireOrganizationContext } from '../auth/organization-context.js'
import {
  appointmentIdSchema,
  appointmentInputSchema,
  appointmentQuerySchema,
  appointmentRescheduleSchema,
} from './appointment.schemas.js'
import { appointmentsService } from './appointment.service.js'

function actor(request: Request) {
  return { id: request.auth!.id, name: request.auth!.name }
}

export const listAppointments: RequestHandler = async (request, response) => {
  response.json(
    await appointmentsService.list(
      appointmentQuerySchema.parse(request.query),
      requireOrganizationContext(request.auth!).id,
    ),
  )
}

export const getAppointment: RequestHandler = async (request, response) => {
  const { id } = appointmentIdSchema.parse(request.params)
  response.json(
    await appointmentsService.getById(
      id,
      requireOrganizationContext(request.auth!).id,
    ),
  )
}

export const createAppointment: RequestHandler = async (request, response) => {
  response
    .status(201)
    .json(
      await appointmentsService.create(
        appointmentInputSchema.parse(request.body),
        actor(request),
        getRequestContext(request, response),
        requireOrganizationContext(request.auth!).id,
      ),
    )
}

export const rescheduleAppointment: RequestHandler = async (
  request,
  response,
) => {
  const { id } = appointmentIdSchema.parse(request.params)
  response.json(
    await appointmentsService.reschedule(
      id,
      appointmentRescheduleSchema.parse(request.body),
      actor(request),
      getRequestContext(request, response),
      requireOrganizationContext(request.auth!).id,
    ),
  )
}

export const cancelAppointment: RequestHandler = async (request, response) => {
  const { id } = appointmentIdSchema.parse(request.params)
  response.json(
    await appointmentsService.cancel(
      id,
      actor(request),
      getRequestContext(request, response),
      requireOrganizationContext(request.auth!).id,
    ),
  )
}
