import { Router } from 'express'
import { requireAuth, requirePermission } from '../auth/auth.middleware.js'
import {
  createWorkOrder,
  decideWorkOrder,
  getWorkOrder,
  getWorkOrderCatalog,
  getWorkOrderTechnicians,
  listWorkOrders,
  saveWorkOrderBudget,
  sendWorkOrderBudget,
  updateWorkOrderDiagnosis,
  updateWorkOrderTechnician,
} from './work-order.controller.js'

export const workOrdersRouter = Router()

workOrdersRouter.use(requireAuth)
workOrdersRouter.get('/', requirePermission('workshop:read'), listWorkOrders)
workOrdersRouter.get(
  '/catalog',
  requirePermission('workshop:read'),
  getWorkOrderCatalog,
)
workOrdersRouter.get(
  '/technicians',
  requirePermission('workshop:read'),
  getWorkOrderTechnicians,
)
workOrdersRouter.get('/:id', requirePermission('workshop:read'), getWorkOrder)
workOrdersRouter.post('/', requirePermission('workshop:write'), createWorkOrder)
workOrdersRouter.put(
  '/:id/diagnosis',
  requirePermission('workshop:write'),
  updateWorkOrderDiagnosis,
)
workOrdersRouter.put(
  '/:id/budget',
  requirePermission('workshop:write'),
  saveWorkOrderBudget,
)
workOrdersRouter.post(
  '/:id/budget/send',
  requirePermission('workshop:write'),
  sendWorkOrderBudget,
)
workOrdersRouter.post(
  '/:id/decision',
  requirePermission('workshop:write'),
  decideWorkOrder,
)
workOrdersRouter.put(
  '/:id/technician',
  requirePermission('workshop:write'),
  updateWorkOrderTechnician,
)
