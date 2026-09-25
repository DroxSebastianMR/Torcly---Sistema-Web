import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { databaseService } from '../src/infrastructure/database/prisma.service.js'
import { hashPassword } from '../src/modules/auth/password.js'

const runDatabaseTests = process.env.DATABASE_TESTS === 'true'
const describeWithDatabase = describe.runIf(runDatabaseTests)

describeWithDatabase('Inventario integrado con PostgreSQL', () => {
  const app = createApp()
  const suffix = randomUUID().slice(0, 8)
  const password = `Clave-inv-${suffix}!`
  const code = `REP-${suffix.slice(0, 6).toUpperCase()}`
  const identifierPrefix = `REP-${suffix.slice(0, 6).toUpperCase()}`

  const adminOrder = { roleCode: `admin-inventario-${suffix}` }
  const readerOrder = { roleCode: `reader-inventario-${suffix}` }
  const noAccessOrder = { roleCode: `no-inventario-${suffix}` }

  const identity = {
    username: `admin_i_${suffix}`,
    email: `admin_i_${suffix}@torcly.local`,
    name: `Admin Inventario ${suffix}`,
  }
  const readerIdentity = {
    username: `reader_i_${suffix}`,
    email: `reader_i_${suffix}@torcly.local`,
    name: `Lector Inventario ${suffix}`,
  }
  const noAccessIdentity = {
    username: `none_i_${suffix}`,
    email: `none_i_${suffix}@torcly.local`,
    name: `Sin acceso ${suffix}`,
  }

  const adminIds = { userId: '', roleId: '' }
  const readerIds = { userId: '', roleId: '' }
  const noAccessIds = { userId: '', roleId: '' }
  const createdIds = { productId: '', categoryId: '', brandId: '', unitId: '' }
  const cleanupRoleIds: string[] = []
  let sharedPasswordHash = ''

  beforeAll(async () => {
    await databaseService.connect()
    sharedPasswordHash = await hashPassword(password)

    const [readPermission, writePermission] = await Promise.all([
      databaseService.client.permission.upsert({
        where: { code: 'inventory:read' },
        create: {
          code: 'inventory:read',
          description: 'Solo lectura de inventario',
        },
        update: {},
      }),
      databaseService.client.permission.upsert({
        where: { code: 'inventory:write' },
        create: {
          code: 'inventory:write',
          description: 'Registro de movimientos de inventario',
        },
        update: {},
      }),
    ])

    const [adminRole, readerRole, noAccessRole] = await Promise.all([
      databaseService.client.role.create({
        data: {
          code: adminOrder.roleCode,
          name: 'Administrador de inventario',
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
          name: 'Lector de inventario',
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
      data: { name: `Categoría inv ${suffix}` },
    })
    const brand = await databaseService.client.productBrand.create({
      data: { name: `Marca inv ${suffix}` },
    })
    const unit = await databaseService.client.productUnit.create({
      data: {
        name: `Unidad inv ${suffix}`,
        symbol: `ud${suffix.slice(0, 3)}`,
      },
    })
    const product = await databaseService.client.product.create({
      data: {
        code,
        name: 'Filtro de aceite',
        description: 'Repuesto para inventario',
        categoryId: category.id,
        brandId: brand.id,
        unitId: unit.id,
        salePrice: 35.5,
        minimumStock: 4,
      },
    })

    Object.assign(adminIds, { userId: admin.id, roleId: adminRole.id })
    Object.assign(readerIds, { userId: reader.id, roleId: readerRole.id })
    Object.assign(noAccessIds, {
      userId: noAccess.id,
      roleId: noAccessRole.id,
    })
    Object.assign(createdIds, {
      productId: product.id,
      categoryId: category.id,
      brandId: brand.id,
      unitId: unit.id,
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
      where: {
        OR: [
          { identifier: { startsWith: identifierPrefix } },
          { userId: { in: userIds } },
        ],
      },
    })
    await databaseService.client.inventoryMovement.deleteMany({
      where: { productId: createdIds.productId },
    })
    await databaseService.client.product.deleteMany({
      where: { code: { startsWith: identifierPrefix } },
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

  it('bloquea consultas y movimientos sin permiso aunque se invoque la API', async () => {
    const noAccessAgent = request.agent(app)
    await noAccessAgent.post('/api/v1/auth/login').send({
      identifier: noAccessIdentity.username,
      password,
    })
    const denied = await noAccessAgent.get('/api/v1/inventory/existencia')
    expect(denied.status).toBe(403)
    expect(denied.body.error.code).toBe('AUTH_FORBIDDEN')

    const readerAgent = request.agent(app)
    await readerAgent.post('/api/v1/auth/login').send({
      identifier: readerIdentity.username,
      password,
    })
    const listed = await readerAgent.get('/api/v1/inventory/existencia')
    expect(listed.status).toBe(200)

    const written = await readerAgent.post('/api/v1/inventory/entradas').send({
      productId: createdIds.productId,
      quantity: 5,
      idempotencyKey: `entrada-lector-${suffix}`,
    })
    expect(written.status).toBe(403)
    expect(written.body.error.code).toBe('AUTH_FORBIDDEN')
  }, 60_000)

  it('registra el stock inicial una sola vez y lo refleja en existencias', async () => {
    const adminAgent = request.agent(app)
    await adminAgent.post('/api/v1/auth/login').send({
      identifier: identity.username,
      password,
    })

    const initial = await adminAgent
      .post('/api/v1/inventory/stock-inicial')
      .send({
        productId: createdIds.productId,
        quantity: 10,
        notes: 'Conteo físico inicial',
        idempotencyKey: `stock-inicial-${suffix}`,
      })
    expect(initial.status).toBe(201)
    expect(initial.body.data.type).toBe('INITIAL')
    expect(initial.body.data.quantity).toBe(10)
    expect(initial.body.data.product.code).toBe(code)
    expect(initial.body.data.performedBy).toBe(identity.name)

    const duplicate = await adminAgent
      .post('/api/v1/inventory/stock-inicial')
      .send({
        productId: createdIds.productId,
        quantity: 1,
        idempotencyKey: `stock-inicial-dup-${suffix}`,
      })
    expect(duplicate.status).toBe(409)
    expect(duplicate.body.error.code).toBe('INVENTORY_INITIAL_ALREADY_EXISTS')

    const existence = await adminAgent.get('/api/v1/inventory/existencia')
    expect(existence.status).toBe(200)
    expect(existence.body.data).toHaveLength(1)
    expect(existence.body.data[0]).toMatchObject({
      productId: createdIds.productId,
      code,
      stock: 10,
      minimumStock: 4,
      lowStock: false,
    })
  }, 60_000)

  it('acumula entradas, salidas y ajustes con signos correctos', async () => {
    const adminAgent = request.agent(app)
    await adminAgent.post('/api/v1/auth/login').send({
      identifier: identity.username,
      password,
    })

    const entry = await adminAgent.post('/api/v1/inventory/entradas').send({
      productId: createdIds.productId,
      quantity: 5,
      notes: 'Compra a proveedor',
      idempotencyKey: `entrada-a-${suffix}`,
    })
    expect(entry.status).toBe(201)
    expect(entry.body.data.type).toBe('ENTRY')

    const exit = await adminAgent.post('/api/v1/inventory/salidas').send({
      productId: createdIds.productId,
      quantity: 7,
      notes: 'Venta de mostrador',
      idempotencyKey: `salida-a-${suffix}`,
      referenceType: 'sale',
      referenceId: `VENTA-${suffix}`,
    })
    expect(exit.status).toBe(201)
    expect(exit.body.data.type).toBe('EXIT')

    const adjIn = await adminAgent.post('/api/v1/inventory/ajustes').send({
      productId: createdIds.productId,
      quantity: 2,
      notes: 'Ajuste por conteo',
      idempotencyKey: `ajuste-in-${suffix}`,
    })
    expect(adjIn.status).toBe(201)
    expect(adjIn.body.data.type).toBe('ADJUSTMENT_IN')

    const adjOut = await adminAgent.post('/api/v1/inventory/ajustes').send({
      productId: createdIds.productId,
      quantity: -3,
      notes: 'Ajuste por merma',
      idempotencyKey: `ajuste-out-${suffix}`,
    })
    expect(adjOut.status).toBe(201)
    expect(adjOut.body.data.type).toBe('ADJUSTMENT_OUT')

    const existence = await adminAgent.get('/api/v1/inventory/existencia')
    expect(existence.body.data[0].stock).toBe(7)
    expect(existence.body.data[0].lowStock).toBe(false)
  }, 60_000)

  it('rechaza salidas que dejan stock negativo', async () => {
    const adminAgent = request.agent(app)
    await adminAgent.post('/api/v1/auth/login').send({
      identifier: identity.username,
      password,
    })

    const denied = await adminAgent.post('/api/v1/inventory/salidas').send({
      productId: createdIds.productId,
      quantity: 8,
      idempotencyKey: `salida-exceso-${suffix}`,
    })
    expect(denied.status).toBe(409)
    expect(denied.body.error.code).toBe('INSUFFICIENT_STOCK')

    const existence = await adminAgent.get('/api/v1/inventory/existencia')
    expect(existence.body.data[0].stock).toBe(7)
  }, 60_000)

  it('reproduce movimientos con la misma clave de idempotencia', async () => {
    const adminAgent = request.agent(app)
    await adminAgent.post('/api/v1/auth/login').send({
      identifier: identity.username,
      password,
    })

    const key = `replay-${suffix}`
    const first = await adminAgent.post('/api/v1/inventory/entradas').send({
      productId: createdIds.productId,
      quantity: 4,
      idempotencyKey: key,
    })
    expect(first.status).toBe(201)

    const second = await adminAgent.post('/api/v1/inventory/entradas').send({
      productId: createdIds.productId,
      quantity: 9,
      idempotencyKey: key,
    })
    expect(second.status).toBe(201)
    expect(second.body.data.id).toBe(first.body.data.id)
    expect(second.body.data.quantity).toBe(4)

    const existence = await adminAgent.get('/api/v1/inventory/existencia')
    expect(existence.body.data[0].stock).toBe(11)

    const conflict = await adminAgent.post('/api/v1/inventory/salidas').send({
      productId: createdIds.productId,
      quantity: 2,
      idempotencyKey: key,
    })
    expect(conflict.status).toBe(409)
    expect(conflict.body.error.code).toBe('INVENTORY_IDEMPOTENCY_CONFLICT')
  }, 60_000)

  it('serializa salidas concurrentes sin superar el saldo', async () => {
    const adminAgent = request.agent(app)
    const otherAgent = request.agent(app)
    await adminAgent.post('/api/v1/auth/login').send({
      identifier: identity.username,
      password,
    })
    await otherAgent.post('/api/v1/auth/login').send({
      identifier: identity.username,
      password,
    })

    const entry = await adminAgent.post('/api/v1/inventory/entradas').send({
      productId: createdIds.productId,
      quantity: 2,
      idempotencyKey: `concurrencia-entry-${suffix}`,
    })
    expect(entry.status).toBe(201)

    const [first, second] = await Promise.all([
      adminAgent.post('/api/v1/inventory/salidas').send({
        productId: createdIds.productId,
        quantity: 8,
        idempotencyKey: `concurrencia-a-${suffix}`,
      }),
      otherAgent.post('/api/v1/inventory/salidas').send({
        productId: createdIds.productId,
        quantity: 8,
        idempotencyKey: `concurrencia-b-${suffix}`,
      }),
    ])

    const statuses = [first.status, second.status].sort()
    expect(statuses).toEqual([201, 409])
    const rejected = first.status === 409 ? first : second
    expect(rejected.body.error.code).toBe('INSUFFICIENT_STOCK')

    const existence = await adminAgent.get('/api/v1/inventory/existencia')
    expect(existence.body.data[0].stock).toBe(5)
  }, 60_000)

  it('informa productos inexistentes e inactivos', async () => {
    const adminAgent = request.agent(app)
    await adminAgent.post('/api/v1/auth/login').send({
      identifier: identity.username,
      password,
    })

    const missing = await adminAgent.post('/api/v1/inventory/entradas').send({
      productId: randomUUID(),
      quantity: 1,
      idempotencyKey: `missing-${suffix}`,
    })
    expect(missing.status).toBe(404)
    expect(missing.body.error.code).toBe('PRODUCT_NOT_FOUND')

    await databaseService.client.product.update({
      where: { id: createdIds.productId },
      data: { active: false },
    })
    const inactive = await adminAgent.post('/api/v1/inventory/entradas').send({
      productId: createdIds.productId,
      quantity: 1,
      idempotencyKey: `inactivo-${suffix}`,
    })
    expect(inactive.status).toBe(409)
    expect(inactive.body.error.code).toBe('PRODUCT_INACTIVE')

    await databaseService.client.product.update({
      where: { id: createdIds.productId },
      data: { active: true },
    })
  }, 60_000)

  it('filtrar historial por producto, tipo y rango de fechas', async () => {
    const adminAgent = request.agent(app)
    await adminAgent.post('/api/v1/auth/login').send({
      identifier: identity.username,
      password,
    })

    const today = new Date().toISOString().slice(0, 10)

    const all = await adminAgent.get(
      `/api/v1/inventory/historial?productId=${createdIds.productId}&pageSize=50`,
    )
    expect(all.status).toBe(200)
    expect(all.body.data.length).toBeGreaterThanOrEqual(8)
    expect(
      all.body.data.every(
        (m: { product: { code: string } }) => m.product.code === code,
      ),
    ).toBe(true)

    const exitsOnly = await adminAgent.get(
      `/api/v1/inventory/historial?type=EXIT&from=${today}&pageSize=50`,
    )
    expect(exitsOnly.status).toBe(200)
    expect(
      exitsOnly.body.data.every((m: { type: string }) => m.type === 'EXIT'),
    ).toBe(true)

    const byDate = await adminAgent.get(
      `/api/v1/inventory/historial?from=${today}&to=${today}&pageSize=50`,
    )
    expect(byDate.status).toBe(200)
    expect(byDate.body.data.length).toBe(all.body.data.length)
  }, 60_000)

  it('registra auditoría de cada movimiento con saldo posterior', async () => {
    const events = await databaseService.client.auditLog.findMany({
      where: { identifier: identifierPrefix },
      orderBy: { createdAt: 'asc' },
    })

    const sequence = events.map((event) => event.event)
    expect(sequence).toContain('INVENTORY_STOCK_INITIALIZED')
    for (const event of [
      'INVENTORY_ENTRY_REGISTERED',
      'INVENTORY_EXIT_REGISTERED',
    ]) {
      expect(
        sequence.filter((item) => item === event).length,
      ).toBeGreaterThanOrEqual(2)
    }
    expect(
      sequence.filter((item) => item === 'INVENTORY_ADJUSTMENT_REGISTERED')
        .length,
    ).toBe(2)

    const movementMetadata = events[0].metadata as {
      movementId?: string
      stockAfter?: number
    }
    expect(movementMetadata.stockAfter).toBe(10)
    expect(movementMetadata.movementId).toBeTruthy()
  }, 60_000)
})
