import type { PoolConfig } from 'pg'
import { env } from '../../config/env.js'

function normalizeSslMode(connectionString: string) {
  const url = new URL(connectionString)

  if (
    url.searchParams.get('sslmode') === 'require' &&
    !url.searchParams.has('uselibpqcompat')
  ) {
    url.searchParams.set('uselibpqcompat', 'true')
  }

  return url.toString()
}

export function createPostgresPoolConfig(
  connectionString: string,
  max = env.DATABASE_POOL_SIZE,
): PoolConfig {
  return {
    connectionString: normalizeSslMode(connectionString),
    max,
    connectionTimeoutMillis: env.DATABASE_CONNECT_TIMEOUT_MS,
    idleTimeoutMillis: env.DATABASE_IDLE_TIMEOUT_MS,
  }
}
