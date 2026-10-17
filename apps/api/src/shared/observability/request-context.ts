import { AsyncLocalStorage } from 'node:async_hooks'

export interface RequestMetricsContext {
  requestId: string
  method: string
  route: string
}

export const requestMetricsContext =
  new AsyncLocalStorage<RequestMetricsContext>()
