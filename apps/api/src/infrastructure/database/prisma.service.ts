import type { Prisma } from '../../generated/prisma/client.js'
import { prisma } from './prisma.client.js'
import { requestMetricsContext } from '../../shared/observability/request-context.js'

class PrismaService {
  readonly client = prisma
  private connection: Promise<void> | null = null

  connect() {
    if (!this.connection) {
      this.connection = this.client.$connect().catch((error: unknown) => {
        this.connection = null
        throw error
      })
    }

    return this.connection
  }

  async disconnect() {
    this.connection = null
    await this.client.$disconnect()
  }

  async ping() {
    await this.client.$queryRaw`SELECT 1`
  }

  async transaction<T>(
    operation: (transaction: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    const startedAt = performance.now()
    try {
      return await this.client.$transaction(operation)
    } finally {
      if (process.env.NODE_ENV !== 'test') {
        const context = requestMetricsContext.getStore()
        console.info(
          JSON.stringify({
            level: 'info',
            event: 'database_transaction_completed',
            requestId: context?.requestId ?? null,
            module: context?.path.split('/').filter(Boolean).at(2) ?? 'system',
            method: context?.method ?? null,
            path: context?.path ?? null,
            durationMs: Number((performance.now() - startedAt).toFixed(2)),
          }),
        )
      }
    }
  }
}

export const databaseService = new PrismaService()
