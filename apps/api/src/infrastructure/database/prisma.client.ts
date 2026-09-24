import { PrismaPg } from '@prisma/adapter-pg'
import { env } from '../../config/env.js'
import { PrismaClient } from '../../generated/prisma/client.js'
import { createPostgresPoolConfig } from './postgres-pool.config.js'

const globalDatabase = globalThis as unknown as {
  torclyPrisma?: PrismaClient
}

function createPrismaClient() {
  const adapter = new PrismaPg(createPostgresPoolConfig(env.DATABASE_URL))

  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}

export const prisma = globalDatabase.torclyPrisma ?? createPrismaClient()

if (env.NODE_ENV !== 'production') {
  globalDatabase.torclyPrisma = prisma
}
