import type { Prisma } from '../../generated/prisma/client.js'
import { prisma } from './prisma.client.js'

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

  transaction<T>(
    operation: (transaction: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.client.$transaction(operation)
  }
}

export const databaseService = new PrismaService()
