import { Router } from 'express'
import { requireAuth, requirePermission } from '../auth/auth.middleware.js'
import {
  listExistence,
  listMovements,
  registerAdjustment,
  registerEntry,
  registerExit,
  registerInitialStock,
} from './inventory.controller.js'

export const inventoryRouter = Router()

inventoryRouter.use(requireAuth)
inventoryRouter.get(
  '/existencia',
  requirePermission('inventory:read'),
  listExistence,
)
inventoryRouter.get(
  '/historial',
  requirePermission('inventory:read'),
  listMovements,
)
inventoryRouter.post(
  '/stock-inicial',
  requirePermission('inventory:write'),
  registerInitialStock,
)
inventoryRouter.post(
  '/entradas',
  requirePermission('inventory:write'),
  registerEntry,
)
inventoryRouter.post(
  '/salidas',
  requirePermission('inventory:write'),
  registerExit,
)
inventoryRouter.post(
  '/ajustes',
  requirePermission('inventory:write'),
  registerAdjustment,
)
