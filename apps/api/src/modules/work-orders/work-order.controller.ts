import type { Request, RequestHandler } from 'express'
import { getRequestContext } from '../auth/auth.middleware.js'
import {
  createWorkOrderSchema,
  workOrderBudgetSchema,
  workOrderDecisionSchema,
  workOrderDiagnosisSchema,
  workOrderIdSchema,
  workOrderQuerySchema,
  workOrderTechnicianSchema,
} from './work-order.schemas.js'
import { workOrdersService } from './work-order.service.js'

function actor(request: Request) {
  return { id: request.auth!.id, name: request.auth!.name }
}

export const listWorkOrders: RequestHandler = async (request, response) => {
  response.json(
    await workOrdersService.list(workOrderQuerySchema.parse(request.query)),
  )
}

export const getWorkOrder: RequestHandler = async (request, response) => {
  const { id } = workOrderIdSchema.parse(request.params)
  response.json(await workOrdersService.getById(id))
}

export const getWorkOrderCatalog: RequestHandler = async (
  _request,
  response,
) => {
  response.json(await workOrdersService.getCatalog())
}

export const getWorkOrderTechnicians: RequestHandler = async (
  _request,
  response,
) => {
  response.json(await workOrdersService.getTechnicians())
}

export const createWorkOrder: RequestHandler = async (request, response) => {
  const { appointmentId } = createWorkOrderSchema.parse(request.body)
  response
    .status(201)
    .json(
      await workOrdersService.createFromAppointment(
        appointmentId,
        actor(request),
        getRequestContext(request, response),
      ),
    )
}

export const updateWorkOrderDiagnosis: RequestHandler = async (
  request,
  response,
) => {
  const { id } = workOrderIdSchema.parse(request.params)
  const { diagnosis } = workOrderDiagnosisSchema.parse(request.body)
  response.json(
    await workOrdersService.updateDiagnosis(
      id,
      diagnosis,
      actor(request),
      getRequestContext(request, response),
    ),
  )
}

export const saveWorkOrderBudget: RequestHandler = async (
  request,
  response,
) => {
  const { id } = workOrderIdSchema.parse(request.params)
  response.json(
    await workOrdersService.saveBudget(
      id,
      workOrderBudgetSchema.parse(request.body),
      actor(request),
      getRequestContext(request, response),
    ),
  )
}

export const sendWorkOrderBudget: RequestHandler = async (
  request,
  response,
) => {
  const { id } = workOrderIdSchema.parse(request.params)
  response.json(
    await workOrdersService.sendBudget(
      id,
      actor(request),
      getRequestContext(request, response),
    ),
  )
}

export const decideWorkOrder: RequestHandler = async (request, response) => {
  const { id } = workOrderIdSchema.parse(request.params)
  response.json(
    await workOrdersService.decide(
      id,
      workOrderDecisionSchema.parse(request.body),
      actor(request),
      getRequestContext(request, response),
    ),
  )
}

export const updateWorkOrderTechnician: RequestHandler = async (
  request,
  response,
) => {
  const { id } = workOrderIdSchema.parse(request.params)
  response.json(
    await workOrdersService.updateTechnician(
      id,
      workOrderTechnicianSchema.parse(request.body),
      actor(request),
      getRequestContext(request, response),
    ),
  )
}
