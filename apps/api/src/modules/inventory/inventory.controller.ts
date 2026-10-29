import type { Request, RequestHandler } from 'express'
import { getRequestContext } from '../auth/auth.middleware.js'
import {
  adjustmentSchema,
  entrySchema,
  existenceQuerySchema,
  exitSchema,
  initialStockSchema,
  movementQuerySchema,
} from './inventory.schemas.js'
import { inventoryService } from './inventory.service.js'

function actor(request: Request) {
  return { id: request.auth!.id, name: request.auth!.name }
}

export const listExistence: RequestHandler = async (request, response) => {
  response.json(
    await inventoryService.listExistence(
      existenceQuerySchema.parse(request.query),
    ),
  )
}

export const listMovements: RequestHandler = async (request, response) => {
  response.json(
    await inventoryService.listMovements(
      movementQuerySchema.parse(request.query),
    ),
  )
}

export const registerInitialStock: RequestHandler = async (
  request,
  response,
) => {
  response
    .status(201)
    .json(
      await inventoryService.registerInitial(
        initialStockSchema.parse(request.body),
        actor(request),
        getRequestContext(request, response),
      ),
    )
}

export const registerEntry: RequestHandler = async (request, response) => {
  response
    .status(201)
    .json(
      await inventoryService.registerEntry(
        entrySchema.parse(request.body),
        actor(request),
        getRequestContext(request, response),
      ),
    )
}

export const registerExit: RequestHandler = async (request, response) => {
  response
    .status(201)
    .json(
      await inventoryService.registerExit(
        exitSchema.parse(request.body),
        actor(request),
        getRequestContext(request, response),
      ),
    )
}

export const registerAdjustment: RequestHandler = async (request, response) => {
  response
    .status(201)
    .json(
      await inventoryService.registerAdjustment(
        adjustmentSchema.parse(request.body),
        actor(request),
        getRequestContext(request, response),
      ),
    )
}
