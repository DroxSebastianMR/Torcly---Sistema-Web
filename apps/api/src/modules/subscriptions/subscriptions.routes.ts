import { Router } from 'express'
import { requireAuth } from '../auth/auth.middleware.js'
import { getWorkshopSubscription } from './subscriptions.controller.js'

export const subscriptionsRouter = Router()

// Rutas accesibles para el taller autenticado
subscriptionsRouter.use(requireAuth)
subscriptionsRouter.get('/current', getWorkshopSubscription)
