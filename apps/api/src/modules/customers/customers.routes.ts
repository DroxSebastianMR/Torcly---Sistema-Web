import { Router } from 'express'
import { requireAuth, requirePermission } from '../auth/auth.middleware.js'
import {
  createCustomer,
  getCustomer,
  listCustomers,
  updateCustomer,
} from './customers.controller.js'

export const customersRouter = Router()

customersRouter.use(requireAuth)
customersRouter.get('/', requirePermission('customers:read'), listCustomers)
customersRouter.get('/:id', requirePermission('customers:read'), getCustomer)
customersRouter.post('/', requirePermission('customers:write'), createCustomer)
customersRouter.put(
  '/:id',
  requirePermission('customers:write'),
  updateCustomer,
)
