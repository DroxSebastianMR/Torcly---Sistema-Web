import { databaseService } from '../../infrastructure/database/prisma.service.js'
import type { DatabaseHealthResponse, HealthResponse } from './health.types.js'

export function getHealth(): HealthResponse {
  return {
    status: 'ok',
    service: 'torcly-api',
    timestamp: new Date().toISOString(),
  }
}

export async function getDatabaseHealth(): Promise<DatabaseHealthResponse> {
  const startedAt = performance.now()
  await databaseService.ping()

  return {
    status: 'ok',
    service: 'postgresql',
    latencyMs: Math.round(performance.now() - startedAt),
    timestamp: new Date().toISOString(),
  }
}
