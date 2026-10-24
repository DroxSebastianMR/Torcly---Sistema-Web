import type { Request, RequestHandler } from 'express'
import { z } from 'zod'
import { getRequestContext } from '../auth/auth.middleware.js'
import {
  confirmPurchaseSchema,
  purchaseIdSchema,
  purchaseInputSchema,
  purchaseQuerySchema,
  supplierIdSchema,
  supplierInputSchema,
  supplierQuerySchema,
} from './purchases.schemas.js'
import { purchasesService } from './purchases.service.js'

function actor(request: Request) {
  return { id: request.auth!.id, name: request.auth!.name }
}

// ── Suppliers ────────────────────────────────────────────────
export const listSuppliers: RequestHandler = async (request, response) => {
  response.json(
    await purchasesService.listSuppliers(
      supplierQuerySchema.parse(request.query),
    ),
  )
}

export const listActiveSuppliers: RequestHandler = async (
  _request,
  response,
) => {
  response.json(await purchasesService.listActiveSuppliers())
}

export const getSupplier: RequestHandler = async (request, response) => {
  const { id } = supplierIdSchema.parse(request.params)
  response.json(await purchasesService.getSupplierById(id))
}

export const createSupplier: RequestHandler = async (request, response) => {
  response
    .status(201)
    .json(
      await purchasesService.createSupplier(
        supplierInputSchema.parse(request.body),
        actor(request),
        getRequestContext(request, response),
      ),
    )
}

export const updateSupplier: RequestHandler = async (request, response) => {
  const { id } = supplierIdSchema.parse(request.params)
  response.json(
    await purchasesService.updateSupplier(
      id,
      supplierInputSchema.parse(request.body),
      actor(request),
      getRequestContext(request, response),
    ),
  )
}

export const updateSupplierStatus: RequestHandler = async (
  request,
  response,
) => {
  const { id } = supplierIdSchema.parse(request.params)
  const { active } = z
    .object({ active: z.boolean() })
    .strict()
    .parse(request.body)
  response.json(
    await purchasesService.updateSupplierStatus(
      id,
      active,
      actor(request),
      getRequestContext(request, response),
    ),
  )
}

// ── Purchases ────────────────────────────────────────────────
export const listPurchases: RequestHandler = async (request, response) => {
  response.json(
    await purchasesService.listPurchases(
      purchaseQuerySchema.parse(request.query),
    ),
  )
}

export const getPurchase: RequestHandler = async (request, response) => {
  const { id } = purchaseIdSchema.parse(request.params)
  response.json(await purchasesService.getPurchaseById(id))
}

export const createPurchase: RequestHandler = async (request, response) => {
  response
    .status(201)
    .json(
      await purchasesService.createPurchase(
        purchaseInputSchema.parse(request.body),
        actor(request),
        getRequestContext(request, response),
      ),
    )
}

export const updatePurchase: RequestHandler = async (request, response) => {
  const { id } = purchaseIdSchema.parse(request.params)
  response.json(
    await purchasesService.updatePurchase(
      id,
      purchaseInputSchema.parse(request.body),
      actor(request),
      getRequestContext(request, response),
    ),
  )
}

export const confirmPurchase: RequestHandler = async (request, response) => {
  const { id } = purchaseIdSchema.parse(request.params)
  const { requestId } = confirmPurchaseSchema.parse(request.body)
  response.json(
    await purchasesService.confirmPurchase(
      id,
      requestId,
      actor(request),
      getRequestContext(request, response),
    ),
  )
}

export const cancelPurchase: RequestHandler = async (request, response) => {
  const { id } = purchaseIdSchema.parse(request.params)
  response.json(
    await purchasesService.cancelPurchase(
      id,
      actor(request),
      getRequestContext(request, response),
    ),
  )
}
