import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { databaseService } from '../src/infrastructure/database/prisma.service.js'
import { hashPassword } from '../src/modules/auth/password.js'

const runDatabaseTests = process.env.DATABASE_TESTS === 'true'
const describeWithDatabase = describe.runIf(runDatabaseTests)

const pad = (value: number) => String(value).padStart(2, '0')

function isoInDays(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

describeWithDatabase('Citas integradas con PostgreSQL', () => {
  const app = createApp()
  const suffix = randomUUID().slice(0, 8)
  const password = `Clave-cit-${suffix}!`

  const adminOrder = { roleCode: `admin-citas-${suffix}` }
  const readerOrder = { roleCode: `reader-citas-${suffix}` }
  const noAccessOrder = { roleCode: `no-citas-${suffix}` }

  const identity = {
    username: `admin_c_${suffix}`,
    email: `admin_c_${suffix}@torcly.local`,
    name: `Admin Citas ${suffix}`,
  }
  const readerIdentity = {
    username: `reader_c_${suffix}`,
    email: `reader_c_${suffix}@torcly.local`,
    name: `Lector Citas ${suffix}`,
  }
  const noAccessIdentity = {
    username: `none_c_${suffix}`,
    email: `none_c_${suffix}@torcly.local`,
    name: `Sin acceso citas ${suffix}`,
  }

  const adminIds = { userId: '', roleId: '' }
  const readerIds = { userId: '', roleId: '' }
  const noAccessIds = { userId: '', roleId: '' }
  const createdIds = {
    customerA: '',
    customerB: '',
    vehicleA: '',
    vehicleB: '',
    plateA: '',
    plateB: '',
  }
  const cleanupRoleIds: string[] = []
  const capacityVehicleIds: string[] = []
  let sharedPasswordHash = ''

  const capacityDate = isoInDays(20)
  const capacityTime = '12:30'

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
        where: { code: 'appointments:read' },
        create: {
          code: 'appointments:read',
          description: 'Solo lectura de citas',
        },
        update: {},
      }),
      databaseService.client.permission.upsert({
        where: { code: 'appointments:write' },
        create: {
          code: 'appointments:write',
          description: 'Registro de citas',
        },
        update: {},
      }),
    ])

    const [adminRole, readerRole, noAccessRole] = await Promise.all([
      databaseService.client.role.create({
        data: {
          code: adminOrder.roleCode,
          name: 'Administrador de citas',
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
          name: 'Lector de citas',
          permissions: { create: { permissionId: readPermission.id } },
        },
      }),
      databaseService.client.role.create({
        data: { code: noAccessOrder.roleCode, name: 'Sin acceso citas' },
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

    const customerA = await databaseService.client.customer.create({
      data: {
        type: 'NATURAL',
        documentNumber: `78${suffix.slice(0, 8)}`,
        firstName: `Cliente A ${suffix}`,
        lastName: 'Citas',
        phone: `900${suffix.slice(0, 6)}`,
        email: `cliente_a_${suffix}@torcly.local`,
      },
    })
    const customerB = await databaseService.client.customer.create({
      data: {
        type: 'LEGAL',
        documentNumber: `20${suffix.slice(0, 8)}`,
        legalName: `Empresa B ${suffix}`,
        phone: `901${suffix.slice(0, 6)}`,
        email: `cliente_b_${suffix}@torcly.local`,
      },
    })
    const vehicleA = await databaseService.client.vehicle.create({
      data: {
        plate: `A-${suffix.slice(0, 6).toUpperCase()}`,
        brand: 'Toyota',
        model: 'Corolla',
        year: 2020,
        customerId: customerA.id,
      },
    })
    const vehicleB = await databaseService.client.vehicle.create({
      data: {
        plate: `B-${suffix.slice(0, 6).toUpperCase()}`,
        brand: 'Hyundai',
        model: 'Accent',
        year: 2019,
        customerId: customerB.id,
      },
    })
    const capacityVehicles = await Promise.all(
      Array.from({ length: 8 }, (_, index) =>
        databaseService.client.vehicle.create({
          data: {
            plate: `C${index}-${suffix.slice(0, 5).toUpperCase()}`,
            brand: 'Toyota',
            model: `Corolla ${index + 1}`,
            year: 2020 + (index % 5),
            customerId: customerA.id,
          },
        }),
      ),
    )

    Object.assign(adminIds, { userId: admin.id, roleId: adminRole.id })
    Object.assign(readerIds, { userId: reader.id, roleId: readerRole.id })
    Object.assign(noAccessIds, { userId: noAccess.id, roleId: noAccessRole.id })
    Object.assign(createdIds, {
      customerA: customerA.id,
      customerB: customerB.id,
      vehicleA: vehicleA.id,
      vehicleB: vehicleB.id,
      plateA: vehicleA.plate,
      plateB: vehicleB.plate,
    })
    cleanupRoleIds.push(adminRole.id, readerRole.id, noAccessRole.id)
    capacityVehicleIds.push(...capacityVehicles.map((vehicle) => vehicle.id))
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
    await databaseService.client.appointment.deleteMany({
      where: {
        customerId: { in: [createdIds.customerA, createdIds.customerB] },
      },
    })
    await databaseService.client.vehicle.deleteMany({
      where: {
        customerId: { in: [createdIds.customerA, createdIds.customerB] },
      },
    })
    await databaseService.client.customer.deleteMany({
      where: { id: { in: [createdIds.customerA, createdIds.customerB] } },
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

  it('bloquea consultas y escritura sin el permiso correspondiente', async () => {
    const noAccessAgent = await loginAs(noAccessIdentity.username)
    const denied = await noAccessAgent.get('/api/v1/appointments')
    expect(denied.status).toBe(403)
    expect(denied.body.error.code).toBe('AUTH_FORBIDDEN')

    const readerAgent = await loginAs(readerIdentity.username)
    const listed = await readerAgent.get('/api/v1/appointments')
    expect(listed.status).toBe(200)

    const written = await readerAgent.post('/api/v1/appointments').send({
      customerId: createdIds.customerA,
      vehicleId: createdIds.vehicleA,
      date: isoInDays(5),
      time: '09:00',
      reason: 'Mantenimiento preventivo',
    })
    expect(written.status).toBe(403)
    expect(written.body.error.code).toBe('AUTH_FORBIDDEN')
  }, 60_000)

  it('crea una cita y registra su auditoría', async () => {
    const adminAgent = await loginAs(identity.username)
    const response = await adminAgent.post('/api/v1/appointments').send({
      customerId: createdIds.customerA,
      vehicleId: createdIds.vehicleA,
      date: isoInDays(10),
      time: '09:00',
      reason: 'Mantenimiento preventivo y cambio de aceite',
    })
    expect(response.status).toBe(201)
    expect(response.body.data.status).toBe('PROGRAMADA')
    expect(response.body.data.code).toMatch(/^CITA-\d{6}$/)
    expect(response.body.data.date).toBe(isoInDays(10))
    expect(response.body.data.time).toBe('09:00')
    expect(response.body.data.vehicle.plate).toMatch(/^A-/)
    expect(response.body.data.customer.documentNumber).toMatch(/^78/)
    expect(response.body.data.performedBy).toBe(identity.name)

    const detail = await adminAgent.get(
      `/api/v1/appointments/${response.body.data.id}`,
    )
    expect(detail.status).toBe(200)
    expect(detail.body.data.reason).toBe(
      'Mantenimiento preventivo y cambio de aceite',
    )

    const events = await databaseService.client.auditLog.findMany({
      where: { userId: adminIds.userId },
      orderBy: { createdAt: 'asc' },
    })
    expect(events.some((event) => event.event === 'APPOINTMENT_CREATED')).toBe(
      true,
    )
  }, 60_000)

  it('rechaza un vehículo que no pertenece al cliente', async () => {
    const adminAgent = await loginAs(identity.username)
    const response = await adminAgent.post('/api/v1/appointments').send({
      customerId: createdIds.customerA,
      vehicleId: createdIds.vehicleB,
      date: isoInDays(10),
      time: '10:00',
      reason: 'Revisión de frenos',
    })
    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('APPOINTMENT_VEHICLE_INVALID')
  }, 60_000)

  it('rechaza fechas y horas pasadas', async () => {
    const adminAgent = await loginAs(identity.username)
    const pastDate = await adminAgent.post('/api/v1/appointments').send({
      customerId: createdIds.customerA,
      vehicleId: createdIds.vehicleA,
      date: isoInDays(-1),
      time: '10:00',
      reason: 'Cita con fecha pasada',
    })
    expect(pastDate.status).toBe(400)
    expect(pastDate.body.error.code).toBe('APPOINTMENT_PAST_DATE')

    const pastTime = await adminAgent.post('/api/v1/appointments').send({
      customerId: createdIds.customerA,
      vehicleId: createdIds.vehicleA,
      date: isoInDays(0),
      time: '00:00',
      reason: 'Cita con hora pasada',
    })
    expect(pastTime.status).toBe(400)
    expect(pastTime.body.error.code).toBe('APPOINTMENT_PAST_TIME')
  }, 60_000)

  it('aplica la capacidad de 8 citas activas y la libera al cancelar', async () => {
    const adminAgent = await loginAs(identity.username)
    const payload = {
      customerId: createdIds.customerA,
      vehicleId: createdIds.vehicleA,
      date: capacityDate,
      time: capacityTime,
      reason: 'Cita de capacidad',
    }

    for (let index = 0; index < capacityVehicleIds.length; index += 1) {
      const created = await adminAgent
        .post('/api/v1/appointments')
        .send({ ...payload, vehicleId: capacityVehicleIds[index] })
      expect(created.status).toBe(201)
    }

    const ninth = await adminAgent.post('/api/v1/appointments').send(payload)
    expect(ninth.status).toBe(409)
    expect(ninth.body.error.code).toBe('APPOINTMENT_SLOT_FULL')

    const listed = await adminAgent.get(
      `/api/v1/appointments?date=${capacityDate}`,
    )
    expect(listed.body.data).toHaveLength(8)

    const toCancel = listed.body.data[0]
    const cancelled = await adminAgent.post(
      `/api/v1/appointments/${toCancel.id}/cancel`,
    )
    expect(cancelled.status).toBe(200)
    expect(cancelled.body.data.status).toBe('CANCELADA')
    expect(cancelled.body.data.cancelledBy).toBe(identity.name)

    const afterCancel = await adminAgent.post('/api/v1/appointments').send({
      ...payload,
      reason: 'Cita tras cancelar una',
    })
    expect(afterCancel.status).toBe(201)
  }, 60_000)

  it('rechaza dos citas del mismo vehículo en la misma fecha y hora', async () => {
    const adminAgent = await loginAs(identity.username)
    const payload = {
      customerId: createdIds.customerB,
      vehicleId: createdIds.vehicleB,
      date: isoInDays(21),
      time: '13:00',
      reason: 'Diagnóstico de dirección',
    }

    const first = await adminAgent.post('/api/v1/appointments').send(payload)
    expect(first.status).toBe(201)

    const duplicate = await adminAgent
      .post('/api/v1/appointments')
      .send({ ...payload, reason: 'Segundo intento simultáneo' })
    expect(duplicate.status).toBe(409)
    expect(duplicate.body.error.code).toBe('APPOINTMENT_VEHICLE_BUSY')
  }, 60_000)

  it('reprograma a horarios libres y rechaza ocupados o cancelados', async () => {
    const adminAgent = await loginAs(identity.username)
    const created = await adminAgent.post('/api/v1/appointments').send({
      customerId: createdIds.customerB,
      vehicleId: createdIds.vehicleB,
      date: isoInDays(15),
      time: '08:00',
      reason: 'Revisión inicial',
    })
    expect(created.status).toBe(201)
    const id = created.body.data.id

    const rescheduled = await adminAgent
      .put(`/api/v1/appointments/${id}/reschedule`)
      .send({ date: isoInDays(16), time: '11:30' })
    expect(rescheduled.status).toBe(200)
    expect(rescheduled.body.data.date).toBe(isoInDays(16))
    expect(rescheduled.body.data.time).toBe('11:30')
    expect(rescheduled.body.data.rescheduledBy).toBe(identity.name)
    expect(rescheduled.body.data.rescheduledAt).toBeTruthy()

    const fullSlot = await adminAgent
      .put(`/api/v1/appointments/${id}/reschedule`)
      .send({ date: capacityDate, time: capacityTime })
    expect(fullSlot.status).toBe(409)
    expect(fullSlot.body.error.code).toBe('APPOINTMENT_SLOT_FULL')

    const past = await adminAgent
      .put(`/api/v1/appointments/${id}/reschedule`)
      .send({ date: isoInDays(-1), time: '10:00' })
    expect(past.status).toBe(400)
    expect(past.body.error.code).toBe('APPOINTMENT_PAST_DATE')

    const cancelled = await adminAgent.post(`/api/v1/appointments/${id}/cancel`)
    expect(cancelled.status).toBe(200)
    expect(cancelled.body.data.status).toBe('CANCELADA')

    const stillProgramada = await adminAgent.post(
      `/api/v1/appointments/${id}/cancel`,
    )
    expect(stillProgramada.status).toBe(409)
    expect(stillProgramada.body.error.code).toBe('APPOINTMENT_NOT_PROGRAMADA')

    const rescheduleCancelled = await adminAgent
      .put(`/api/v1/appointments/${id}/reschedule`)
      .send({ date: isoInDays(17), time: '09:00' })
    expect(rescheduleCancelled.status).toBe(409)
    expect(rescheduleCancelled.body.error.code).toBe(
      'APPOINTMENT_NOT_PROGRAMADA',
    )

    const events = await databaseService.client.auditLog.findMany({
      where: { userId: adminIds.userId },
      orderBy: { createdAt: 'desc' },
    })
    const codes = events.map((event) => event.event)
    expect(codes).toContain('APPOINTMENT_RESCHEDULED')
    expect(codes).toContain('APPOINTMENT_CANCELLED')
  }, 60_000)

  it('busca y filtra citas por cliente, fecha y estado', async () => {
    const adminAgent = await loginAs(identity.username)
    const byPlate = await adminAgent.get(
      `/api/v1/appointments?search=${createdIds.plateB}`,
    )
    expect(byPlate.status).toBe(200)
    expect(
      byPlate.body.data.every(
        (item: { vehicle: { plate: string } }) =>
          item.vehicle.plate === createdIds.plateB,
      ),
    ).toBe(true)

    const byDate = await adminAgent.get(
      `/api/v1/appointments?date=${capacityDate}&status=all`,
    )
    expect(byDate.status).toBe(200)
    expect(
      byDate.body.data.every(
        (item: { date: string }) => item.date === capacityDate,
      ),
    ).toBe(true)

    const byCustomer = await adminAgent.get(
      `/api/v1/appointments?customerId=${createdIds.customerB}`,
    )
    expect(byCustomer.status).toBe(200)
    expect(
      byCustomer.body.data.every(
        (item: { customer: { id: string } }) =>
          item.customer.id === createdIds.customerB,
      ),
    ).toBe(true)

    const cancelled = await adminAgent.get(
      '/api/v1/appointments?status=CANCELADA',
    )
    expect(cancelled.status).toBe(200)
    expect(
      cancelled.body.data.every(
        (item: { status: string }) => item.status === 'CANCELADA',
      ),
    ).toBe(true)
    expect(cancelled.body.data.length).toBeGreaterThanOrEqual(1)

    const summary = await adminAgent.get('/api/v1/appointments?status=all')
    expect(summary.status).toBe(200)
    expect(summary.body.summary).toMatchObject({
      total: expect.any(Number),
      programadas: expect.any(Number),
      canceladas: expect.any(Number),
      hoy: expect.any(Number),
    })
  }, 60_000)
})
