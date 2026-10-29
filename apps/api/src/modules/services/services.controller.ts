import type { RequestHandler } from 'express'
import { getRequestContext } from '../auth/auth.middleware.js'
import {
  serviceIdSchema,
  serviceInputSchema,
  serviceQuerySchema,
  serviceStatusSchema,
  serviceUpdateSchema,
} from './services.schemas.js'
import { servicesService } from './services.service.js'

export const listServices: RequestHandler = async (request, response) => {
  response.json(
    await servicesService.list(serviceQuerySchema.parse(request.query)),
  )
}

export const getService: RequestHandler = async (request, response) => {
  const { id } = serviceIdSchema.parse(request.params)
  response.json(await servicesService.getById(id))
}

export const getServiceOptions: RequestHandler = async (_request, response) => {
  response.json(await servicesService.getOptions())
}

export const createService: RequestHandler = async (request, response) => {
  response
    .status(201)
    .json(
      await servicesService.create(
        serviceInputSchema.parse(request.body),
        request.auth!.id,
        getRequestContext(request, response),
      ),
    )
}

export const updateService: RequestHandler = async (request, response) => {
  const { id } = serviceIdSchema.parse(request.params)
  response.json(
    await servicesService.update(
      id,
      serviceUpdateSchema.parse(request.body),
      request.auth!.id,
      getRequestContext(request, response),
    ),
  )
}

export const updateServiceStatus: RequestHandler = async (
  request,
  response,
) => {
  const { id } = serviceIdSchema.parse(request.params)
  const { active } = serviceStatusSchema.parse(request.body)
  response.json(
    await servicesService.updateStatus(
      id,
      active,
      request.auth!.id,
      getRequestContext(request, response),
    ),
  )
}
