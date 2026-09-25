import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { databaseService } from '../src/infrastructure/database/prisma.service.js'
import { hashPassword } from '../src/modules/auth/password.js'

const runDatabaseTests = process.env.DATABASE_TESTS === 'true'
const describeWithDatabase = describe.runIf(runDatabaseTests)

describeWithDatabase('Clientes integrados con PostgreSQL', () => {
  const app = createApp()
  const suffix = randomUUID().slice(0, 8)
  const password = `Clave-clientes-${suffix}!`
  const documentNumber = `12345${suffix.slice(0, 3)}`
  const ruc = `20123${suffix.slice(0, 6)}`

  const adminOrder = { roleCode: `admin-customers-${suffix}` }
  const readerOrder = { roleCode: `reader-customers-${suffix}` }
  const noAccessOrder = { roleCode: `no-customers-${suffix}` }

  const identity = {
    username: `admin_c_${suffix}`,
    email: `admin_c_${suffix}@torcly.local`,
    name: `Admin Clientes ${suffix}`,
  }
  const readerIdentity = {
    username: `reader_c_${suffix}`,
    email: `reader_c_${suffix}@torcly.local`,
    name: `Lector Clientes ${suffix}`,
  }
  const noAccessIdentity = {
    username: `none_c_${suffix}`,
    email: `none_c_${suffix}@torcly.local`,
    name: `Sin acceso ${suffix}`,
  }

  const adminIds = { userId: '', roleId: '' }
  const readerIds = { userId: '', roleId: '' }
  const noAccessIds = { userId: '', roleId: '' }
  const createdIds = { naturalId: '', legalId: '' }
  const cleanupRoleIds: string[] = []
  let sharedPasswordHash = ''

  beforeAll(async () => {
    await databaseService.connect()
    sharedPasswordHash = await hashPassword(password)

    const [readPermission, writePermission] = await Promise.all([
      databaseService.client.permission.upsert({
        where: { code: 'customers:read' },
        create: {
          code: 'customers:read',
          description: 'Solo lectura de clientes',
        },
        update: {},
      }),
      databaseService.client.permission.upsert({
        where: { code: 'customers:write' },
        create: {
          code: 'customers:write',
          description: 'Escritura de clientes',
        },
        update: {},
      }),
    ])

    const [adminRole, readerRole, noAccessRole] = await Promise.all([
      databaseService.client.role.create({
        data: {
          code: adminOrder.roleCode,
          name: 'Administrador de clientes',
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
          name: 'Lector de clientes',
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
      where: { identifier: { in: [documentNumber, ruc] } },
    })
    await databaseService.client.customer.deleteMany({
      where: {
        id: { in: [createdIds.naturalId, createdIds.legalId].filter(Boolean) },
      },
    })
    await databaseService.client.auditLog.deleteMany({
      where: { userId: { in: userIds } },
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
    const denied = await noAccessAgent.get('/api/v1/customers')
    expect(denied.status).toBe(403)
    expect(denied.body.error.code).toBe('AUTH_FORBIDDEN')

    const readerAgent = request.agent(app)
    await readerAgent.post('/api/v1/auth/login').send({
      identifier: readerIdentity.username,
      password,
    })
    const listed = await readerAgent.get('/api/v1/customers')
    expect(listed.status).toBe(200)

    const written = await readerAgent.post('/api/v1/customers').send({
      type: 'NATURAL',
      documentNumber,
      firstName: 'María',
      lastName: 'Pérez',
      phone: '987654321',
    })
    expect(written.status).toBe(403)
    expect(written.body.error.code).toBe('AUTH_FORBIDDEN')
  }, 60_000)

  it('crea persona natural, rechaza DNI inválido y documento duplicado', async () => {
    const adminAgent = request.agent(app)
    await adminAgent.post('/api/v1/auth/login').send({
      identifier: identity.email,
      password,
    })

    const created = await adminAgent.post('/api/v1/customers').send({
      type: 'NATURAL',
      documentNumber,
      firstName: 'María',
      lastName: 'Pérez',
      phone: '987654321',
      email: `Maria_${suffix}@Torcly.Local`,
    })
    expect(created.status).toBe(201)
    expect(created.body.data.type).toBe('NATURAL')
    expect(created.body.data.documentNumber).toBe(documentNumber)
    expect(created.body.data.email).toBe(`maria_${suffix}@torcly.local`)
    createdIds.naturalId = created.body.data.id

    const invalidDni = await adminAgent.post('/api/v1/customers').send({
      type: 'NATURAL',
      documentNumber: '123',
      firstName: 'Juan',
      lastName: 'López',
      phone: '987654322',
    })
    expect(invalidDni.status).toBe(400)
    expect(invalidDni.body.error.code).toBe('VALIDATION_ERROR')

    const duplicate = await adminAgent.post('/api/v1/customers').send({
      type: 'NATURAL',
      documentNumber,
      firstName: 'Otra',
      lastName: 'Persona',
      phone: '987654323',
    })
    expect(duplicate.status).toBe(409)
    expect(duplicate.body.error.code).toBe('CUSTOMER_DOCUMENT_DUPLICATE')
  }, 60_000)

  it('crea persona jurídica y busca por documento, nombre y teléfono', async () => {
    const adminAgent = request.agent(app)
    await adminAgent.post('/api/v1/auth/login').send({
      identifier: identity.username,
      password,
    })

    const created = await adminAgent.post('/api/v1/customers').send({
      type: 'LEGAL',
      documentNumber: ruc,
      legalName: `Torcly Repuestos ${suffix} S.A.C.`,
      phone: '+51987456123',
    })
    expect(created.status).toBe(201)
    expect(created.body.data.legalName).toBe(
      `Torcly Repuestos ${suffix} S.A.C.`,
    )
    createdIds.legalId = created.body.data.id

    const byDocument = await adminAgent.get(
      `/api/v1/customers?search=${ruc}&pageSize=50`,
    )
    expect(byDocument.status).toBe(200)
    expect(byDocument.body.data).toHaveLength(1)
    expect(byDocument.body.data[0].documentNumber).toBe(ruc)

    const byName = await adminAgent.get(
      `/api/v1/customers?search=Repuestos%20${suffix}&pageSize=50`,
    )
    expect(byName.status).toBe(200)
    expect(
      byName.body.data.some((c: { id: string }) => c.id === createdIds.legalId),
    ).toBe(true)

    const byPhone = await adminAgent.get(
      `/api/v1/customers?search=9874561&pageSize=50`,
    )
    expect(byPhone.status).toBe(200)
    expect(
      byPhone.body.data.some(
        (c: { phone: string }) => c.phone === '+51987456123',
      ),
    ).toBe(true)

    const byType = await adminAgent.get(
      `/api/v1/customers?type=LEGAL&pageSize=50`,
    )
    expect(byType.status).toBe(200)
    expect(
      byType.body.data.every((c: { type: string }) => c.type === 'LEGAL'),
    ).toBe(true)

    const noResults = await adminAgent.get(
      `/api/v1/customers?search=no-existe-${suffix}`,
    )
    expect(noResults.status).toBe(200)
    expect(noResults.body.data).toEqual([])
  }, 60_000)

  it('consulta el detalle, actualiza con validación y registra auditoría', async () => {
    const adminAgent = request.agent(app)
    await adminAgent.post('/api/v1/auth/login').send({
      identifier: identity.username,
      password,
    })

    const detail = await adminAgent.get(
      `/api/v1/customers/${createdIds.naturalId}`,
    )
    expect(detail.status).toBe(200)
    expect(detail.body.data.firstName).toBe('María')
    expect(detail.body.data.legalName).toBeNull()

    const updated = await adminAgent
      .put(`/api/v1/customers/${createdIds.naturalId}`)
      .send({
        type: 'NATURAL',
        documentNumber,
        firstName: 'María Fernanda',
        lastName: 'Pérez',
        phone: '912345678',
        email: 'actualizado@torcly.local',
      })
    expect(updated.status).toBe(200)
    expect(updated.body.data.firstName).toBe('María Fernanda')
    expect(updated.body.data.phone).toBe('912345678')

    const badPhone = await adminAgent
      .put(`/api/v1/customers/${createdIds.naturalId}`)
      .send({
        type: 'NATURAL',
        documentNumber,
        firstName: 'María',
        lastName: 'Pérez',
        phone: 'no-valido',
      })
    expect(badPhone.status).toBe(400)

    const notFound = await adminAgent.get(
      '/api/v1/customers/2b8a4c19-9d3e-4f1b-8a2c-4f1b2c3d4e5f',
    )
    expect(notFound.status).toBe(404)
    expect(notFound.body.error.code).toBe('CUSTOMER_NOT_FOUND')

    const events = await databaseService.client.auditLog.findMany({
      where: { identifier: documentNumber },
      orderBy: { createdAt: 'asc' },
    })
    expect(events.map((event) => event.event)).toEqual([
      'CUSTOMER_CREATED',
      'CUSTOMER_UPDATED',
    ])
  }, 60_000)
})
