import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { databaseService } from '../src/infrastructure/database/prisma.service.js'
import { purchasesRepository } from '../src/modules/purchases/purchases.repository.js'

const RUN_INTEGRATION = process.env.DATABASE_TESTS === 'true'
const describeIfDb = RUN_INTEGRATION ? describe : describe.skip

const testContext = {
  requestId: 'test-request-id',
  ipAddress: '127.0.0.1',
  userAgent: 'test',
}
const testActor = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Test User',
}

describeIfDb('Purchases integration (PostgreSQL)', () => {
  let supplierId: string | undefined
  let productId: string | undefined
  let purchaseId: string | undefined

  beforeEach(async () => {
    const product = await databaseService.client.product.findFirst({
      where: { active: true },
      select: { id: true },
    })
    if (!product) throw new Error('No hay productos activos en la BD de prueba')
    productId = product.id

    const supplier = await purchasesRepository.createSupplier(
      {
        legalName: `Proveedor Test ${Date.now()}`,
        documentNumber: `DOC-${Date.now()}`,
        contactName: null,
        phone: null,
        email: null,
      },
      testActor,
      testContext,
    )
    supplierId = supplier.id
  })

  afterEach(async () => {
    if (purchaseId) {
      await databaseService.client.purchaseLine.deleteMany({
        where: { purchaseId },
      })
      await databaseService.client.purchase.deleteMany({
        where: { id: purchaseId },
      })
    }
    if (supplierId) {
      await databaseService.client.supplier.deleteMany({
        where: { id: supplierId },
      })
    }
  })

  it('crea un proveedor y una compra borrador', async () => {
    const product = await databaseService.client.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        code: true,
        name: true,
        unit: { select: { symbol: true } },
      },
    })

    const purchase = await purchasesRepository.createPurchase(
      {
        supplierId: supplierId!,
        purchaseDate: new Date('2026-10-24'),
        externalRef: null,
        notes: null,
        lines: [
          {
            productId: productId!,
            quantity: 5,
            unitCost: 10,
            subtotal: 50,
            productName: product!.name,
            productCode: product!.code,
            unitLabel: product!.unit?.symbol ?? null,
          },
        ],
        total: 50,
      },
      testActor,
      testContext,
    )
    purchaseId = purchase.id
    expect(purchase.status).toBe('DRAFT')
    expect(purchase.lines).toHaveLength(1)
    expect(Number(purchase.total)).toBe(50)
  })

  it('confirma recepción y no duplica con mismo requestId', async () => {
    const product = await databaseService.client.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        code: true,
        name: true,
        unit: { select: { symbol: true } },
      },
    })

    const purchase = await purchasesRepository.createPurchase(
      {
        supplierId: supplierId!,
        purchaseDate: new Date('2026-10-24'),
        externalRef: null,
        notes: null,
        lines: [
          {
            productId: productId!,
            quantity: 2,
            unitCost: 5,
            subtotal: 10,
            productName: product!.name,
            productCode: product!.code,
            unitLabel: null,
          },
        ],
        total: 10,
      },
      testActor,
      testContext,
    )
    purchaseId = purchase.id

    const reqId = `test-${Date.now()}`
    const first = await purchasesRepository.confirmPurchase(
      purchaseId,
      reqId,
      testActor,
      testContext,
    )
    expect(first.status).toBe('RECEIVED')

    const second = await purchasesRepository.confirmPurchase(
      purchaseId,
      reqId,
      testActor,
      testContext,
    )
    expect(second.id).toBe(first.id)
    expect(second.status).toBe('RECEIVED')

    const movements = await databaseService.client.inventoryMovement.findMany({
      where: { referenceId: purchaseId, type: 'ENTRY' },
    })
    expect(movements.length).toBe(1)
  })
})
