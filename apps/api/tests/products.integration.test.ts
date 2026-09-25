import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { databaseService } from '../src/infrastructure/database/prisma.service.js'
import { hashPassword } from '../src/modules/auth/password.js'

const runDatabaseTests = process.env.DATABASE_TESTS === 'true'
const describeWithDatabase = describe.runIf(runDatabaseTests)

describeWithDatabase('Productos integrados con PostgreSQL', () => {
  const app = createApp()
  const suffix = randomUUID().slice(0, 8)
  const password = `Clave-productos-${suffix}!`
  const code = `PROD-${suffix.slice(0, 6).toUpperCase()}`
  const barcode = `775${suffix.slice(0, 10)}`
  const updatedPrice = 49.9

  const adminOrder = { roleCode: `admin-products-${suffix}` }
  const readerOrder = { roleCode: `reader-products-${suffix}` }
  const noAccessOrder = { roleCode: `no-products-${suffix}` }

  const identity = {
    username: `admin_p_${suffix}`,
    email: `admin_p_${suffix}@torcly.local`,
    name: `Admin Productos ${suffix}`,
  }
  const readerIdentity = {
    username: `reader_p_${suffix}`,
    email: `reader_p_${suffix}@torcly.local`,
    name: `Lector Productos ${suffix}`,
  }
  const noAccessIdentity = {
    username: `none_p_${suffix}`,
    email: `none_p_${suffix}@torcly.local`,
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
  }
  const cleanupRoleIds: string[] = []
  let sharedPasswordHash = ''

  beforeAll(async () => {
    await databaseService.connect()
    sharedPasswordHash = await hashPassword(password)

    const [readPermission, writePermission] = await Promise.all([
      databaseService.client.permission.upsert({
        where: { code: 'products:read' },
        create: {
          code: 'products:read',
          description: 'Solo lectura de productos',
        },
        update: {},
      }),
      databaseService.client.permission.upsert({
        where: { code: 'products:write' },
        create: {
          code: 'products:write',
          description: 'Escritura de productos',
        },
        update: {},
      }),
    ])

    const [adminRole, readerRole, noAccessRole] = await Promise.all([
      databaseService.client.role.create({
        data: {
          code: adminOrder.roleCode,
          name: 'Administrador de productos',
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
          name: 'Lector de productos',
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
      data: { name: `Categoría ${suffix}` },
    })
    const brand = await databaseService.client.productBrand.create({
      data: { name: `Marca ${suffix}` },
    })
    const unit = await databaseService.client.productUnit.create({
      data: { name: `Unidad ${suffix}`, symbol: `ud${suffix.slice(0, 3)}` },
    })

    Object.assign(adminIds, { userId: admin.id, roleId: adminRole.id })
    Object.assign(readerIds, { userId: reader.id, roleId: readerRole.id })
    Object.assign(noAccessIds, {
      userId: noAccess.id,
      roleId: noAccessRole.id,
    })
    Object.assign(createdIds, {
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
          {
            identifier: {
              startsWith: `PROD-${suffix.slice(0, 6).toUpperCase()}`,
            },
          },
          { userId: { in: userIds } },
        ],
      },
    })
    await databaseService.client.inventoryMovement.deleteMany({
      where: {
        productId: {
          in: createdIds.productId ? [createdIds.productId] : [],
        },
      },
    })
    await databaseService.client.product.deleteMany({
      where: {
        code: { startsWith: `PROD-${suffix.slice(0, 6).toUpperCase()}` },
      },
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

  it('bloquea consultas y escrituras sin permiso aunque se invoque la API', async () => {
    const noAccessAgent = request.agent(app)
    await noAccessAgent.post('/api/v1/auth/login').send({
      identifier: noAccessIdentity.username,
      password,
    })
    const denied = await noAccessAgent.get('/api/v1/products')
    expect(denied.status).toBe(403)
    expect(denied.body.error.code).toBe('AUTH_FORBIDDEN')

    const readerAgent = request.agent(app)
    await readerAgent.post('/api/v1/auth/login').send({
      identifier: readerIdentity.username,
      password,
    })
    const listed = await readerAgent.get('/api/v1/products')
    expect(listed.status).toBe(200)

    const written = await readerAgent.post('/api/v1/products').send({
      code,
      name: 'Filtro de aceite',
      categoryId: createdIds.categoryId,
      brandId: createdIds.brandId,
      unitId: createdIds.unitId,
      salePrice: 35.5,
      minimumStock: 4,
    })
    expect(written.status).toBe(403)
    expect(written.body.error.code).toBe('AUTH_FORBIDDEN')
  }, 60_000)

  it('crea un producto normalizando el código y rechaza duplicados equivalentes', async () => {
    const adminAgent = request.agent(app)
    await adminAgent.post('/api/v1/auth/login').send({
      identifier: identity.username,
      password,
    })

    const created = await adminAgent.post('/api/v1/products').send({
      code: code.toLowerCase(),
      barcode,
      name: 'Filtro de aceite',
      description: 'Mantenimiento preventivo',
      categoryId: createdIds.categoryId,
      brandId: createdIds.brandId,
      unitId: createdIds.unitId,
      salePrice: 35.5,
      minimumStock: 4,
    })
    expect(created.status).toBe(201)
    expect(created.body.data.code).toBe(code)
    expect(created.body.data.stock).toBe(0)
    expect(created.body.data.category.name).toBe(`Categoría ${suffix}`)
    createdIds.productId = created.body.data.id

    const duplicate = await adminAgent.post('/api/v1/products').send({
      code,
      barcode: null,
      name: 'Filtro duplicado',
      description: null,
      categoryId: createdIds.categoryId,
      brandId: createdIds.brandId,
      unitId: createdIds.unitId,
      salePrice: 35.5,
      minimumStock: 4,
    })
    expect(duplicate.status).toBe(409)
    expect(duplicate.body.error.code).toBe('PRODUCT_DUPLICATE')
  }, 60_000)

  it('rechaza precio negativo, stock mínimo cero, campos obligatorios y campos de stock', async () => {
    const adminAgent = request.agent(app)
    await adminAgent.post('/api/v1/auth/login').send({
      identifier: identity.email,
      password,
    })

    const negativePrice = await adminAgent.post('/api/v1/products').send({
      code: `PROD-X-${suffix}`,
      barcode: null,
      name: 'Repuesto',
      description: null,
      categoryId: createdIds.categoryId,
      brandId: createdIds.brandId,
      unitId: createdIds.unitId,
      salePrice: -1,
      minimumStock: 0,
    })
    expect(negativePrice.status).toBe(400)
    expect(negativePrice.body.error.code).toBe('VALIDATION_ERROR')

    const zeroMinimumStock = await adminAgent.post('/api/v1/products').send({
      code: `PROD-MIN-${suffix}`,
      barcode: null,
      name: 'Repuesto',
      description: null,
      categoryId: createdIds.categoryId,
      brandId: createdIds.brandId,
      unitId: createdIds.unitId,
      salePrice: 10,
      minimumStock: 0,
    })
    expect(zeroMinimumStock.status).toBe(400)
    expect(zeroMinimumStock.body.error.code).toBe('VALIDATION_ERROR')

    const missingFields = await adminAgent.post('/api/v1/products').send({
      code: `PROD-X-${suffix}`,
    })
    expect(missingFields.status).toBe(400)
    expect(missingFields.body.error.code).toBe('VALIDATION_ERROR')

    const withStock = await adminAgent.post('/api/v1/products').send({
      code: `PROD-X-${suffix}`,
      barcode: null,
      name: 'Repuesto',
      description: null,
      categoryId: createdIds.categoryId,
      brandId: createdIds.brandId,
      unitId: createdIds.unitId,
      salePrice: 10,
      minimumStock: 1,
      stock: 500,
    })
    expect(withStock.status).toBe(400)
    expect(withStock.body.error.code).toBe('VALIDATION_ERROR')
  }, 60_000)

  it('busca por código, nombre y categoría y combina filtros', async () => {
    const adminAgent = request.agent(app)
    await adminAgent.post('/api/v1/auth/login').send({
      identifier: identity.username,
      password,
    })

    const byCode = await adminAgent.get(
      `/api/v1/products?search=${code}&pageSize=50`,
    )
    expect(byCode.status).toBe(200)
    expect(
      byCode.body.data.some(
        (p: { id: string }) => p.id === createdIds.productId,
      ),
    ).toBe(true)

    const byName = await adminAgent.get(
      `/api/v1/products?search=Filtro&pageSize=50`,
    )
    expect(byName.status).toBe(200)
    expect(
      byName.body.data.some(
        (p: { id: string }) => p.id === createdIds.productId,
      ),
    ).toBe(true)

    const byCategoryName = await adminAgent.get(
      `/api/v1/products?search=Categor%C3%ADa%20${suffix}&pageSize=50`,
    )
    expect(byCategoryName.status).toBe(200)
    expect(
      byCategoryName.body.data.some(
        (p: { id: string }) => p.id === createdIds.productId,
      ),
    ).toBe(true)

    const combined = await adminAgent.get(
      `/api/v1/products?search=${code}&categoryId=${createdIds.categoryId}&status=active`,
    )
    expect(combined.status).toBe(200)
    expect(combined.body.data).toHaveLength(1)
    expect(combined.body.data[0].id).toBe(createdIds.productId)

    const noResults = await adminAgent.get(
      `/api/v1/products?search=no-existe-${suffix}`,
    )
    expect(noResults.status).toBe(200)
    expect(noResults.body.data).toEqual([])
  }, 60_000)

  it('consulta el detalle, actualiza el precio y registra auditoría', async () => {
    const adminAgent = request.agent(app)
    await adminAgent.post('/api/v1/auth/login').send({
      identifier: identity.username,
      password,
    })

    const detail = await adminAgent.get(
      `/api/v1/products/${createdIds.productId}`,
    )
    expect(detail.status).toBe(200)
    expect(detail.body.data.code).toBe(code)
    expect(detail.body.data.salePrice).toBe(35.5)

    const updated = await adminAgent
      .put(`/api/v1/products/${createdIds.productId}`)
      .send({
        code: code.toLowerCase(),
        barcode,
        name: 'Filtro de aceite premium',
        description: 'Mantenimiento preventivo',
        categoryId: createdIds.categoryId,
        brandId: createdIds.brandId,
        unitId: createdIds.unitId,
        salePrice: updatedPrice,
        minimumStock: 4,
      })
    expect(updated.status).toBe(200)
    expect(updated.body.data.salePrice).toBe(updatedPrice)
    expect(updated.body.data.name).toBe('Filtro de aceite premium')

    const stockUnchanged = await adminAgent.get(
      `/api/v1/products/${createdIds.productId}`,
    )
    expect(stockUnchanged.body.data.stock).toBe(0)

    const events = await databaseService.client.auditLog.findMany({
      where: { identifier: code },
      orderBy: { createdAt: 'asc' },
    })
    expect(events.map((event) => event.event)).toEqual([
      'PRODUCT_CREATED',
      'PRODUCT_UPDATED',
    ])
    expect(
      events.some(
        (event) =>
          event.event === 'PRODUCT_UPDATED' &&
          (event.metadata as { salePrice?: number }).salePrice === updatedPrice,
      ),
    ).toBe(true)
  }, 60_000)

  it('desactiva sin borrar y sigue consultable, luego reactiva', async () => {
    const adminAgent = request.agent(app)
    await adminAgent.post('/api/v1/auth/login').send({
      identifier: identity.username,
      password,
    })

    const deactivated = await adminAgent
      .patch(`/api/v1/products/${createdIds.productId}/status`)
      .send({ active: false })
    expect(deactivated.status).toBe(200)
    expect(deactivated.body.data.active).toBe(false)

    const stillListed = await adminAgent.get(
      `/api/v1/products?search=${code}&status=all`,
    )
    expect(stillListed.status).toBe(200)
    expect(stillListed.body.data).toHaveLength(1)
    expect(stillListed.body.data[0].active).toBe(false)

    const excludedFromActive = await adminAgent.get(
      `/api/v1/products?search=${code}&status=active`,
    )
    expect(excludedFromActive.status).toBe(200)
    expect(excludedFromActive.body.data).toEqual([])

    const reactivated = await adminAgent
      .patch(`/api/v1/products/${createdIds.productId}/status`)
      .send({ active: true })
    expect(reactivated.status).toBe(200)
    expect(reactivated.body.data.active).toBe(true)

    const events = await databaseService.client.auditLog.findMany({
      where: { identifier: code },
      orderBy: { createdAt: 'asc' },
    })
    expect(events.map((event) => event.event)).toEqual([
      'PRODUCT_CREATED',
      'PRODUCT_UPDATED',
      'PRODUCT_DEACTIVATED',
      'PRODUCT_ACTIVATED',
    ])
  }, 60_000)
})
