import type { RequestHandler } from 'express'
import { getDatabaseHealth, getHealth } from './health.service.js'

export const healthController: RequestHandler = (_request, response) => {
  response.setHeader('Cache-Control', 'no-store')
  response.json(getHealth())
}

export const databaseHealthController: RequestHandler = async (
  _request,
  response,
) => {
  response.setHeader('Cache-Control', 'no-store')
  response.json(await getDatabaseHealth())
}
