import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { databaseService } from '../src/infrastructure/database/prisma.service.js'
import { hashPassword } from '../src/modules/auth/password.js'

const runDatabaseTests = process.env.DATABASE_TESTS === 'true'
const describeWithDatabase = describe.runIf(runDatabaseTests)

const UUID_PATTERN =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/

function isoDay(offsetDays: number): string {
  return new Date(Date.now() + offsetDays * 86_400_000)
    .toISOString()
    .slice(0, 10)
}

describeWithDatabase('Reabastecimiento integrado con PostgreSQL', () => {
  const app = createApp()
  const suffix = randomUUID().slice(0, 8)
  const password = `Clave-reab-${suffix}!`
  const from = isoDay(-9)
  const to = isoDay(0)
  const periodQuery = `from=${from}&to=${to}&coverageDays=30`

  const adminOrder = { roleCode: `admin-reab-${suffix}` }
  const readerOrder = { roleCode: `reader-reab-${suffix}` }
  const noAccessOrder = { roleCode: `no-reab-${suffix}` }

  const adminIdentity = {
    username: `admin_rb_${suffix}`,
    email: `admin_rb_${suffix}@torcly.local`,
    name: `Admin Reabasto ${suffix}`,
  }
  const readerIdentity = {
    username: `reader_rb_${suffix}`,
    email: `reader_rb_${suffix}@torcly.local`,
    name: `Lector Reabasto ${suffix}`,
  }
  const noAccessIdentity = {
    username: `none_rb_${suffix}`,
    email: `none_rb_${suffix}@torcly.local`,
    name: `Sin acceso reabasto ${suffix}`,
  }

  const adminIds = { userId: '', roleId: '' }
  const readerIds = { userId: '', roleId: '' }
  const noAccessIds = { userId: '', roleId: '' }
  const createdIds = {
    productAId: '',
    productBId: '',
    categoryId: '',
    unitId: '',
    saleId: '',
  }
  const productCodes = {
    a: `RPLA-${suffix}`,
    b: `RPLB-${suffix}`,
  }
  const saleCode = `V-${suffix}`
  const cleanupRoleIds: string[] = []
  let sharedPasswordHash = ''

  async function loginAs(identifier: string) {
    const agent = request.agent(app)
    const login = await agent
      .post('/api/v1/auth/login')
      .send({ identifier, password })
    expect(login.status).toBe(200)
    return agent
  }

  beforeAll(async () => {
    await databaseService.connect()
    sharedPasswordHash = await hashPassword(password)

    const [readPermission, writePermission] = await Promise.all([
      databaseService.client.permission.upsert({
        where: { code: 'inventory:read' },
        create: { code: 'inventory:read', description: 'Solo lectura' },
        update: {},
      }),
      databaseService.client.permission.upsert({
        where: { code: 'inventory:write' },
        create: { code: 'inventory:write', description: 'Escritura' },
        update: {},
      }),
    ])

    const [adminRole, readerRole, noAccessRole] = await Promise.all([
      databaseService.client.role.create({
        data: {
          code: adminOrder.roleCode,
          name: 'Administrador de reabastecimiento',
          permissions: {
            create: [
              { permissionId: readPermission.id },
              { permissionId: writePermission.id },
            ],
          },
        },
      }),
      databaseService.client.role.create({
        data: {
          code: readerOrder.roleCode,
          name: 'Lector de reabastecimiento',
          permissions: { create: { permissionId: readPermission.id } },
        },
      }),
      databaseService.client.role.create({
        data: { code: noAccessOrder.roleCode, name: 'Sin acceso' },
      }),
    ])

    const [admin, reader, noAccess] = await Promise.all([
      databaseService.client.user.create({
        data: {
          username: adminIdentity.username,
          email: adminIdentity.email,
          displayName: adminIdentity.name,
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
      data: { name: `Categoría reabasto ${suffix}` },
    })
    const unit = await databaseService.client.productUnit.create({
      data: { name: `Unidad reabasto ${suffix}`, symbol: `U${suffix}` },
    })
    const [productA, productB] = await Promise.all([
      databaseService.client.product.create({
        data: {
          code: productCodes.a,
          name: `Producto con demanda ${suffix}`,
          categoryId: category.id,
          unitId: unit.id,
          salePrice: 10,
          minimumStock: 5,
        },
      }),
      databaseService.client.product.create({
        data: {
          code: productCodes.b,
          name: `Producto sin demanda ${suffix}`,
          categoryId: category.id,
          unitId: unit.id,
          salePrice: 10,
          minimumStock: 1,
        },
      }),
    ])

    await databaseService.client.inventoryMovement.create({
      data: {
        productId: productA.id,
        type: 'INITIAL',
        status: 'CONFIRMED',
        quantity: 10,
        performedBy: adminIdentity.name,
        occurredAt: new Date(),
      },
    })

    const sale = await databaseService.client.sale.create({
      data: {
        code: saleCode,
        status: 'CONFIRMED',
        subtotal: 200,
        total: 200,
        performedBy: adminIdentity.name,
        confirmedBy: adminIdentity.name,
        confirmedAt: new Date(`${from}T12:00:00.000Z`),
        lines: {
          create: [
            [10, 100],
            [5, 50],
            [5, 50],
          ].map(([quantity, subtotal]) => ({
            type: 'PRODUCT' as const,
            productId: productA.id,
            name: productA.name,
            code: productA.code,
            unitLabel: 'und',
            unitPrice: 10,
            quantity,
            subtotal,
          })),
        },
      },
    })

    Object.assign(adminIds, { userId: admin.id, roleId: adminRole.id })
    Object.assign(readerIds, { userId: reader.id, roleId: readerRole.id })
    Object.assign(noAccessIds, {
      userId: noAccess.id,
      roleId: noAccessRole.id,
    })
    Object.assign(createdIds, {
      productAId: productA.id,
      productBId: productB.id,
      categoryId: category.id,
      unitId: unit.id,
      saleId: sale.id,
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
    await databaseService.client.replenishmentRun.deleteMany({
      where: { actorId: { in: userIds } },
    })
    await databaseService.client.saleLine.deleteMany({
      where: { saleId: createdIds.saleId },
    })
    await databaseService.client.sale.deleteMany({
      where: { code: saleCode },
    })
    await databaseService.client.inventoryMovement.deleteMany({
      where: {
        productId: { in: [createdIds.productAId, createdIds.productBId] },
      },
    })
    await databaseService.client.product.deleteMany({
      where: { code: { in: [productCodes.a, productCodes.b] } },
    })
    await databaseService.client.productCategory.deleteMany({
      where: { id: createdIds.categoryId },
    })
    await databaseService.client.productUnit.deleteMany({
      where: { id: createdIds.unitId },
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

  it('exige inventory:read para consultar y inventory:write para ejecutar', async () => {
    const noAccessAgent = await loginAs(noAccessIdentity.username)
    const denied = await noAccessAgent.get(
      `/api/v1/replenishment/eligibility?${periodQuery}`,
    )
    expect(denied.status).toBe(403)
    expect(denied.body.error.code).toBe('AUTH_FORBIDDEN')

    const readerAgent = await loginAs(readerIdentity.username)
    const listed = await readerAgent.get(
      `/api/v1/replenishment/eligibility?${periodQuery}&search=${suffix}`,
    )
    expect(listed.status).toBe(200)

    const written = await readerAgent
      .post('/api/v1/replenishment/runs')
      .send({ from, to, coverageDays: 30 })
    expect(written.status).toBe(403)
    expect(written.body.error.code).toBe('AUTH_FORBIDDEN')
  }, 60_000)

  it('calcula recomendaciones explicables solo con datos confirmados', async () => {
    const adminAgent = await loginAs(adminIdentity.username)
    const response = await adminAgent.get(
      `/api/v1/replenishment/eligibility?${periodQuery}&search=${suffix}`,
    )

    expect(response.status).toBe(200)
    expect(response.body.period).toEqual({ from, to })
    expect(response.body.periodDays).toBe(10)
    expect(response.body.strategyVersion).toBe('v1')
    expect(response.body.minDemandPoints).toBe(3)
    expect(response.body.items).toHaveLength(2)
    expect(response.body.counts.total).toBeGreaterThanOrEqual(2)

    const itemA = response.body.items.find(
      (item: { code: string }) => item.code === productCodes.a,
    )
    expect(itemA).toMatchObject({
      eligible: true,
      reason: null,
      stockCurrent: 10,
      minimumStock: 5,
      demandQuantity: 20,
      demandPoints: 3,
      periodDays: 10,
      dailyDemand: 2,
      targetStock: 60,
      suggestedQuantity: 50,
      currentCoverageDays: 5,
      priority: 'ALTA',
    })
    expect(itemA.explanation).toContain('Cantidad sugerida')

    const itemB = response.body.items.find(
      (item: { code: string }) => item.code === productCodes.b,
    )
    expect(itemB).toMatchObject({
      eligible: false,
      reason: 'INSUFFICIENT_DATA',
      suggestedQuantity: null,
      priority: null,
    })

    expect(JSON.stringify(response.body)).not.toMatch(UUID_PATTERN)
  }, 60_000)

  it('ejecuta, persiste y lista corridas sin exponer UUIDs', async () => {
    const adminAgent = await loginAs(adminIdentity.username)
    const created = await adminAgent
      .post('/api/v1/replenishment/runs')
      .send({ from, to, coverageDays: 30, idempotencyKey: `reab-${suffix}` })

    expect(created.status).toBe(201)
    expect(created.body.code).toMatch(/^RAB-\d{6}$/)
    expect(created.body).toMatchObject({
      strategyVersion: 'v1',
      period: { from, to },
      periodDays: 10,
      coverageTargetDays: 30,
      actorName: adminIdentity.name,
    })
    expect(created.body.eligibleCount).toBeGreaterThanOrEqual(1)
    expect(created.body.suggestedTotal).toBeGreaterThanOrEqual(50)
    expect(created.body.recommendationCount).toBeGreaterThanOrEqual(2)
    expect(JSON.stringify(created.body)).not.toMatch(UUID_PATTERN)

    const code = created.body.code
    const detail = await adminAgent.get(
      `/api/v1/replenishment/runs/${code}?search=${suffix}`,
    )
    expect(detail.status).toBe(200)
    expect(detail.body.run.code).toBe(code)
    expect(detail.body.pagination.total).toBe(2)
    const detailItemA = detail.body.items.find(
      (item: { code: string }) => item.code === productCodes.a,
    )
    expect(detailItemA.suggestedQuantity).toBe(50)
    expect(JSON.stringify(detail.body)).not.toMatch(UUID_PATTERN)

    const filtered = await adminAgent.get(
      `/api/v1/replenishment/runs/${code}?search=${suffix}&eligible=true`,
    )
    expect(filtered.body.items).toHaveLength(1)
    expect(filtered.body.items[0].code).toBe(productCodes.a)

    const history = await adminAgent.get(
      `/api/v1/replenishment/runs?${periodQuery}`,
    )
    expect(history.status).toBe(200)
    expect(
      history.body.items.some((item: { code: string }) => item.code === code),
    ).toBe(true)
  }, 60_000)

  it('reintenta con idempotencia sin duplicar corridas', async () => {
    const adminAgent = await loginAs(adminIdentity.username)
    const key = `reab-idem-${suffix}`
    const first = await adminAgent
      .post('/api/v1/replenishment/runs')
      .send({ from, to, coverageDays: 30, idempotencyKey: key })
    expect(first.status).toBe(201)

    const replay = await adminAgent
      .post('/api/v1/replenishment/runs')
      .send({ from, to, coverageDays: 30, idempotencyKey: key })
    expect(replay.status).toBe(200)
    expect(replay.body.code).toBe(first.body.code)

    const [concurrentA, concurrentB] = await Promise.all([
      adminAgent
        .post('/api/v1/replenishment/runs')
        .send({ from, to, coverageDays: 30, idempotencyKey: key }),
      adminAgent
        .post('/api/v1/replenishment/runs')
        .send({ from, to, coverageDays: 30, idempotencyKey: key }),
    ])
    expect(concurrentA.body.code).toBe(first.body.code)
    expect(concurrentB.body.code).toBe(first.body.code)
  }, 60_000)

  it('no crea movimientos ni compras al recomendar', async () => {
    const movements = await databaseService.client.inventoryMovement.count({
      where: { productId: createdIds.productAId },
    })
    expect(movements).toBe(1)

    const runs = await databaseService.client.replenishmentRun.count({
      where: { actorId: adminIds.userId },
    })
    expect(runs).toBeGreaterThan(0)
    const audits = await databaseService.client.auditLog.count({
      where: { userId: adminIds.userId, event: 'REPLENISHMENT_RUN_EXECUTED' },
    })
    expect(audits).toBe(runs)
  }, 60_000)

  it('rechaza períodos invertidos y corridas inexistentes', async () => {
    const adminAgent = await loginAs(adminIdentity.username)
    const inverted = await adminAgent.get(
      `/api/v1/replenishment/eligibility?from=${to}&to=${from}`,
    )
    expect(inverted.status).toBe(400)
    expect(inverted.body.error.code).toBe('REPLENISHMENT_DATE_RANGE_INVALID')

    const coverage = await adminAgent
      .post('/api/v1/replenishment/runs')
      .send({ from, to, coverageDays: 0 })
    expect(coverage.status).toBe(400)
    expect(coverage.body.error.code).toBe('REPLENISHMENT_COVERAGE_INVALID')

    const missing = await adminAgent.get(
      '/api/v1/replenishment/runs/RAB-999999',
    )
    expect(missing.status).toBe(404)
    expect(missing.body.error.code).toBe('REPLENISHMENT_RUN_NOT_FOUND')
  }, 60_000)
})
