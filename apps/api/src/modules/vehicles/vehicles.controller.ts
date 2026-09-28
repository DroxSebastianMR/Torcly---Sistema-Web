import type { RequestHandler } from 'express'
import { getRequestContext } from '../auth/auth.middleware.js'
import {
  vehicleIdSchema,
  vehicleInputSchema,
  vehicleQuerySchema,
  vehicleUpdateSchema,
} from './vehicles.schemas.js'
import { vehiclesService } from './vehicles.service.js'

export const listVehicles: RequestHandler = async (request, response) => {
  response.json(
    await vehiclesService.list(vehicleQuerySchema.parse(request.query)),
  )
}

export const getVehicle: RequestHandler = async (request, response) => {
  const { id } = vehicleIdSchema.parse(request.params)
  response.json(await vehiclesService.getById(id))
}

export const createVehicle: RequestHandler = async (request, response) => {
  const result = await vehiclesService.create(
    vehicleInputSchema.parse(request.body),
    request.auth!.id,
    getRequestContext(request, response),
  )
  response.status(201).json(result)
}

export const updateVehicle: RequestHandler = async (request, response) => {
  const { id } = vehicleIdSchema.parse(request.params)
  response.json(
    await vehiclesService.update(
      id,
      vehicleUpdateSchema.parse(request.body),
      request.auth!.id,
      getRequestContext(request, response),
    ),
  )
}
