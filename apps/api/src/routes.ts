import { Router } from 'express'
import { healthRouter } from './modules/health/health.routes.js'
import { productsRouter } from './modules/products/products.routes.js'
import { authRouter } from './modules/auth/auth.routes.js'
import { usersRouter } from './modules/users/users.routes.js'
import { customersRouter } from './modules/customers/customers.routes.js'
import { vehiclesRouter } from './modules/vehicles/vehicles.routes.js'
import { inventoryRouter } from './modules/inventory/inventory.routes.js'
import { servicesRouter } from './modules/services/services.routes.js'
import { purchasesRouter } from './modules/purchases/purchases.routes.js'
import { salesRouter } from './modules/sales/sales.routes.js'
import { appointmentsRouter } from './modules/appointments/appointment.routes.js'
import { workOrdersRouter } from './modules/work-orders/work-order.routes.js'
import { paymentsRouter } from './modules/payments/payment.routes.js'
import { cashSessionsRouter } from './modules/cash-sessions/cash-session.routes.js'
import { operationsRouter } from './modules/operations/operations.routes.js'
import { reportsRouter } from './modules/reports/reports.routes.js'
import { metricsRouter } from './modules/metrics/metrics.routes.js'
import { maintenanceRouter } from './modules/maintenance/maintenance.routes.js'
import { auditRouter } from './modules/audit/audit.routes.js'
import { profileRouter } from './modules/profile/profile.routes.js'
import { notificationsRouter } from './modules/notifications/notifications.routes.js'
import { assistantRouter } from './modules/assistant/assistant.routes.js'
import { techniciansRouter } from './modules/technicians/technicians.routes.js'

export const apiRouter = Router()

apiRouter.use('/health', healthRouter)
apiRouter.use('/auth', authRouter)
apiRouter.use('/profile', profileRouter)
apiRouter.use('/notifications', notificationsRouter)
apiRouter.use('/assistant', assistantRouter)
apiRouter.use('/products', productsRouter)
apiRouter.use('/users', usersRouter)
apiRouter.use('/customers', customersRouter)
apiRouter.use('/vehicles', vehiclesRouter)
apiRouter.use('/inventory', inventoryRouter)
apiRouter.use('/services', servicesRouter)
apiRouter.use('/purchases', purchasesRouter)
apiRouter.use('/sales', salesRouter)
apiRouter.use('/appointments', appointmentsRouter)
apiRouter.use('/work-orders', workOrdersRouter)
apiRouter.use('/technicians', techniciansRouter)
apiRouter.use('/payments', paymentsRouter)
apiRouter.use('/cash-sessions', cashSessionsRouter)
apiRouter.use('/operations', operationsRouter)
apiRouter.use('/reports', reportsRouter)
apiRouter.use('/metrics', metricsRouter)
apiRouter.use('/maintenance', maintenanceRouter)
apiRouter.use('/audit', auditRouter)
