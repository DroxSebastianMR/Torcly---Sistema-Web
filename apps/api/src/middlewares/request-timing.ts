import { performance } from 'node:perf_hooks'
import type { Request, RequestHandler } from 'express'
import { requestMetricsContext } from '../shared/observability/request-context.js'
import { normalizeRoutePath } from '../shared/observability/normalize-route.js'

function moduleFromPath(path: string) {
  const segments = path.split('/').filter(Boolean)
  return segments.at(2) ?? 'unknown'
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

function resolvedRoute(request: Request): string {
  const routePath = request.route?.path
  if (typeof routePath === 'string' && routePath.length > 0) {
    return `${request.baseUrl}${routePath}` || '/'
  }
  return normalizeRoutePath(request.path)
}

export const requestTiming: RequestHandler = (request, response, next) => {
  const startedAt = performance.now()
  const requestId = String(response.locals.requestId ?? 'unknown')
  const method = request.method

  response.once('finish', () => {
    if (process.env.NODE_ENV === 'test') return
    console.info(
      JSON.stringify({
        level: 'info',
        event: 'http_request_completed',
        requestId,
        module: moduleFromPath(resolvedRoute(request)),
        operation: operationFromMethod(method),
        method,
        route: resolvedRoute(request),
        status: response.statusCode,
        durationMs: Number((performance.now() - startedAt).toFixed(2)),
      }),
    )
  })

  requestMetricsContext.run(
    { requestId, method, route: normalizeRoutePath(request.path) },
    next,
  )
}
