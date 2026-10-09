import { performance } from 'node:perf_hooks'
import type { RequestHandler } from 'express'
import { requestMetricsContext } from '../shared/observability/request-context.js'

function moduleFromPath(path: string) {
  const segments = path.split('/').filter(Boolean)
  return segments.at(2) ?? 'unknown'
}

export const requestTiming: RequestHandler = (request, response, next) => {
  const startedAt = performance.now()
  const requestId = String(response.locals.requestId ?? 'unknown')
  const path = request.path

  response.once('finish', () => {
    if (process.env.NODE_ENV === 'test') return
    console.info(
      JSON.stringify({
        level: 'info',
        event: 'http_request_completed',
        requestId,
        module: moduleFromPath(path),
        method: request.method,
        path,
        status: response.statusCode,
        durationMs: Number((performance.now() - startedAt).toFixed(2)),
      }),
    )
  })

  requestMetricsContext.run({ requestId, method: request.method, path }, next)
}
