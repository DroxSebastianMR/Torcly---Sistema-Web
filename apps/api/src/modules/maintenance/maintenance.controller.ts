import type { RequestHandler } from 'express'
import { getRequestContext } from '../auth/auth.middleware.js'
import {
  maintenanceIdParamSchema,
  maintenanceScheduleSchema,
} from './maintenance.schemas.js'
import { maintenanceService } from './maintenance.service.js'

export const getMaintenanceStatus: RequestHandler = async (
  _request,
  response,
) => {
  response.setHeader('Cache-Control', 'no-store')
  response.json(await maintenanceService.getStatus())
}

export const listMaintenanceWindows: RequestHandler = async (
  _request,
  response,
) => {
  response.json(await maintenanceService.list())
}

export const scheduleMaintenance: RequestHandler = async (
  request,
  response,
) => {
  const input = maintenanceScheduleSchema.parse(request.body)
  response
    .status(201)
    .json(
      await maintenanceService.schedule(
        input,
        { id: request.auth!.id, name: request.auth!.name },
        getRequestContext(request, response),
      ),
    )
}

export const cancelMaintenance: RequestHandler = async (request, response) => {
  const { id } = maintenanceIdParamSchema.parse(request.params)
  await maintenanceService.cancel(
    id,
    { id: request.auth!.id, name: request.auth!.name },
    getRequestContext(request, response),
  )
  response.status(204).send()
}
