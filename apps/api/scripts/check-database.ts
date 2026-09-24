import { Pool } from 'pg'
import { env } from '../src/config/env.js'
import { createPostgresPoolConfig } from '../src/infrastructure/database/postgres-pool.config.js'
import { databaseService } from '../src/infrastructure/database/prisma.service.js'

const directPool = new Pool(createPostgresPoolConfig(env.DIRECT_URL, 1))

async function checkDatabase() {
  try {
    await databaseService.connect()
    await databaseService.ping()
    console.info('Pool transaccional: conectado')

    await directPool.query('SELECT 1')
    console.info('Pool de sesión: conectado')
  } finally {
    await Promise.allSettled([databaseService.disconnect(), directPool.end()])
  }
}

void checkDatabase().catch(() => {
  console.error('No se pudo verificar la conexión con PostgreSQL.')
  process.exitCode = 1
})
