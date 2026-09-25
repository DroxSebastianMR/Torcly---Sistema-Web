import { Router } from 'express'
import { requireAuth, requirePermission } from '../auth/auth.middleware.js'
import {
  createVehicle,
  getVehicle,
  listVehicles,
  updateVehicle,
} from './vehicles.controller.js'

export const vehiclesRouter = Router()

vehiclesRouter.use(requireAuth)
vehiclesRouter.get('/', requirePermission('vehicles:read'), listVehicles)
vehiclesRouter.get('/:id', requirePermission('vehicles:read'), getVehicle)
vehiclesRouter.post('/', requirePermission('vehicles:write'), createVehicle)
vehiclesRouter.put('/:id', requirePermission('vehicles:write'), updateVehicle)
