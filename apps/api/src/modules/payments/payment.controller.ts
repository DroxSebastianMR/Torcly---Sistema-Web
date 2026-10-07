import type { Request, RequestHandler } from 'express'
import { getRequestContext } from '../auth/auth.middleware.js'
import {
  paymentCompensateSchema,
  paymentIdParamSchema,
  paymentIdSchema,
  paymentQuerySchema,
  paymentRegisterSchema,
} from './payment.schemas.js'
import { paymentsService } from './payment.service.js'

function actor(request: Request) {
  return { id: request.auth!.id, name: request.auth!.name }
}

export const listPayments: RequestHandler = async (request, response) => {
  const parsed = paymentQuerySchema.parse(request.query)
  response.json(
    await paymentsService.list({
      ...parsed,
      from: parsed.from ?? null,
      to: parsed.to ?? null,
    }),
  )
}

export const getPayment: RequestHandler = async (request, response) => {
  const { id } = paymentIdSchema.parse(request.params)
  response.json(await paymentsService.getById(id))
}

export const createPayment: RequestHandler = async (request, response) => {
  const { id } = paymentIdSchema.parse(request.params)
  response
    .status(201)
    .json(
      await paymentsService.registerPayment(
        id,
        paymentRegisterSchema.parse(request.body),
        actor(request),
        getRequestContext(request, response),
      ),
    )
}

export const compensatePayment: RequestHandler = async (request, response) => {
  const { paymentId } = paymentIdParamSchema.parse(request.params)
  response
    .status(201)
    .json(
      await paymentsService.compensatePayment(
        paymentId,
        paymentCompensateSchema.parse(request.body),
        actor(request),
        getRequestContext(request, response),
      ),
    )
}
