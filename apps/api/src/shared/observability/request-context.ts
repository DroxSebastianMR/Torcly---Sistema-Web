import { AsyncLocalStorage } from 'node:async_hooks'

export interface RequestMetricsContext {
  requestId: string
  method: string
  path: string
}

export const requestMetricsContext =
  new AsyncLocalStorage<RequestMetricsContext>()
