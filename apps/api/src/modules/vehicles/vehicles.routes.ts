import { Router } from 'express'
import { requireAuth, requirePermission } from '../auth/auth.middleware.js'
import {
  createVehicle,
  getVehicle,
  getVehicleHistory,
  listVehicles,
  updateVehicle,
} from './vehicles.controller.js'

export const vehiclesRouter = Router()

vehiclesRouter.use(requireAuth)
vehiclesRouter.get('/', requirePermission('vehicles:read'), listVehicles)
vehiclesRouter.get('/:id/history', requirePermission('vehicles:read'), getVehicleHistory)
vehiclesRouter.get('/:id', requirePermission('vehicles:read'), getVehicle)
vehiclesRouter.post('/', requirePermission('vehicles:write'), createVehicle)
vehiclesRouter.put('/:id', requirePermission('vehicles:write'), updateVehicle)
