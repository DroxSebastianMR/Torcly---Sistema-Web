import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { databaseService } from '../src/infrastructure/database/prisma.service.js'
import { hashPassword } from '../src/modules/auth/password.js'

const runDatabaseTests = process.env.DATABASE_TESTS === 'true'
const describeWithDatabase = describe.runIf(runDatabaseTests)

async function createSaleAndConfirm(
  agent: request.Agent,
  payload: {
    customerId: string | null
    lines: unknown[]
  },
) {
  const created = await agent.post('/api/v1/sales').send(payload)
  expect(created.status).toBe(201)
  const confirmed = await agent.post(
    `/api/v1/sales/${created.body.data.id}/confirm`,
  )
  expect(confirmed.status).toBe(200)
  return confirmed.body.data
}

describeWithDatabase('Cobros integrados con PostgreSQL', () => {
  const app = createApp()
  const suffix = randomUUID().slice(0, 8)
  const password = `Clave-pay-${suffix}!`
  const productCode = `PP-${suffix.slice(0, 6).toUpperCase()}`

  const adminOrder = { roleCode: `admin-pagos-${suffix}` }
  const readerOrder = { roleCode: `reader-pagos-${suffix}` }
  const noAccessOrder = { roleCode: `no-pagos-${suffix}` }

  const identity = {
    username: `admin_p_${suffix}`,
    email: `admin_p_${suffix}@torcly.local`,
    name: `Admin Pagos ${suffix}`,
  }
  const readerIdentity = {
    username: `reader_p_${suffix}`,
    email: `reader_p_${suffix}@torcly.local`,
    name: `Lector Pagos ${suffix}`,
  }
  const noAccessIdentity = {
    username: `none_p_${suffix}`,
    email: `none_p_${suffix}@torcly.local`,
    name: `Sin acceso pagos ${suffix}`,
  }

  const adminIds = { userId: '', roleId: '' }
  const readerIds = { userId: '', roleId: '' }
  const noAccessIds = { userId: '', roleId: '' }
  const createdIds = {
    productId: '',
    categoryId: '',
    brandId: '',
    unitId: '',
    customerId: '',
  }
  const cleanupRoleIds: string[] = []
  let sharedPasswordHash = ''

  async function loginAs(identifier: string) {
    const agent = request.agent(app)
    await agent.post('/api/v1/auth/login').send({ identifier, password })
    return agent
  }

  async function countSaleMovements() {
    return databaseService.client.inventoryMovement.count({
      where: { productId: createdIds.productId, referenceType: 'sale' },
    })
  }

  async function listPayments(agent: request.Agent, query = '') {
    const response = await agent.get(`/api/v1/payments${query}`)
    expect(response.status).toBe(200)
    return response.body
  }

  beforeAll(async () => {
    await databaseService.connect()
    sharedPasswordHash = await hashPassword(password)

    const permissionCodes = [
      'sales:read',
      'sales:write',
      'cash:read',
      'cash:write',
    ]
    const permissions = await Promise.all(
      permissionCodes.map((code) =>
        databaseService.client.permission.upsert({
          where: { code },
          create: { code, description: code },
          update: {},
        }),
      ),
    )
    const permissionByCode = new Map(
      permissions.map((permission) => [permission.code, permission.id]),
    )

    const [adminRole, readerRole, noAccessRole] = await Promise.all([
      databaseService.client.role.create({
        data: {
          code: adminOrder.roleCode,
          name: 'Administrador de pagos',
          permissions: {
            create: permissionCodes.map((code) => ({
              permissionId: permissionByCode.get(code)!,
            })),
          },
        },
      }),
      databaseService.client.role.create({
        data: {
          code: readerOrder.roleCode,
          name: 'Lector de pagos',
          permissions: {
            create: [
              { permissionId: permissionByCode.get('cash:read')! },
              { permissionId: permissionByCode.get('sales:read')! },
            ],
          },
        },
      }),
      databaseService.client.role.create({
        data: { code: noAccessOrder.roleCode, name: 'Sin acceso pagos' },
      }),
    ])

    const [admin, reader, noAccess] = await Promise.all([
      databaseService.client.user.create({
        data: {
          username: identity.username,
          email: identity.email,
          displayName: identity.name,
          passwordHash: sharedPasswordHash,
          roles: { create: { roleId: adminRole.id } },
        },
      }),
      databaseService.client.user.create({
        data: {
          username: readerIdentity.username,
          email: readerIdentity.email,
          displayName: readerIdentity.name,
          passwordHash: sharedPasswordHash,
          roles: { create: { roleId: readerRole.id } },
        },
      }),
      databaseService.client.user.create({
        data: {
          username: noAccessIdentity.username,
          email: noAccessIdentity.email,
          displayName: noAccessIdentity.name,
          passwordHash: sharedPasswordHash,
          roles: { create: { roleId: noAccessRole.id } },
        },
      }),
    ])

    const category = await databaseService.client.productCategory.create({
      data: { name: `Categoría pagos ${suffix}` },
    })
    const brand = await databaseService.client.productBrand.create({
      data: { name: `Marca pagos ${suffix}` },
    })
    const unit = await databaseService.client.productUnit.create({
      data: {
        name: `Unidad pagos ${suffix}`,
        symbol: `p${suffix.slice(0, 3)}`,
      },
    })
    const product = await databaseService.client.product.create({
      data: {
        code: productCode,
        name: 'Pastilla de freno',
        description: 'Producto para cobros',
        categoryId: category.id,
        brandId: brand.id,
        unitId: unit.id,
        salePrice: 100,
        minimumStock: 2,
      },
    })
    const customer = await databaseService.client.customer.create({
      data: {
        type: 'NATURAL',
        documentNumber: `78${suffix.slice(0, 8)}`,
        firstName: `Cliente ${suffix}`,
        lastName: 'Pagos',
        phone: `910${suffix.slice(0, 6)}`,
        email: `cliente_pay_${suffix}@torcly.local`,
      },
    })
    await databaseService.client.inventoryMovement.create({
      data: {
        productId: product.id,
        type: 'INITIAL',
        status: 'CONFIRMED',
        quantity: 10,
        performedBy: identity.name,
        occurredAt: new Date(),
      },
    })

    Object.assign(adminIds, { userId: admin.id, roleId: adminRole.id })
    Object.assign(readerIds, { userId: reader.id, roleId: readerRole.id })
    Object.assign(noAccessIds, { userId: noAccess.id, roleId: noAccessRole.id })
    Object.assign(createdIds, {
      productId: product.id,
      categoryId: category.id,
      brandId: brand.id,
      unitId: unit.id,
      customerId: customer.id,
    })
    cleanupRoleIds.push(adminRole.id, readerRole.id, noAccessRole.id)
  }, 60_000)

  afterAll(async () => {
    const userIds = [
      adminIds.userId,
      readerIds.userId,
      noAccessIds.userId,
    ].filter(Boolean)

    await databaseService.client.auditLog.deleteMany({
      where: { userId: { in: userIds } },
    })
    await databaseService.client.payment.deleteMany({
      where: { sale: { customerId: createdIds.customerId } },
    })
    await databaseService.client.saleLine.deleteMany({
      where: { sale: { customerId: createdIds.customerId } },
    })
    await databaseService.client.sale.deleteMany({
      where: { customerId: createdIds.customerId },
    })
    await databaseService.client.inventoryMovement.deleteMany({
      where: { productId: createdIds.productId },
    })
    await databaseService.client.product.deleteMany({
      where: { code: productCode },
    })
    await databaseService.client.productCategory.deleteMany({
      where: { id: createdIds.categoryId },
    })
    await databaseService.client.productBrand.deleteMany({
      where: { id: createdIds.brandId },
    })
    await databaseService.client.productUnit.deleteMany({
      where: { id: createdIds.unitId },
    })
    await databaseService.client.customer.deleteMany({
      where: { id: createdIds.customerId },
    })
    await databaseService.client.authSession.deleteMany({
      where: { userId: { in: userIds } },
    })
    await databaseService.client.userRole.deleteMany({
      where: { userId: { in: userIds } },
    })
    await databaseService.client.user.deleteMany({
      where: { id: { in: userIds } },
    })
    await databaseService.client.rolePermission.deleteMany({
      where: { roleId: { in: cleanupRoleIds } },
    })
    await databaseService.client.role.deleteMany({
      where: { id: { in: cleanupRoleIds } },
    })
    await databaseService.disconnect()
  }, 60_000)

  it('vende y confirma una venta para generar una obligación pendiente', async () => {
    const adminAgent = await loginAs(identity.username)
    const sale = await createSaleAndConfirm(adminAgent, {
      customerId: createdIds.customerId,
      lines: [
        { type: 'PRODUCT', productId: createdIds.productId, quantity: 1 },
      ],
    })
    expect(sale.status).toBe('CONFIRMED')
    expect(sale.total).toBe(100)

    const body = await listPayments(adminAgent, `?search=${sale.code}`)
    const obligations = body.data
    const match = obligations.find(
      (item: { id: string }) => item.id === sale.id,
    )
    expect(match).toMatchObject({
      status: 'CONFIRMED',
      total: 100,
      paid: 0,
      balance: 100,
      collectionStatus: 'PENDING',
    })
  }, 60_000)

  it('bloquea consultas y registro sin el permiso correspondiente', async () => {
    const noAccessAgent = await loginAs(noAccessIdentity.username)
    const denied = await noAccessAgent.get('/api/v1/payments')
    expect(denied.status).toBe(403)
    expect(denied.body.error.code).toBe('AUTH_FORBIDDEN')

    const readerAgent = await loginAs(readerIdentity.username)
    const listed = await readerAgent.get('/api/v1/payments')
    expect(listed.status).toBe(200)

    const body = await listPayments(readerAgent, '')
    const saleIdValue = body.data[0].id
    const paid = await readerAgent
      .post(`/api/v1/payments/${saleIdValue}/pay`)
      .send({
        requestId: randomUUID(),
        amount: 10,
        method: 'CASH',
      })
    expect(paid.status).toBe(403)
    expect(paid.body.error.code).toBe('AUTH_FORBIDDEN')
  }, 60_000)

  it('registra pagos parciales, deriva estados y nunca sobrepaga', async () => {
    const adminAgent = await loginAs(identity.username)
    const body = await listPayments(adminAgent, '?status=PENDING')
    const saleIdValue = body.data[0].id

    const first = await adminAgent
      .post(`/api/v1/payments/${saleIdValue}/pay`)
      .send({
        requestId: randomUUID(),
        amount: 30,
        method: 'CASH',
      })
    expect(first.status).toBe(201)
    expect(first.body.data).toMatchObject({
      total: 100,
      paid: 30,
      balance: 70,
      collectionStatus: 'PARTIALLY_PAID',
    })
    expect(first.body.data.events).toHaveLength(1)
    expect(first.body.data.events[0]).toMatchObject({
      type: 'PAYMENT',
      code: /^PAGO-\d{6}$/,
      amount: 30,
      netAmount: 30,
      method: 'CASH',
    })

    const again = await adminAgent
      .post(`/api/v1/payments/${saleIdValue}/pay`)
      .send({
        requestId: randomUUID(),
        amount: 80,
        method: 'TRANSFER',
      })
    expect(again.status).toBe(409)
    expect(again.body.error.code).toBe('PAYMENT_EXCEEDS_BALANCE')

    const bad = await adminAgent
      .post(`/api/v1/payments/${saleIdValue}/pay`)
      .send({
        requestId: randomUUID(),
        amount: 30.001,
        method: 'CASH',
      })
    expect(bad.status).toBe(400)
    expect(bad.body.error.code).toBe('PAYMENT_INVALID_AMOUNT')
  }, 60_000)

  it('completa el saldo, marca la obligación como PAID y filtra por estado', async () => {
    const adminAgent = await loginAs(identity.username)
    const before = await countSaleMovements()

    const body = await listPayments(adminAgent, '?status=PARTIALLY_PAID')
    const saleIdValue = body.data[0].id
    const completed = await adminAgent
      .post(`/api/v1/payments/${saleIdValue}/pay`)
      .send({
        requestId: randomUUID(),
        amount: 70,
        method: 'CARD',
      })
    expect(completed.status).toBe(201)
    expect(completed.body.data).toMatchObject({
      paid: 100,
      balance: 0,
      collectionStatus: 'PAID',
    })

    const filtered = await listPayments(adminAgent, '?status=PAID')
    expect(
      filtered.data.some((item: { id: string }) => item.id === saleIdValue),
    ).toBe(true)

    const byMethod = await listPayments(adminAgent, '?method=CARD')
    expect(
      byMethod.data.some((item: { id: string }) => item.id === saleIdValue),
    ).toBe(true)

    expect(await countSaleMovements()).toBe(before)
  }, 60_000)

  it('compensa un pago con motivo, restaura saldo y audita sin borrar el historial', async () => {
    const adminAgent = await loginAs(identity.username)
    const body = await listPayments(adminAgent, '')
    const matches = body.data.filter(
      (item: { collectionStatus: string }) => item.collectionStatus === 'PAID',
    )
    const saleIdValue = matches[0].id

    const detail = await adminAgent.get(`/api/v1/payments/${saleIdValue}`)
    const targetPayment = detail.body.data.events.find(
      (event: { type: string; method: string }) =>
        event.type === 'PAYMENT' && event.method === 'CARD',
    )

    const withoutReason = await adminAgent
      .post(`/api/v1/payments/${targetPayment.id}/compensate`)
      .send({ requestId: randomUUID(), amount: 10, reason: '  ' })
    expect(withoutReason.status).toBe(400)

    const oversized = await adminAgent
      .post(`/api/v1/payments/${targetPayment.id}/compensate`)
      .send({ requestId: randomUUID(), amount: 71, reason: 'Excede el cobro' })
    expect(oversized.status).toBe(409)
    expect(oversized.body.error.code).toBe('PAYMENT_COMPENSATION_EXCEEDS')

    const compensated = await adminAgent
      .post(`/api/v1/payments/${targetPayment.id}/compensate`)
      .send({ requestId: randomUUID(), amount: 70, reason: 'Cobro duplicado' })
    expect(compensated.status).toBe(201)
    expect(compensated.body.data).toMatchObject({
      paid: 30,
      balance: 70,
      collectionStatus: 'PARTIALLY_PAID',
    })
    const compensation = compensated.body.data.events.find(
      (event: { code: string }) => event.code.startsWith('COMP-'),
    )
    expect(compensation).toMatchObject({
      type: 'COMPENSATION',
      amount: 70,
      netAmount: -70,
      reason: 'Cobro duplicado',
      originalCode: targetPayment.code,
    })

    const events = await databaseService.client.auditLog.findMany({
      where: { userId: adminIds.userId, event: 'PAYMENT_COMPENSATED' },
    })
    expect(events.length).toBeGreaterThanOrEqual(1)
  }, 60_000)

  it('rechaza pagos sobre ventas en borrador', async () => {
    const adminAgent = await loginAs(identity.username)
    const created = await adminAgent.post('/api/v1/sales').send({
      customerId: createdIds.customerId,
      lines: [
        { type: 'PRODUCT', productId: createdIds.productId, quantity: 1 },
      ],
    })
    expect(created.status).toBe(201)
    const denied = await adminAgent
      .post(`/api/v1/payments/${created.body.data.id}/pay`)
      .send({ requestId: randomUUID(), amount: 10, method: 'CASH' })
    expect(denied.status).toBe(409)
    expect(denied.body.error.code).toBe('PAYMENT_SALE_NOT_CONFIRMED')
  }, 60_000)

  it('es idempotente: reintentar con el mismo requestId no duplica el cobro', async () => {
    const adminAgent = await loginAs(identity.username)
    const sale = await createSaleAndConfirm(adminAgent, {
      customerId: createdIds.customerId,
      lines: [
        { type: 'PRODUCT', productId: createdIds.productId, quantity: 1 },
      ],
    })
    const requestId = randomUUID()

    const first = await adminAgent
      .post(`/api/v1/payments/${sale.id}/pay`)
      .send({
        requestId,
        amount: 45,
        method: 'CASH',
      })
    expect(first.status).toBe(201)

    const replay = await adminAgent
      .post(`/api/v1/payments/${sale.id}/pay`)
      .send({
        requestId,
        amount: 45,
        method: 'CASH',
      })
    expect(replay.status).toBe(201)
    expect(replay.body.data).toMatchObject({
      balance: 55,
      collectionStatus: 'PARTIALLY_PAID',
    })

    const rows = await databaseService.client.payment.count({
      where: { saleId: sale.id, type: 'PAYMENT' },
    })
    expect(rows).toBe(1)
  }, 60_000)

  it('no supera el saldo bajo cobros concurrentes', async () => {
    const adminAgent = await loginAs(identity.username)
    const sale = await createSaleAndConfirm(adminAgent, {
      customerId: createdIds.customerId,
      lines: [
        { type: 'PRODUCT', productId: createdIds.productId, quantity: 1 },
      ],
    })

    const [first, second] = await Promise.all([
      adminAgent.post(`/api/v1/payments/${sale.id}/pay`).send({
        requestId: randomUUID(),
        amount: 60,
        method: 'CASH',
      }),
      adminAgent.post(`/api/v1/payments/${sale.id}/pay`).send({
        requestId: randomUUID(),
        amount: 60,
        method: 'TRANSFER',
      }),
    ])

    const statuses = [first.status, second.status].sort()
    expect(statuses).toEqual([201, 409])

    const rows = await databaseService.client.payment.findMany({
      where: { saleId: sale.id, type: 'PAYMENT' },
      select: { amount: true },
    })
    const paid = rows.reduce((sum, row) => sum + Number(row.amount), 0)
    expect(paid).toBe(60)
  }, 60_000)
})
