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
