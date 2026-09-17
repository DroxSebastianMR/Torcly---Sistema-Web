import type { RequestHandler } from 'express'
import { getHealth } from './health.service.js'
export const healthController: RequestHandler = (_request, response) => {
  response.setHeader('Cache-Control', 'no-store')
  response.json(getHealth())
}
