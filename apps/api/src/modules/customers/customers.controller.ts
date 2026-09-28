import type { RequestHandler } from 'express'
import { getRequestContext } from '../auth/auth.middleware.js'
import {
  customerIdSchema,
  customerInputSchema,
  customerQuerySchema,
} from './customers.schemas.js'
import { customersService } from './customers.service.js'

export const listCustomers: RequestHandler = async (request, response) => {
  response.json(
    await customersService.list(customerQuerySchema.parse(request.query)),
  )
}

export const getCustomer: RequestHandler = async (request, response) => {
  const { id } = customerIdSchema.parse(request.params)
  response.json(await customersService.getById(id))
}

export const createCustomer: RequestHandler = async (request, response) => {
  const result = await customersService.create(
    customerInputSchema.parse(request.body),
    request.auth!.id,
    getRequestContext(request, response),
  )
  response.status(201).json(result)
}

export const updateCustomer: RequestHandler = async (request, response) => {
  const { id } = customerIdSchema.parse(request.params)
  response.json(
    await customersService.update(
      id,
      customerInputSchema.parse(request.body),
      request.auth!.id,
      getRequestContext(request, response),
    ),
  )
}
