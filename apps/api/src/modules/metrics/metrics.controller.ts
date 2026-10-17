import type { RequestHandler } from 'express'
import { moduleLoadSchema } from './metrics.schemas.js'

function moduleFromPath(path: string) {
  return path.split('/').filter(Boolean).at(0) ?? 'dashboard'
}

export const registerModuleLoad: RequestHandler = (request, response) => {
  const input = moduleLoadSchema.parse(request.body)
  console.info(
    JSON.stringify({
      level: 'info',
      event: 'client_module_loaded',
      requestId: response.locals.requestId,
      module: moduleFromPath(input.path),
      path: input.path,
      navigationType: input.navigationType,
      durationMs: Number(input.durationMs.toFixed(2)),
    }),
  )
  response.status(204).end()
}
