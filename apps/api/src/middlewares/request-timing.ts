import { performance } from 'node:perf_hooks'
import type { RequestHandler } from 'express'
import { requestMetricsContext } from '../shared/observability/request-context.js'
import { normalizeRoutePath } from '../shared/observability/normalize-route.js'

function moduleFromPath(path: string) {
  const segments = path.split('/').filter(Boolean)
  const apiVersionIndex = segments.findIndex(
    (segment, index) => segment === 'api' && segments[index + 1] === 'v1',
  )
  return apiVersionIndex >= 0
    ? (segments[apiVersionIndex + 2] ?? 'unknown')
    : (segments.at(0) ?? 'unknown')
}

function operationFromMethod(method: string) {
  return (
    {
      GET: 'read',
      POST: 'create_or_action',
      PUT: 'replace',
      PATCH: 'update',
      DELETE: 'delete',
    }[method] ?? 'request'
  )
}

export const requestTiming: RequestHandler = (request, response, next) => {
  const startedAt = performance.now()
  const requestId = String(response.locals.requestId ?? 'unknown')
  const method = request.method
  const route = normalizeRoutePath(
    (request.originalUrl ?? request.path).split('?')[0],
  )

  response.once('finish', () => {
    if (process.env.NODE_ENV === 'test') return
    console.info(
      JSON.stringify({
        level: 'info',
        event: 'http_request_completed',
        requestId,
        module: moduleFromPath(route),
        operation: operationFromMethod(method),
        method,
        route,
        status: response.statusCode,
        durationMs: Number((performance.now() - startedAt).toFixed(2)),
      }),
    )
  })

  requestMetricsContext.run({ requestId, method, route }, next)
}
