import type { RequestHandler } from 'express'
import { moduleLoadSchema } from './metrics.schemas.js'
import { normalizeRoutePath } from '../../shared/observability/normalize-route.js'

function moduleFromPath(path: string) {
  return path.split('/').filter(Boolean).at(0) ?? 'dashboard'
}

export const registerModuleLoad: RequestHandler = (request, response) => {
  const input = moduleLoadSchema.parse(request.body)
  const route = normalizeRoutePath(input.path)
  console.info(
    JSON.stringify({
      level: 'info',
      event: 'client_module_loaded',
      requestId: response.locals.requestId,
      module: moduleFromPath(route),
      route,
      navigationType: input.navigationType,
      durationMs: Number(input.durationMs.toFixed(2)),
    }),
  )
  response.status(204).end()
}
