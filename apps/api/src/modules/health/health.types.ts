export interface HealthResponse {
  status: 'ok'
  service: 'torcly-api'
  timestamp: string
}

export interface DatabaseHealthResponse {
  status: 'ok'
  service: 'postgresql'
  latencyMs: number
  timestamp: string
}

export type ReadinessCheckStatus = 'ok' | 'unavailable'

export interface ReadinessResponse {
  status: 'ok' | 'degraded'
  service: 'torcly-api'
  checks: {
    database: ReadinessCheckStatus
  }
  timestamp: string
}
