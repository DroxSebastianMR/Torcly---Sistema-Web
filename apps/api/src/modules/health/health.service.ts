import type { HealthResponse } from './health.types.js'
export function getHealth(): HealthResponse {
  return {
    status: 'ok',
    service: 'torcly-api',
    timestamp: new Date().toISOString(),
  }
}
