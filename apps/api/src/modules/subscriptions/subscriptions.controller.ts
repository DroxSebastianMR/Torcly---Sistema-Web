import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../../shared/errors/app-error.js'
import {
  platformSubscriptionQuerySchema,
  updatePlatformSubscriptionSchema,
} from './subscriptions.schemas.js'
import { subscriptionsService } from './subscriptions.service.js'

export async function getWorkshopSubscription(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const organizationId = request.auth?.organization?.id
    if (!organizationId) {
      throw new AppError(
        400,
        'ORGANIZATION_CONTEXT_REQUIRED',
        'Se requiere contexto de organización activa.',
      )
    }

    const result =
      await subscriptionsService.getWorkshopSubscriptionDetails(organizationId)
    response.json(result)
  } catch (error) {
    next(error)
  }
}

export async function listPlatformSubscriptions(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const query = platformSubscriptionQuerySchema.parse(request.query)
    const result = await subscriptionsService.listPlatformSubscriptions(query)
    response.json(result)
  } catch (error) {
    next(error)
  }
}

export async function getPlatformSubscriptionMetrics(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const result = await subscriptionsService.getPlatformSubscriptionMetrics()
    response.json(result)
  } catch (error) {
    next(error)
  }
}

export async function listPlatformPlans(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const result = await subscriptionsService.listPlatformPlans()
    response.json(result)
  } catch (error) {
    next(error)
  }
}

export async function updatePlatformSubscription(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const organizationId = request.params.organizationId as string
    if (!organizationId) {
      throw new AppError(
        400,
        'ORGANIZATION_ID_REQUIRED',
        'Se requiere el identificador de la organización.',
      )
    }

    const payload = updatePlatformSubscriptionSchema.parse(request.body)
    const result = await subscriptionsService.updatePlatformSubscription(
      organizationId,
      payload,
    )
    response.json(result)
  } catch (error) {
    next(error)
  }
}
