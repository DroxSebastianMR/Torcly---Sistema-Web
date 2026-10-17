import { databaseService } from '../../infrastructure/database/prisma.service.js'
import type {
  DatabaseHealthResponse,
  HealthResponse,
  ReadinessCheckStatus,
  ReadinessResponse,
} from './health.types.js'

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

export function buildReadiness(
  database: ReadinessCheckStatus,
  now: Date = new Date(),
): ReadinessResponse {
  return {
    status: database === 'ok' ? 'ok' : 'degraded',
    service: 'torcly-api',
    checks: { database },
    timestamp: now.toISOString(),
  }
}

export async function getReadiness(): Promise<ReadinessResponse> {
  let database: ReadinessCheckStatus = 'ok'
  try {
    await databaseService.ping()
  } catch {
    database = 'unavailable'
  }

  return buildReadiness(database)
}
