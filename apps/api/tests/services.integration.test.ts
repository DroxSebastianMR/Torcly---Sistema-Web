import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { databaseService } from '../src/infrastructure/database/prisma.service.js'
import { hashPassword } from '../src/modules/auth/password.js'

const runDatabaseTests = process.env.DATABASE_TESTS === 'true'
const describeWithDatabase = describe.runIf(runDatabaseTests)

describeWithDatabase('Servicios integrados con PostgreSQL', () => {
  const app = createApp()
  const suffix = randomUUID().slice(0, 8)
  const password = `Clave-srv-${suffix}!`
  const code = `SVC-${suffix.slice(0, 6).toUpperCase()}`
  const codePrefix = `SVC-${suffix.slice(0, 6).toUpperCase()}`
  const updatedPrice = 49.9

  const adminOrder = { roleCode: `admin-services-${suffix}` }
  const readerOrder = { roleCode: `reader-services-${suffix}` }
  const noAccessOrder = { roleCode: `no-services-${suffix}` }

  const identity = {
    username: `admin_s_${suffix}`,
    email: `admin_s_${suffix}@torcly.local`,
    name: `Admin Servicios ${suffix}`,
  }
  const readerIdentity = {
    username: `reader_s_${suffix}`,
    email: `reader_s_${suffix}@torcly.local`,
    name: `Lector Servicios ${suffix}`,
  }
  const noAccessIdentity = {
    username: `none_s_${suffix}`,
    email: `none_s_${suffix}@torcly.local`,
    name: `Sin acceso ${suffix}`,
  }

  const adminIds = { userId: '', roleId: '' }
  const readerIds = { userId: '', roleId: '' }
  const noAccessIds = { userId: '', roleId: '' }
  const createdService = { serviceId: '' }
  const cleanupRoleIds: string[] = []
  let sharedPasswordHash = ''

  beforeAll(async () => {
    await databaseService.connect()
    sharedPasswordHash = await hashPassword(password)

    const [readPermission, writePermission] = await Promise.all([
      databaseService.client.permission.upsert({
        where: { code: 'services:read' },
        create: {
          code: 'services:read',
          description: 'Solo lectura de servicios',
        },
        update: {},
      }),
      databaseService.client.permission.upsert({
        where: { code: 'services:write' },
        create: {
          code: 'services:write',
          description: 'Escritura de servicios',
        },
        update: {},
      }),
    ])

    const [adminRole, readerRole, noAccessRole] = await Promise.all([
      databaseService.client.role.create({
        data: {
          code: adminOrder.roleCode,
          name: 'Administrador de servicios',
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
          name: 'Lector de servicios',
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

    Object.assign(adminIds, { userId: admin.id, roleId: adminRole.id })
    Object.assign(readerIds, { userId: reader.id, roleId: readerRole.id })
    Object.assign(noAccessIds, {
      userId: noAccess.id,
      roleId: noAccessRole.id,
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
          { identifier: { startsWith: codePrefix } },
          { userId: { in: userIds } },
        ],
      },
    })
    await databaseService.client.service.deleteMany({
      where: { code: { startsWith: codePrefix } },
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
    const denied = await noAccessAgent.get('/api/v1/services')
    expect(denied.status).toBe(403)
    expect(denied.body.error.code).toBe('AUTH_FORBIDDEN')

    const readerAgent = request.agent(app)
    await readerAgent.post('/api/v1/auth/login').send({
      identifier: readerIdentity.username,
      password,
    })
    const listed = await readerAgent.get('/api/v1/services')
    expect(listed.status).toBe(200)

    const written = await readerAgent.post('/api/v1/services').send({
      code: `SVC-X-${suffix}`,
      name: 'Cambio de aceite',
      price: 35.5,
    })
    expect(written.status).toBe(403)
    expect(written.body.error.code).toBe('AUTH_FORBIDDEN')
  }, 60_000)

  it('crea un servicio normalizando el código y rechaza duplicados', async () => {
    const adminAgent = request.agent(app)
    await adminAgent.post('/api/v1/auth/login').send({
      identifier: identity.username,
      password,
    })

    const created = await adminAgent.post('/api/v1/services').send({
      code: code.toLowerCase(),
      name: 'Cambio de aceite y filtros',
      description: 'Mantenimiento preventivo completo',
      price: 35.5,
    })
    expect(created.status).toBe(201)
    expect(created.body.data.code).toBe(code)
    expect(created.body.data.price).toBe(35.5)
    expect(created.body.data.name).toBe('Cambio de aceite y filtros')
    createdService.serviceId = created.body.data.id

    const duplicate = await adminAgent.post('/api/v1/services').send({
      code,
      name: 'Servicio duplicado',
      price: 35.5,
    })
    expect(duplicate.status).toBe(409)
    expect(duplicate.body.error.code).toBe('SERVICE_DUPLICATE')
  }, 60_000)

  it('rechaza campos desconocidos, precios negativos y payload incompleto', async () => {
    const adminAgent = request.agent(app)
    await adminAgent.post('/api/v1/auth/login').send({
      identifier: identity.username,
      password,
    })

    const unknownField = await adminAgent.post('/api/v1/services').send({
      code: `SVC-X-${suffix}`,
      name: 'Servicio',
      price: 10,
      stock: 100,
    })
    expect(unknownField.status).toBe(400)
    expect(unknownField.body.error.code).toBe('VALIDATION_ERROR')

    const negativePrice = await adminAgent.post('/api/v1/services').send({
      code: `SVC-X-${suffix}`,
      name: 'Servicio',
      price: -1,
    })
    expect(negativePrice.status).toBe(400)
    expect(negativePrice.body.error.code).toBe('VALIDATION_ERROR')

    const missingFields = await adminAgent.post('/api/v1/services').send({
      code: `SVC-X-${suffix}`,
    })
    expect(missingFields.status).toBe(400)
    expect(missingFields.body.error.code).toBe('VALIDATION_ERROR')
  }, 60_000)

  it('busca servicios y expone solo activos en opciones', async () => {
    const adminAgent = request.agent(app)
    await adminAgent.post('/api/v1/auth/login').send({
      identifier: identity.username,
      password,
    })

    const byCode = await adminAgent.get(`/api/v1/services?search=${code}`)
    expect(byCode.status).toBe(200)
    expect(byCode.body.data).toHaveLength(1)
    expect(byCode.body.data[0].id).toBe(createdService.serviceId)

    const noResults = await adminAgent.get(
      `/api/v1/services?search=no-existe-${suffix}`,
    )
    expect(noResults.status).toBe(200)
    expect(noResults.body.data).toEqual([])

    const options = await adminAgent.get('/api/v1/services/options')
    expect(options.status).toBe(200)
    expect(
      options.body.data.some(
        (s: { id: string }) => s.id === createdService.serviceId,
      ),
    ).toBe(true)
  }, 60_000)

  it('consulta el detalle, actualiza el precio y registra auditoría', async () => {
    const adminAgent = request.agent(app)
    await adminAgent.post('/api/v1/auth/login').send({
      identifier: identity.username,
      password,
    })

    const detail = await adminAgent.get(
      `/api/v1/services/${createdService.serviceId}`,
    )
    expect(detail.status).toBe(200)
    expect(detail.body.data.code).toBe(code)
    expect(detail.body.data.price).toBe(35.5)

    const updated = await adminAgent
      .put(`/api/v1/services/${createdService.serviceId}`)
      .send({
        code: code.toLowerCase(),
        name: 'Cambio de aceite premium',
        description: 'Con aceite sintético',
        price: updatedPrice,
      })
    expect(updated.status).toBe(200)
    expect(updated.body.data.price).toBe(updatedPrice)
    expect(updated.body.data.name).toBe('Cambio de aceite premium')

    const events = await databaseService.client.auditLog.findMany({
      where: { identifier: code },
      orderBy: { createdAt: 'asc' },
    })
    expect(events.map((event) => event.event)).toEqual([
      'SERVICE_CREATED',
      'SERVICE_UPDATED',
    ])
    expect(
      events.some(
        (event) =>
          event.event === 'SERVICE_UPDATED' &&
          (event.metadata as { price?: number }).price === updatedPrice,
      ),
    ).toBe(true)
  }, 60_000)

  it('desactiva sin borrar y excluye de opciones, luego reactiva', async () => {
    const adminAgent = request.agent(app)
    await adminAgent.post('/api/v1/auth/login').send({
      identifier: identity.username,
      password,
    })

    const deactivated = await adminAgent
      .patch(`/api/v1/services/${createdService.serviceId}/status`)
      .send({ active: false })
    expect(deactivated.status).toBe(200)
    expect(deactivated.body.data.active).toBe(false)

    const stillListed = await adminAgent.get(
      `/api/v1/services?search=${code}&status=all`,
    )
    expect(stillListed.status).toBe(200)
    expect(stillListed.body.data).toHaveLength(1)
    expect(stillListed.body.data[0].active).toBe(false)

    const excludedFromActive = await adminAgent.get(
      `/api/v1/services?search=${code}&status=active`,
    )
    expect(excludedFromActive.status).toBe(200)
    expect(excludedFromActive.body.data).toEqual([])

    const options = await adminAgent.get('/api/v1/services/options')
    expect(options.status).toBe(200)
    expect(
      options.body.data.some(
        (s: { id: string }) => s.id === createdService.serviceId,
      ),
    ).toBe(false)

    const reactivated = await adminAgent
      .patch(`/api/v1/services/${createdService.serviceId}/status`)
      .send({ active: true })
    expect(reactivated.status).toBe(200)
    expect(reactivated.body.data.active).toBe(true)

    const events = await databaseService.client.auditLog.findMany({
      where: { identifier: code },
      orderBy: { createdAt: 'asc' },
    })
    expect(events.map((event) => event.event)).toEqual([
      'SERVICE_CREATED',
      'SERVICE_UPDATED',
      'SERVICE_DEACTIVATED',
      'SERVICE_ACTIVATED',
    ])
  }, 60_000)

  it('informa servicios inexistentes al actualizar y desactivar', async () => {
    const adminAgent = request.agent(app)
    await adminAgent.post('/api/v1/auth/login').send({
      identifier: identity.username,
      password,
    })

    const missing = await adminAgent
      .put(`/api/v1/services/${randomUUID()}`)
      .send({
        code: codePrefix,
        name: 'Servicio',
        price: 10,
      })
    expect(missing.status).toBe(404)
    expect(missing.body.error.code).toBe('SERVICE_NOT_FOUND')

    const status = await adminAgent
      .patch(`/api/v1/services/${randomUUID()}/status`)
      .send({ active: false })
    expect(status.status).toBe(404)
    expect(status.body.error.code).toBe('SERVICE_NOT_FOUND')
  }, 60_000)
})
