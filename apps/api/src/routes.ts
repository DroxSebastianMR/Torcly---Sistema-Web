import { Router } from 'express'
import { healthRouter } from './modules/health/health.routes.js'
import { productsRouter } from './modules/products/products.routes.js'
import { authRouter } from './modules/auth/auth.routes.js'
import { usersRouter } from './modules/users/users.routes.js'
import { customersRouter } from './modules/customers/customers.routes.js'
import { vehiclesRouter } from './modules/vehicles/vehicles.routes.js'
import { inventoryRouter } from './modules/inventory/inventory.routes.js'
import { servicesRouter } from './modules/services/services.routes.js'
import { salesRouter } from './modules/sales/sales.routes.js'
import { appointmentsRouter } from './modules/appointments/appointment.routes.js'

export const apiRouter = Router()

apiRouter.use('/health', healthRouter)
apiRouter.use('/auth', authRouter)
apiRouter.use('/products', productsRouter)
apiRouter.use('/users', usersRouter)
apiRouter.use('/customers', customersRouter)
apiRouter.use('/vehicles', vehiclesRouter)
apiRouter.use('/inventory', inventoryRouter)
apiRouter.use('/services', servicesRouter)
apiRouter.use('/sales', salesRouter)
apiRouter.use('/appointments', appointmentsRouter)
