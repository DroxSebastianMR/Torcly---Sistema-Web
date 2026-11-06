import type { Request, RequestHandler } from 'express'
import { getRequestContext } from '../auth/auth.middleware.js'
import { requireOrganizationContext } from '../auth/organization-context.js'
import {
  createDirectWorkOrderSchema,
  createWorkOrderSchema,
  workOrderActivityIdSchema,
  workOrderActivitySchema,
  workOrderBudgetSchema,
  workOrderCompleteActivitySchema,
  workOrderConsumptionSchema,
  workOrderDecisionSchema,
  workOrderDeliverySchema,
  workOrderFinalizeSchema,
  workOrderDiagnosisSchema,
  workOrderIdSchema,
  workOrderQuerySchema,
  workOrderReturnSchema,
  workOrderStartExecutionSchema,
  workOrderTechnicianSchema,
  workOrderVehicleHistoryQuerySchema,
  workOrderVehicleIdSchema,
} from './work-order.schemas.js'
import { workOrdersService } from './work-order.service.js'

function actor(request: Request) {
  return { id: request.auth!.id, name: request.auth!.name }
}

function organizationId(request: Request) {
  return requireOrganizationContext(request.auth!).id
}

export const listWorkOrders: RequestHandler = async (request, response) => {
  response.json(
    await workOrdersService.list(
      workOrderQuerySchema.parse(request.query),
      organizationId(request),
    ),
  )
}

export const getWorkOrder: RequestHandler = async (request, response) => {
  const { id } = workOrderIdSchema.parse(request.params)
  response.json(await workOrdersService.getById(id, organizationId(request)))
}

export const getWorkOrderCatalog: RequestHandler = async (
  request,
  response,
) => {
  response.json(await workOrdersService.getCatalog(organizationId(request)))
}

export const getWorkOrderTechnicians: RequestHandler = async (
  request,
  response,
) => {
  response.json(await workOrdersService.getTechnicians(organizationId(request)))
}

export const createWorkOrder: RequestHandler = async (request, response) => {
  const { appointmentId, currentMileage, fuelLevel, receptionNotes } =
    createWorkOrderSchema.parse(request.body)
  response
    .status(201)
    .json(
      await workOrdersService.createFromAppointment(
        appointmentId,
        actor(request),
        getRequestContext(request, response),
        organizationId(request),
        { currentMileage, fuelLevel, receptionNotes },
      ),
    )
}

export const createDirectWorkOrder: RequestHandler = async (
  request,
  response,
) => {
  const input = createDirectWorkOrderSchema.parse(request.body)
  response
    .status(201)
    .json(
      await workOrdersService.createDirect(
        input,
        actor(request),
        getRequestContext(request, response),
        organizationId(request),
      ),
    )
}

export const getYardCapacity: RequestHandler = async (request, response) => {
  response.json(
    await workOrdersService.getYardCapacity(organizationId(request)),
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
      organizationId(request),
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
      organizationId(request),
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
      organizationId(request),
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
      organizationId(request),
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
      organizationId(request),
    ),
  )
}

export const startWorkOrderExecution: RequestHandler = async (
  request,
  response,
) => {
  const { id } = workOrderIdSchema.parse(request.params)
  workOrderStartExecutionSchema.parse(request.body)
  response.json(
    await workOrdersService.startExecution(
      id,
      actor(request),
      getRequestContext(request, response),
      organizationId(request),
    ),
  )
}

export const getWorkOrderExecution: RequestHandler = async (
  request,
  response,
) => {
  const { id } = workOrderIdSchema.parse(request.params)
  response.json(
    await workOrdersService.getExecution(id, organizationId(request)),
  )
}

export const createWorkOrderActivity: RequestHandler = async (
  request,
  response,
) => {
  const { id } = workOrderIdSchema.parse(request.params)
  response.json(
    await workOrdersService.createActivity(
      id,
      workOrderActivitySchema.parse(request.body),
      actor(request),
      getRequestContext(request, response),
      organizationId(request),
    ),
  )
}

export const completeWorkOrderActivity: RequestHandler = async (
  request,
  response,
) => {
  const { id, activityId } = workOrderActivityIdSchema.parse(request.params)
  workOrderCompleteActivitySchema.parse(request.body)
  response.json(
    await workOrdersService.completeActivity(
      id,
      activityId,
      actor(request),
      getRequestContext(request, response),
      organizationId(request),
    ),
  )
}

export const consumeWorkOrderProduct: RequestHandler = async (
  request,
  response,
) => {
  const { id } = workOrderIdSchema.parse(request.params)
  response.json(
    await workOrdersService.consume(
      id,
      workOrderConsumptionSchema.parse(request.body),
      actor(request),
      getRequestContext(request, response),
      organizationId(request),
    ),
  )
}

export const returnWorkOrderProduct: RequestHandler = async (
  request,
  response,
) => {
  const { id } = workOrderIdSchema.parse(request.params)
  response.json(
    await workOrdersService.returnProducts(
      id,
      workOrderReturnSchema.parse(request.body),
      actor(request),
      getRequestContext(request, response),
      organizationId(request),
    ),
  )
}

export const finalizeWorkOrder: RequestHandler = async (request, response) => {
  const { id } = workOrderIdSchema.parse(request.params)
  response.json(
    await workOrdersService.finalize(
      id,
      workOrderFinalizeSchema.parse(request.body),
      actor(request),
      getRequestContext(request, response),
      organizationId(request),
    ),
  )
}

export const deliverWorkOrder: RequestHandler = async (request, response) => {
  const { id } = workOrderIdSchema.parse(request.params)
  response.json(
    await workOrdersService.deliver(
      id,
      workOrderDeliverySchema.parse(request.body),
      actor(request),
      getRequestContext(request, response),
      organizationId(request),
    ),
  )
}

export const getWorkOrderVehicleHistory: RequestHandler = async (
  request,
  response,
) => {
  const { vehicleId } = workOrderVehicleIdSchema.parse(request.params)
  response.json(
    await workOrdersService.getVehicleHistory(
      vehicleId,
      workOrderVehicleHistoryQuerySchema.parse(request.query),
      organizationId(request),
    ),
  )
}
