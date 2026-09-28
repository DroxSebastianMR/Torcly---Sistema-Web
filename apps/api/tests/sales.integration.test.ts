import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { databaseService } from '../src/infrastructure/database/prisma.service.js'
import { hashPassword } from '../src/modules/auth/password.js'

const runDatabaseTests = process.env.DATABASE_TESTS === 'true'
const describeWithDatabase = describe.runIf(runDatabaseTests)

describeWithDatabase('Ventas integradas con PostgreSQL', () => {
  const app = createApp()
  const suffix = randomUUID().slice(0, 8)
  const password = `Clave-ven-${suffix}!`
  const productCode = `VP-${suffix.slice(0, 6).toUpperCase()}`
  const serviceCode = `VS-${suffix.slice(0, 6).toUpperCase()}`

  const adminOrder = { roleCode: `admin-ventas-${suffix}` }
  const readerOrder = { roleCode: `reader-ventas-${suffix}` }
  const noAccessOrder = { roleCode: `no-ventas-${suffix}` }

  const identity = {
    username: `admin_v_${suffix}`,
    email: `admin_v_${suffix}@torcly.local`,
    name: `Admin Ventas ${suffix}`,
  }
  const readerIdentity = {
    username: `reader_v_${suffix}`,
    email: `reader_v_${suffix}@torcly.local`,
    name: `Lector Ventas ${suffix}`,
  }
  const noAccessIdentity = {
    username: `none_v_${suffix}`,
    email: `none_v_${suffix}@torcly.local`,
    name: `Sin acceso ${suffix}`,
  }

  const adminIds = { userId: '', roleId: '' }
  const readerIds = { userId: '', roleId: '' }
  const noAccessIds = { userId: '', roleId: '' }
  const createdIds = {
    productId: '',
    categoryId: '',
    brandId: '',
    unitId: '',
    serviceId: '',
    customerId: '',
  }
  const cleanupRoleIds: string[] = []
  let sharedPasswordHash = ''

  async function loginAs(identifier: string) {
    const agent = request.agent(app)
    await agent.post('/api/v1/auth/login').send({ identifier, password })
    return agent
  }

  beforeAll(async () => {
    await databaseService.connect()
    sharedPasswordHash = await hashPassword(password)

    const [readPermission, writePermission] = await Promise.all([
      databaseService.client.permission.upsert({
        where: { code: 'sales:read' },
        create: {
          code: 'sales:read',
          description: 'Solo lectura de ventas',
        },
        update: {},
      }),
      databaseService.client.permission.upsert({
        where: { code: 'sales:write' },
        create: {
          code: 'sales:write',
          description: 'Registro de ventas',
        },
        update: {},
      }),
    ])

    const [adminRole, readerRole, noAccessRole] = await Promise.all([
      databaseService.client.role.create({
        data: {
          code: adminOrder.roleCode,
          name: 'Administrador de ventas',
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
          name: 'Lector de ventas',
          permissions: { create: { permissionId: readPermission.id } },
        },
      }),
      databaseService.client.role.create({
        data: { code: noAccessOrder.roleCode, name: 'Sin acceso ventas' },
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
      data: { name: `Categoría ventas ${suffix}` },
    })
    const brand = await databaseService.client.productBrand.create({
      data: { name: `Marca ventas ${suffix}` },
    })
    const unit = await databaseService.client.productUnit.create({
      data: {
        name: `Unidad ventas ${suffix}`,
        symbol: `v${suffix.slice(0, 3)}`,
      },
    })
    const product = await databaseService.client.product.create({
      data: {
        code: productCode,
        name: 'Balancín delantero',
        description: 'Producto para venta',
        categoryId: category.id,
        brandId: brand.id,
        unitId: unit.id,
        salePrice: 50,
        minimumStock: 2,
      },
    })
    const service = await databaseService.client.service.create({
      data: {
        code: serviceCode,
        name: 'Alineación de dirección',
        description: 'Servicio de venta',
        price: 30,
      },
    })
    const customer = await databaseService.client.customer.create({
      data: {
        type: 'NATURAL',
        documentNumber: `74${suffix.slice(0, 8)}`,
        firstName: `Cliente ${suffix}`,
        lastName: 'Ventas',
        phone: `900${suffix.slice(0, 6)}`,
        email: `cliente_${suffix}@torcly.local`,
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
      serviceId: service.id,
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
    await databaseService.client.saleLine.deleteMany({
      where: { sale: { customer: { id: createdIds.customerId } } },
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
    await databaseService.client.service.deleteMany({
      where: { code: serviceCode },
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

  it('bloquea consultas y creación sin el permiso correspondiente', async () => {
    const noAccessAgent = await loginAs(noAccessIdentity.username)
    const denied = await noAccessAgent.get('/api/v1/sales')
    expect(denied.status).toBe(403)
    expect(denied.body.error.code).toBe('AUTH_FORBIDDEN')

    const readerAgent = await loginAs(readerIdentity.username)
    const listed = await readerAgent.get('/api/v1/sales')
    expect(listed.status).toBe(200)

    const catalogued = await readerAgent.get('/api/v1/sales/catalogo')
    expect(catalogued.status).toBe(200)

    const written = await readerAgent.post('/api/v1/sales').send({
      customerId: null,
      lines: [
        { type: 'PRODUCT', productId: createdIds.productId, quantity: 1 },
      ],
    })
    expect(written.status).toBe(403)
    expect(written.body.error.code).toBe('AUTH_FORBIDDEN')
  }, 60_000)

  it('expone el catálogo de venta con stock y solo items activos', async () => {
    const adminAgent = await loginAs(identity.username)
    const response = await adminAgent.get('/api/v1/sales/catalogo')
    expect(response.status).toBe(200)

    const productItem = response.body.data.products.find(
      (item: { productId: string }) => item.productId === createdIds.productId,
    )
    expect(productItem).toMatchObject({
      code: productCode,
      salePrice: 50,
      stock: 10,
      active: true,
    })

    const serviceItem = response.body.data.services.find(
      (item: { id: string }) => item.id === createdIds.serviceId,
    )
    expect(serviceItem).toMatchObject({
      code: serviceCode,
      price: 30,
    })
  }, 60_000)

  it('crea una venta en borrador con líneas congeladas y cliente opcional', async () => {
    const adminAgent = await loginAs(identity.username)
    const response = await adminAgent.post('/api/v1/sales').send({
      customerId: createdIds.customerId,
      lines: [
        { type: 'PRODUCT', productId: createdIds.productId, quantity: 2 },
        { type: 'SERVICE', serviceId: createdIds.serviceId },
      ],
    })
    expect(response.status).toBe(201)
    expect(response.body.data.status).toBe('DRAFT')
    expect(response.body.data.code).toMatch(/^VENTA-\d{6}$/)
    expect(response.body.data.subtotal).toBe(130)
    expect(response.body.data.total).toBe(130)
    expect(response.body.data.lines).toHaveLength(2)
    expect(response.body.data.lines[0]).toMatchObject({
      type: 'PRODUCT',
      code: productCode,
      unitPrice: 50,
      quantity: 2,
      subtotal: 100,
    })
    expect(response.body.data.customer.documentNumber).toBeTruthy()
    expect(response.body.data.performedBy).toBe(identity.name)
  }, 60_000)

  it('busca ventas por código, cliente y estado en el listado', async () => {
    const adminAgent = await loginAs(identity.username)
    const all = await adminAgent.get('/api/v1/sales?status=all')
    expect(all.status).toBe(200)
    expect(all.body.data.length).toBeGreaterThanOrEqual(1)

    const byState = await adminAgent.get('/api/v1/sales?status=DRAFT')
    expect(
      byState.body.data.every(
        (item: { status: string }) => item.status === 'DRAFT',
      ),
    ).toBe(true)

    const bySearch = await adminAgent.get(`/api/v1/sales?search=${productCode}`)
    expect(bySearch.body.data.length).toBeGreaterThanOrEqual(1)
  }, 60_000)

  it('recalcula totales al actualizar el borrador y rechaza ventas sin líneas', async () => {
    const adminAgent = await loginAs(identity.username)
    const created = await adminAgent.get(
      `/api/v1/sales?status=DRAFT&search=${productCode}&pageSize=10`,
    )
    const saleIdValue = created.body.data[0].id

    const updated = await adminAgent.put(`/api/v1/sales/${saleIdValue}`).send({
      customerId: null,
      lines: [
        { type: 'PRODUCT', productId: createdIds.productId, quantity: 1 },
      ],
    })
    expect(updated.status).toBe(200)
    expect(updated.body.data.subtotal).toBe(50)
    expect(updated.body.data.lines).toHaveLength(1)

    const empty = await adminAgent.put(`/api/v1/sales/${saleIdValue}`).send({
      lines: [],
    })
    expect(empty.status).toBe(400)
    expect(empty.body.error.code).toBe('SALE_NO_LINES')
  }, 60_000)

  it('confirma la venta, genera la salida de inventario y la audita', async () => {
    const adminAgent = await loginAs(identity.username)
    const created = await adminAgent.get(
      `/api/v1/sales?status=DRAFT&search=${productCode}&pageSize=10`,
    )
    const saleIdValue = created.body.data[0].id

    const absence = await adminAgent.get(`/api/v1/sales/${saleIdValue}`)
    expect(absence.status).toBe(200)
    expect(absence.body.data.status).toBe('DRAFT')
    expect(absence.body.data.confirmedBy).toBeNull()

    const confirmed = await adminAgent.post(
      `/api/v1/sales/${saleIdValue}/confirm`,
    )
    expect(confirmed.status).toBe(200)
    expect(confirmed.body.data.status).toBe('CONFIRMED')
    expect(confirmed.body.data.confirmedBy).toBe(identity.name)
    expect(confirmed.body.data.confirmedAt).toBeTruthy()

    const exits = await databaseService.client.inventoryMovement.findMany({
      where: { productId: createdIds.productId, referenceType: 'sale' },
    })
    expect(exits).toHaveLength(1)
    expect(exits[0]).toMatchObject({
      type: 'EXIT',
      quantity: 1,
      idempotencyKey: `sale-exit:${saleIdValue}:${createdIds.productId}`,
      referenceId: saleIdValue,
      performedBy: identity.name,
    })

    const events = await databaseService.client.auditLog.findMany({
      where: { userId: adminIds.userId },
      orderBy: { createdAt: 'asc' },
    })
    const sequence = events.map((event) => event.event)
    expect(sequence).toContain('SALE_CREATED')
    expect(sequence).toContain('SALE_CONFIRMED')
    expect(sequence).toContain('INVENTORY_EXIT_REGISTERED')
  }, 60_000)

  it('confirma repetidamente sin duplicar salidas ni auditoría', async () => {
    const adminAgent = await loginAs(identity.username)
    const created = await adminAgent.get(
      `/api/v1/sales?status=CONFIRMED&search=${productCode}&pageSize=10`,
    )
    const saleIdValue = created.body.data[0].id

    const first = await adminAgent.post(`/api/v1/sales/${saleIdValue}/confirm`)
    const second = await adminAgent.post(`/api/v1/sales/${saleIdValue}/confirm`)
    expect(second.status).toBe(200)
    expect(second.body.data.id).toBe(first.body.data.id)
    expect(second.body.data.status).toBe('CONFIRMED')

    const exits = await databaseService.client.inventoryMovement.findMany({
      where: { productId: createdIds.productId, referenceType: 'sale' },
    })
    expect(exits).toHaveLength(1)

    const evidence = await databaseService.client.auditLog.count({
      where: {
        userId: adminIds.userId,
        event: 'SALE_CONFIRMED',
        identifier: first.body.data.code,
      },
    })
    expect(evidence).toBe(1)
  }, 60_000)

  it('bloquea la edición de una venta confirmada', async () => {
    const adminAgent = await loginAs(identity.username)
    const created = await adminAgent.get(
      `/api/v1/sales?status=CONFIRMED&search=${productCode}&pageSize=10`,
    )
    const saleIdValue = created.body.data[0].id

    const denied = await adminAgent.put(`/api/v1/sales/${saleIdValue}`).send({
      lines: [
        { type: 'PRODUCT', productId: createdIds.productId, quantity: 3 },
      ],
    })
    expect(denied.status).toBe(409)
    expect(denied.body.error.code).toBe('SALE_READONLY')
  }, 60_000)

  it('rechaza confirmar cuando el stock no alcanza y no genera salidas', async () => {
    const adminAgent = await loginAs(identity.username)
    const draft = await adminAgent.post('/api/v1/sales').send({
      customerId: null,
      lines: [
        { type: 'PRODUCT', productId: createdIds.productId, quantity: 100 },
      ],
    })
    expect(draft.status).toBe(201)
    const saleIdValue = draft.body.data.id

    const denied = await adminAgent.post(`/api/v1/sales/${saleIdValue}/confirm`)
    expect(denied.status).toBe(409)
    expect(denied.body.error.code).toBe('INSUFFICIENT_STOCK')

    const movements = await databaseService.client.inventoryMovement.findMany({
      where: { productId: createdIds.productId, referenceType: 'sale' },
    })
    expect(movements).toHaveLength(1)
  }, 60_000)

  it('conserva los precios congelados aunque cambie el catálogo', async () => {
    const adminAgent = await loginAs(identity.username)
    const draft = await adminAgent.post('/api/v1/sales').send({
      customerId: null,
      lines: [
        { type: 'PRODUCT', productId: createdIds.productId, quantity: 1 },
      ],
    })
    expect(draft.body.data.subtotal).toBe(50)

    await databaseService.client.product.update({
      where: { id: createdIds.productId },
      data: { salePrice: 60 },
    })

    const confirmed = await adminAgent.post(
      `/api/v1/sales/${draft.body.data.id}/confirm`,
    )
    expect(confirmed.status).toBe(200)
    expect(confirmed.body.data.subtotal).toBe(50)
    expect(confirmed.body.data.lines[0].unitPrice).toBe(50)

    const catalog = await adminAgent.get('/api/v1/sales/catalogo')
    expect(
      catalog.body.data.products.find(
        (item: { productId: string }) =>
          item.productId === createdIds.productId,
      ).salePrice,
    ).toBe(60)

    await databaseService.client.product.update({
      where: { id: createdIds.productId },
      data: { salePrice: 50 },
    })
  }, 60_000)
})
