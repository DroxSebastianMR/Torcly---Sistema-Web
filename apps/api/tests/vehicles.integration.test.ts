import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { databaseService } from '../src/infrastructure/database/prisma.service.js'
import { hashPassword } from '../src/modules/auth/password.js'

const runDatabaseTests = process.env.DATABASE_TESTS === 'true'
const describeWithDatabase = describe.runIf(runDatabaseTests)

describeWithDatabase('Vehículos integrados con PostgreSQL', () => {
  const app = createApp()
  const suffix = randomUUID().slice(0, 8)
  const password = `Clave-vehiculos-${suffix}!`
  const documentNumber = `87654${suffix.slice(0, 3)}`
  const plate = `ABC${suffix.slice(0, 5).toUpperCase()}`

  const adminOrder = { roleCode: `admin-vehicles-${suffix}` }
  const readerOrder = { roleCode: `reader-vehicles-${suffix}` }
  const noAccessOrder = { roleCode: `no-vehicles-${suffix}` }

  const identity = {
    username: `admin_v_${suffix}`,
    email: `admin_v_${suffix}@torcly.local`,
    name: `Admin Vehículos ${suffix}`,
  }
  const readerIdentity = {
    username: `reader_v_${suffix}`,
    email: `reader_v_${suffix}@torcly.local`,
    name: `Lector Vehículos ${suffix}`,
  }
  const noAccessIdentity = {
    username: `none_v_${suffix}`,
    email: `none_v_${suffix}@torcly.local`,
    name: `Sin acceso ${suffix}`,
  }

  const adminIds = { userId: '', roleId: '' }
  const readerIds = { userId: '', roleId: '' }
  const noAccessIds = { userId: '', roleId: '' }
  const createdIds = { vehicleId: '', customerId: '' }
  const cleanupRoleIds: string[] = []
  let sharedPasswordHash = ''

  beforeAll(async () => {
    await databaseService.connect()
    sharedPasswordHash = await hashPassword(password)

    const [readPermission, writePermission] = await Promise.all([
      databaseService.client.permission.upsert({
        where: { code: 'vehicles:read' },
        create: {
          code: 'vehicles:read',
          description: 'Solo lectura de vehículos',
        },
        update: {},
      }),
      databaseService.client.permission.upsert({
        where: { code: 'vehicles:write' },
        create: {
          code: 'vehicles:write',
          description: 'Escritura de vehículos',
        },
        update: {},
      }),
    ])

    const [adminRole, readerRole, noAccessRole] = await Promise.all([
      databaseService.client.role.create({
        data: {
          code: adminOrder.roleCode,
          name: 'Administrador de vehículos',
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
          name: 'Lector de vehículos',
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

    const customer = await databaseService.client.customer.create({
      data: {
        type: 'NATURAL',
        documentNumber,
        firstName: 'María',
        lastName: 'Pérez',
        phone: '987654321',
      },
    })

    Object.assign(adminIds, { userId: admin.id, roleId: adminRole.id })
    Object.assign(readerIds, { userId: reader.id, roleId: readerRole.id })
    Object.assign(noAccessIds, {
      userId: noAccess.id,
      roleId: noAccessRole.id,
    })
    createdIds.customerId = customer.id
    cleanupRoleIds.push(adminRole.id, readerRole.id, noAccessRole.id)
  }, 60_000)

  afterAll(async () => {
    const userIds = [
      adminIds.userId,
      readerIds.userId,
      noAccessIds.userId,
    ].filter(Boolean)

    await databaseService.client.vehicle.deleteMany({
      where: { plate: { in: [plate, 'ABC123'] } },
    })
    await databaseService.client.auditLog.deleteMany({
      where: { identifier: { in: [plate, documentNumber] } },
    })
    await databaseService.client.customer.deleteMany({
      where: { id: createdIds.customerId },
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
    const denied = await noAccessAgent.get('/api/v1/vehicles')
    expect(denied.status).toBe(403)
    expect(denied.body.error.code).toBe('AUTH_FORBIDDEN')

    const readerAgent = request.agent(app)
    await readerAgent.post('/api/v1/auth/login').send({
      identifier: readerIdentity.username,
      password,
    })
    const listed = await readerAgent.get('/api/v1/vehicles')
    expect(listed.status).toBe(200)

    const written = await readerAgent.post('/api/v1/vehicles').send({
      plate: 'XYZ789',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2021,
      customerId: createdIds.customerId,
    })
    expect(written.status).toBe(403)
    expect(written.body.error.code).toBe('AUTH_FORBIDDEN')
  }, 60_000)

  it('crea un vehículo normalizando la placa y rechaza duplicados equivalentes', async () => {
    const adminAgent = request.agent(app)
    await adminAgent.post('/api/v1/auth/login').send({
      identifier: identity.username,
      password,
    })

    const created = await adminAgent.post('/api/v1/vehicles').send({
      plate: `abc-${suffix.slice(0, 5)}`,
      brand: 'Toyota',
      model: 'Corolla',
      year: 2021,
      customerId: createdIds.customerId,
    })
    expect(created.status).toBe(201)
    expect(created.body.data.plate).toBe(plate)
    expect(created.body.data.year).toBe(2021)
    expect(created.body.data.owner.documentNumber).toBe(documentNumber)
    createdIds.vehicleId = created.body.data.id

    const duplicate = await adminAgent.post('/api/v1/vehicles').send({
      plate,
      brand: 'Toyota',
      model: 'Corolla',
      year: 2021,
      customerId: createdIds.customerId,
    })
    expect(duplicate.status).toBe(409)
    expect(duplicate.body.error.code).toBe('VEHICLE_PLATE_DUPLICATE')
  }, 60_000)

  it('rechaza placa inválida, año fuera de rango y propietario inexistente', async () => {
    const adminAgent = request.agent(app)
    await adminAgent.post('/api/v1/auth/login').send({
      identifier: identity.email,
      password,
    })

    const badPlate = await adminAgent.post('/api/v1/vehicles').send({
      plate: 'A1',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2021,
      customerId: createdIds.customerId,
    })
    expect(badPlate.status).toBe(400)
    expect(badPlate.body.error.code).toBe('VALIDATION_ERROR')

    const badYear = await adminAgent.post('/api/v1/vehicles').send({
      plate: 'XYZ789',
      brand: 'Toyota',
      model: 'Corolla',
      year: 1800,
      customerId: createdIds.customerId,
    })
    expect(badYear.status).toBe(400)
    expect(badYear.body.error.code).toBe('VALIDATION_ERROR')

    const missingOwner = await adminAgent.post('/api/v1/vehicles').send({
      plate: 'XYZ789',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2021,
      customerId: '6f7c8d9e-4f1b-8a2c-4f1b-2c3d4e5f6a7b',
    })
    expect(missingOwner.status).toBe(404)
    expect(missingOwner.body.error.code).toBe('CUSTOMER_NOT_FOUND')
  }, 60_000)

  it('busca por placa, propietario y filtro de cliente', async () => {
    const adminAgent = request.agent(app)
    await adminAgent.post('/api/v1/auth/login').send({
      identifier: identity.username,
      password,
    })

    const byPlate = await adminAgent.get(
      `/api/v1/vehicles?search=abc&pageSize=50`,
    )
    expect(byPlate.status).toBe(200)
    expect(
      byPlate.body.data.some(
        (v: { id: string }) => v.id === createdIds.vehicleId,
      ),
    ).toBe(true)

    const byOwner = await adminAgent.get(
      `/api/v1/vehicles?search=Mar%C3%ADa%20P%C3%A9rez&pageSize=50`,
    )
    expect(byOwner.status).toBe(200)
    expect(
      byOwner.body.data.some(
        (v: { id: string }) => v.id === createdIds.vehicleId,
      ),
    ).toBe(true)

    const byDocument = await adminAgent.get(
      `/api/v1/vehicles?search=${documentNumber}&pageSize=50`,
    )
    expect(byDocument.status).toBe(200)
    expect(
      byDocument.body.data.some(
        (v: { id: string }) => v.id === createdIds.vehicleId,
      ),
    ).toBe(true)

    const byCustomer = await adminAgent.get(
      `/api/v1/vehicles?customerId=${createdIds.customerId}&pageSize=50`,
    )
    expect(byCustomer.status).toBe(200)
    expect(byCustomer.body.data).toHaveLength(1)
    expect(byCustomer.body.data[0].customerId).toBe(createdIds.customerId)

    const noResults = await adminAgent.get(
      `/api/v1/vehicles?search=no-existe-${suffix}`,
    )
    expect(noResults.status).toBe(200)
    expect(noResults.body.data).toEqual([])
  }, 60_000)

  it('consulta el detalle, actualiza sin cambiar propietario y registra auditoría', async () => {
    const adminAgent = request.agent(app)
    await adminAgent.post('/api/v1/auth/login').send({
      identifier: identity.username,
      password,
    })

    const detail = await adminAgent.get(
      `/api/v1/vehicles/${createdIds.vehicleId}`,
    )
    expect(detail.status).toBe(200)
    expect(detail.body.data.plate).toBe(plate)
    expect(detail.body.data.owner.documentNumber).toBe(documentNumber)

    const updated = await adminAgent
      .put(`/api/v1/vehicles/${createdIds.vehicleId}`)
      .send({
        plate: `abc-${suffix.slice(0, 5)}`,
        brand: 'Hyundai',
        model: 'Tucson',
        year: 2023,
      })
    expect(updated.status).toBe(200)
    expect(updated.body.data.brand).toBe('Hyundai')
    expect(updated.body.data.year).toBe(2023)
    expect(updated.body.data.owner.documentNumber).toBe(documentNumber)

    const withOwnerChange = await adminAgent
      .put(`/api/v1/vehicles/${createdIds.vehicleId}`)
      .send({
        plate: `abc-${suffix.slice(0, 5)}`,
        brand: 'Hyundai',
        model: 'Tucson',
        year: 2023,
        customerId: '6f7c8d9e-4f1b-8a2c-4f1b-2c3d4e5f6a7b',
      })
    expect(withOwnerChange.status).toBe(200)
    expect(withOwnerChange.body.data.customerId).toBe(createdIds.customerId)

    const notFound = await adminAgent.get(
      '/api/v1/vehicles/2b8a4c19-9d3e-4f1b-8a2c-4f1b2c3d4e5f',
    )
    expect(notFound.status).toBe(404)
    expect(notFound.body.error.code).toBe('VEHICLE_NOT_FOUND')

    const events = await databaseService.client.auditLog.findMany({
      where: { identifier: plate },
      orderBy: { createdAt: 'asc' },
    })
    expect(events.map((event) => event.event)).toEqual([
      'VEHICLE_CREATED',
      'VEHICLE_UPDATED',
      'VEHICLE_UPDATED',
    ])
  }, 60_000)
})
