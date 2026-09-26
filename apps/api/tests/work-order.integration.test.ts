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

describeWithDatabase('Órdenes de taller integradas con PostgreSQL', () => {
  const app = createApp()
  const suffix = randomUUID().slice(0, 8)
  const password = `Clave-ot-${suffix}!`

  const adminOrder = { roleCode: `admin-ot-${suffix}` }
  const readerOrder = { roleCode: `reader-ot-${suffix}` }
  const noAccessOrder = { roleCode: `no-ot-${suffix}` }

  const identity = {
    username: `admin_ot_${suffix}`,
    email: `admin_ot_${suffix}@torcly.local`,
    name: `Admin OT ${suffix}`,
  }
  const readerIdentity = {
    username: `reader_ot_${suffix}`,
    email: `reader_ot_${suffix}@torcly.local`,
    name: `Lector OT ${suffix}`,
  }
  const noAccessIdentity = {
    username: `none_ot_${suffix}`,
    email: `none_ot_${suffix}@torcly.local`,
    name: `Sin acceso OT ${suffix}`,
  }
  const technicianIdentity = {
    username: `tech_ot_${suffix}`,
    email: `tech_ot_${suffix}@torcly.local`,
    name: `Técnico OT ${suffix}`,
  }
  const inactiveTechIdentity = {
    username: `inactive_ot_${suffix}`,
    email: `inactive_ot_${suffix}@torcly.local`,
    name: `Técnico inactivo OT ${suffix}`,
  }

  const adminIds = { userId: '', roleId: '' }
  const readerIds = { userId: '', roleId: '' }
  const noAccessIds = { userId: '', roleId: '' }
  const technicianUserId = { id: '' }
  const inactiveTechUserId = { id: '' }
  const state = {
    customerId: '',
    vehicleAId: '',
    vehicleBId: '',
    productActiveId: '',
    productInactiveId: '',
    serviceId: '',
    order1Id: '',
    order2Id: '',
    order3Id: '',
    appointmentCancelledId: '',
  }
  const cleanupRoleIds: string[] = []
  let sharedPasswordHash = ''

  async function loginAs(identifier: string) {
    const agent = request.agent(app)
    await agent.post('/api/v1/auth/login').send({ identifier, password })
    return agent
  }

  async function createAppointment(
    agent: ReturnType<typeof request.agent>,
    vehicleId: string,
    date: string,
    time: string,
    reason: string,
  ) {
    const response = await agent.post('/api/v1/appointments').send({
      customerId: state.customerId,
      vehicleId,
      date,
      time,
      reason,
    })
    expect(response.status).toBe(201)
    return response.body.data as { id: string }
  }

  beforeAll(async () => {
    await databaseService.connect()
    sharedPasswordHash = await hashPassword(password)

    const [readPermission, writePermission] = await Promise.all([
      databaseService.client.permission.upsert({
        where: { code: 'workshop:read' },
        create: {
          code: 'workshop:read',
          description: 'Solo lectura del taller',
        },
        update: {},
      }),
      databaseService.client.permission.upsert({
        where: { code: 'workshop:write' },
        create: { code: 'workshop:write', description: 'Registro de órdenes' },
        update: {},
      }),
    ])

    const [adminRole, readerRole, noAccessRole] = await Promise.all([
      databaseService.client.role.create({
        data: {
          code: adminOrder.roleCode,
          name: 'Administrador del taller',
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
          name: 'Lector del taller',
          permissions: { create: { permissionId: readPermission.id } },
        },
      }),
      databaseService.client.role.create({
        data: { code: noAccessOrder.roleCode, name: 'Sin acceso al taller' },
      }),
    ])

    const users = await Promise.all([
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
      databaseService.client.user.create({
        data: {
          username: technicianIdentity.username,
          email: technicianIdentity.email,
          displayName: technicianIdentity.name,
          passwordHash: sharedPasswordHash,
        },
      }),
      databaseService.client.user.create({
        data: {
          username: inactiveTechIdentity.username,
          email: inactiveTechIdentity.email,
          displayName: inactiveTechIdentity.name,
          passwordHash: sharedPasswordHash,
          active: false,
        },
      }),
    ])

    const [admin, reader, noAccess, technicianUser, inactiveTechUser] = users

    const customer = await databaseService.client.customer.create({
      data: {
        type: 'NATURAL',
        documentNumber: `77${suffix.slice(0, 8)}`,
        firstName: `Cliente OT ${suffix}`,
        lastName: 'Taller',
        phone: `920${suffix.slice(0, 6)}`,
        email: `cliente_ot_${suffix}@torcly.local`,
      },
    })
    const vehicleA = await databaseService.client.vehicle.create({
      data: {
        plate: `A-${suffix.slice(0, 6).toUpperCase()}`,
        brand: 'Toyota',
        model: 'Corolla',
        year: 2020,
        customerId: customer.id,
      },
    })
    const vehicleB = await databaseService.client.vehicle.create({
      data: {
        plate: `B-${suffix.slice(0, 6).toUpperCase()}`,
        brand: 'Hyundai',
        model: 'Accent',
        year: 2019,
        customerId: customer.id,
      },
    })

    const productActive = await databaseService.client.product.upsert({
      where: { code: `P-OT-${suffix}` },
      create: {
        code: `P-OT-${suffix}`,
        name: `Producto OT ${suffix}`,
        salePrice: 120.5,
        category: { create: { name: `Categoría OT ${suffix}` } },
        brand: { create: { name: `Marca OT ${suffix}` } },
        unit: { create: { name: `Unidad OT ${suffix}`, symbol: 'btl' } },
      },
      update: {},
    })
    const productInactive = await databaseService.client.product.upsert({
      where: { code: `P-OTI-${suffix}` },
      create: {
        code: `P-OTI-${suffix}`,
        name: `Producto inactivo OT ${suffix}`,
        salePrice: 50,
        active: false,
        categoryId: productActive.categoryId,
        unitId: productActive.unitId,
        brandId: productActive.brandId,
      },
      update: {},
    })
    const service = await databaseService.client.service.upsert({
      where: { code: `S-OT-${suffix}` },
      create: {
        code: `S-OT-${suffix}`,
        name: `Servicio OT ${suffix}`,
        price: 80,
      },
      update: {},
    })

    Object.assign(adminIds, { userId: admin.id, roleId: adminRole.id })
    Object.assign(readerIds, { userId: reader.id, roleId: readerRole.id })
    Object.assign(noAccessIds, { userId: noAccess.id, roleId: noAccessRole.id })
    Object.assign(technicianUserId, { id: technicianUser.id })
    Object.assign(inactiveTechUserId, { id: inactiveTechUser.id })
    Object.assign(state, {
      customerId: customer.id,
      vehicleAId: vehicleA.id,
      vehicleBId: vehicleB.id,
      productActiveId: productActive.id,
      productInactiveId: productInactive.id,
      serviceId: service.id,
    })
    cleanupRoleIds.push(adminRole.id, readerRole.id, noAccessRole.id)
  }, 60_000)

  afterAll(async () => {
    const userIds = [
      adminIds.userId,
      readerIds.userId,
      noAccessIds.userId,
      technicianUserId.id,
      inactiveTechUserId.id,
    ].filter(Boolean)

    const workOrderIds = [
      state.order1Id,
      state.order2Id,
      state.order3Id,
    ].filter(Boolean)
    if (workOrderIds.length) {
      await databaseService.client.workOrderLine.deleteMany({
        where: { workOrderId: { in: workOrderIds } },
      })
      await databaseService.client.workOrder.deleteMany({
        where: { id: { in: workOrderIds } },
      })
    }
    await databaseService.client.appointment.deleteMany({
      where: { customerId: state.customerId },
    })
    await databaseService.client.auditLog.deleteMany({
      where: { userId: { in: userIds } },
    })
    await databaseService.client.vehicle.deleteMany({
      where: { customerId: state.customerId },
    })
    await databaseService.client.customer.deleteMany({
      where: { id: state.customerId },
    })
    await databaseService.client.product.deleteMany({
      where: { id: { in: [state.productActiveId, state.productInactiveId] } },
    })
    await databaseService.client.service.deleteMany({
      where: { id: state.serviceId },
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
    const denied = await noAccessAgent.get('/api/v1/work-orders')
    expect(denied.status).toBe(403)
    expect(denied.body.error.code).toBe('AUTH_FORBIDDEN')

    const readerAgent = await loginAs(readerIdentity.username)
    const listed = await readerAgent.get('/api/v1/work-orders')
    expect(listed.status).toBe(200)

    const written = await readerAgent.post('/api/v1/work-orders').send({
      appointmentId: state.order1Id || 'a0000000-0000-4000-8000-000000000009',
    })
    expect(written.status).toBe(403)
    expect(written.body.error.code).toBe('AUTH_FORBIDDEN')
  }, 60_000)

  it('atiende una cita programada generando una única orden OT', async () => {
    const adminAgent = await loginAs(identity.username)
    const appointment = await createAppointment(
      adminAgent,
      state.vehicleAId,
      isoInDays(20),
      '09:00',
      'Mantenimiento preventivo completo',
    )

    const created = await adminAgent.post('/api/v1/work-orders').send({
      appointmentId: appointment.id,
    })
    expect(created.status).toBe(201)
    expect(created.body.data.code).toMatch(/^OT-\d{6}$/)
    expect(created.body.data.status).toBe('RECEPCIONADA')
    expect(created.body.data.performedBy).toBe(identity.name)
    expect(created.body.data.appointment.code).toMatch(/^CITA-\d{6}$/)
    expect(created.body.data.vehicle.plate).toMatch(/^A-/)

    state.order1Id = created.body.data.id

    const appointmentAfter = await adminAgent.get(
      `/api/v1/appointments/${appointment.id}`,
    )
    expect(appointmentAfter.status).toBe(200)
    expect(appointmentAfter.body.data.status).toBe('ATENDIDA')

    const duplicate = await adminAgent.post('/api/v1/work-orders').send({
      appointmentId: appointment.id,
    })
    expect(duplicate.status).toBe(409)
    expect(duplicate.body.error.code).toBe('APPOINTMENT_NOT_ATTENDABLE')
  }, 60_000)

  it('rechaza atender una cita cancelada', async () => {
    const adminAgent = await loginAs(identity.username)
    const appointment = await createAppointment(
      adminAgent,
      state.vehicleBId,
      isoInDays(23),
      '11:00',
      'Cita que se cancelará',
    )
    const cancelled = await adminAgent.post(
      `/api/v1/appointments/${appointment.id}/cancel`,
    )
    expect(cancelled.status).toBe(200)
    state.appointmentCancelledId = appointment.id

    const attended = await adminAgent.post('/api/v1/work-orders').send({
      appointmentId: appointment.id,
    })
    expect(attended.status).toBe(409)
    expect(attended.body.error.code).toBe('APPOINTMENT_NOT_ATTENDABLE')
  }, 60_000)

  it('registra diagnóstico y mueve la orden a en diagnóstico', async () => {
    const adminAgent = await loginAs(identity.username)
    const response = await adminAgent
      .put(`/api/v1/work-orders/${state.order1Id}/diagnosis`)
      .send({ diagnosis: 'Falla en el sistema de frenos trasero' })
    expect(response.status).toBe(200)
    expect(response.body.data.status).toBe('EN_DIAGNOSTICO')
    expect(response.body.data.diagnosis).toBe(
      'Falla en el sistema de frenos trasero',
    )
    expect(response.body.data.diagnosisUpdatedBy).toBe(identity.name)
  }, 60_000)

  it('rechaza decidir sin presupuesto enviado', async () => {
    const adminAgent = await loginAs(identity.username)
    const decision = await adminAgent
      .post(`/api/v1/work-orders/${state.order1Id}/decision`)
      .send({ decision: 'APPROVED' })
    expect(decision.status).toBe(409)
    expect(decision.body.error.code).toBe('WORK_ORDER_BUDGET_NOT_SENT')
  }, 60_000)

  it('rechaza un presupuesto con producto inactivo', async () => {
    const adminAgent = await loginAs(identity.username)
    const response = await adminAgent
      .put(`/api/v1/work-orders/${state.order1Id}/budget`)
      .send({
        lines: [
          { type: 'PRODUCT', productId: state.productInactiveId, quantity: 1 },
        ],
      })
    expect(response.status).toBe(409)
    expect(response.body.error.code).toBe('PRODUCT_INACTIVE')
  }, 60_000)

  it('guarda un presupuesto congelando los precios activos', async () => {
    const adminAgent = await loginAs(identity.username)
    const response = await adminAgent
      .put(`/api/v1/work-orders/${state.order1Id}/budget`)
      .send({
        lines: [
          { type: 'PRODUCT', productId: state.productActiveId, quantity: 2 },
          { type: 'SERVICE', serviceId: state.serviceId },
        ],
      })
    expect(response.status).toBe(200)
    expect(response.body.data.lines).toHaveLength(2)
    expect(response.body.data.subtotal).toBe(321)
    expect(response.body.data.total).toBe(321)
    expect(response.body.data.lines[0]).toMatchObject({
      type: 'PRODUCT',
      unitPrice: 120.5,
      quantity: 2,
      subtotal: 241,
    })
    expect(response.body.data.lines[1]).toMatchObject({
      type: 'SERVICE',
      unitPrice: 80,
      quantity: 1,
      subtotal: 80,
    })
  }, 60_000)

  it('envía el presupuesto y pasa a pendiente de aprobación', async () => {
    const adminAgent = await loginAs(identity.username)
    const response = await adminAgent.post(
      `/api/v1/work-orders/${state.order1Id}/budget/send`,
    )
    expect(response.status).toBe(200)
    expect(response.body.data.status).toBe('PENDIENTE_APROBACION')
    expect(response.body.data.budgetSentAt).toBeTruthy()
  }, 60_000)

  it('aprueba una orden preservando responsable, fecha y observación', async () => {
    const adminAgent = await loginAs(identity.username)
    const response = await adminAgent
      .post(`/api/v1/work-orders/${state.order1Id}/decision`)
      .send({
        decision: 'APPROVED',
        notes: 'Cliente conforme después de explicarle',
      })
    expect(response.status).toBe(200)
    expect(response.body.data.status).toBe('APROBADA')
    expect(response.body.data.approvedBy).toBe(identity.name)
    expect(response.body.data.approvedAt).toBeTruthy()
    expect(response.body.data.rejectedBy).toBeNull()
    expect(response.body.data.decisionNotes).toBe(
      'Cliente conforme después de explicarle',
    )
  }, 60_000)

  it('bloquea ediciones sobre órdenes aprobadas', async () => {
    const adminAgent = await loginAs(identity.username)
    const diagnosis = await adminAgent
      .put(`/api/v1/work-orders/${state.order1Id}/diagnosis`)
      .send({ diagnosis: 'Intento de cambio tardío' })
    expect(diagnosis.status).toBe(409)
    expect(diagnosis.body.error.code).toBe('WORK_ORDER_STATUS_INVALID')

    const budget = await adminAgent
      .put(`/api/v1/work-orders/${state.order1Id}/budget`)
      .send({
        lines: [{ type: 'SERVICE', serviceId: state.serviceId }],
      })
    expect(budget.status).toBe(409)
    expect(budget.body.error.code).toBe('WORK_ORDER_STATUS_INVALID')

    const decision = await adminAgent
      .post(`/api/v1/work-orders/${state.order1Id}/decision`)
      .send({ decision: 'REJECTED' })
    expect(decision.status).toBe(409)
    expect(decision.body.error.code).toBe('WORK_ORDER_BUDGET_NOT_SENT')
  }, 60_000)

  it('asigna y desasigna técnicos activos y rechaza inactivos', async () => {
    const adminAgent = await loginAs(identity.username)
    const inactive = await adminAgent
      .put(`/api/v1/work-orders/${state.order1Id}/technician`)
      .send({ technicianId: inactiveTechUserId.id })
    expect(inactive.status).toBe(409)
    expect(inactive.body.error.code).toBe('TECHNICIAN_INACTIVE')

    const assigned = await adminAgent
      .put(`/api/v1/work-orders/${state.order1Id}/technician`)
      .send({ technicianId: technicianUserId.id })
    expect(assigned.status).toBe(200)
    expect(assigned.body.data.technician).toBe(technicianIdentity.name)

    const unassigned = await adminAgent
      .put(`/api/v1/work-orders/${state.order1Id}/technician`)
      .send({ technicianId: null })
    expect(unassigned.status).toBe(200)
    expect(unassigned.body.data.technician).toBeNull()
  }, 60_000)

  it('rechaza una orden conservando la decisión', async () => {
    const adminAgent = await loginAs(identity.username)
    const appointment = await createAppointment(
      adminAgent,
      state.vehicleBId,
      isoInDays(21),
      '10:00',
      'Diagnóstico de suspensión',
    )
    const created = await adminAgent.post('/api/v1/work-orders').send({
      appointmentId: appointment.id,
    })
    expect(created.status).toBe(201)
    const order2Id = created.body.data.id

    await adminAgent
      .put(`/api/v1/work-orders/${order2Id}/diagnosis`)
      .send({ diagnosis: 'Bujes de suspensión desgastados' })
    await adminAgent.put(`/api/v1/work-orders/${order2Id}/budget`).send({
      lines: [{ type: 'SERVICE', serviceId: state.serviceId }],
    })
    const sent = await adminAgent.post(
      `/api/v1/work-orders/${order2Id}/budget/send`,
    )
    expect(sent.status).toBe(200)

    const rejected = await adminAgent
      .post(`/api/v1/work-orders/${order2Id}/decision`)
      .send({ decision: 'REJECTED', notes: 'Prefiere otra opinión' })
    expect(rejected.status).toBe(200)
    expect(rejected.body.data.status).toBe('RECHAZADA')
    expect(rejected.body.data.rejectedBy).toBe(identity.name)
    expect(rejected.body.data.rejectedAt).toBeTruthy()
    expect(rejected.body.data.decisionNotes).toBe('Prefiere otra opinión')

    const technician = await adminAgent
      .put(`/api/v1/work-orders/${order2Id}/technician`)
      .send({ technicianId: technicianUserId.id })
    expect(technician.status).toBe(409)
    expect(technician.body.error.code).toBe('WORK_ORDER_STATUS_INVALID')

    state.order2Id = order2Id
  }, 60_000)

  it('rechaza enviar un presupuesto vacío', async () => {
    const adminAgent = await loginAs(identity.username)
    const appointment = await createAppointment(
      adminAgent,
      state.vehicleAId,
      isoInDays(22),
      '09:30',
      'Cita para presupuesto vacío',
    )
    const created = await adminAgent.post('/api/v1/work-orders').send({
      appointmentId: appointment.id,
    })
    expect(created.status).toBe(201)
    state.order3Id = created.body.data.id

    const sent = await adminAgent.post(
      `/api/v1/work-orders/${state.order3Id}/budget/send`,
    )
    expect(sent.status).toBe(400)
    expect(sent.body.error.code).toBe('WORK_ORDER_NO_LINES')
  }, 60_000)

  it('filtra por estado y técnico y expone el resumen', async () => {
    const adminAgent = await loginAs(identity.username)
    const approved = await adminAgent.get('/api/v1/work-orders?status=APROBADA')
    expect(approved.status).toBe(200)
    expect(approved.body.data.length).toBeGreaterThanOrEqual(1)
    expect(
      approved.body.data.every(
        (item: { status: string }) => item.status === 'APROBADA',
      ),
    ).toBe(true)

    const assigned = await adminAgent
      .put(`/api/v1/work-orders/${state.order1Id}/technician`)
      .send({ technicianId: technicianUserId.id })
    expect(assigned.status).toBe(200)

    const byTechnician = await adminAgent.get(
      `/api/v1/work-orders?technicianId=${technicianUserId.id}`,
    )
    expect(byTechnician.status).toBe(200)
    expect(
      byTechnician.body.data.some(
        (item: { id: string }) => item.id === state.order1Id,
      ),
    ).toBe(true)

    const all = await adminAgent.get('/api/v1/work-orders?status=all')
    expect(all.status).toBe(200)
    expect(all.body.summary).toMatchObject({
      total: expect.any(Number),
      recepcionadas: expect.any(Number),
      enDiagnostico: expect.any(Number),
      pendientesAprobacion: expect.any(Number),
      aprobadas: expect.any(Number),
      rechazadas: expect.any(Number),
    })
  }, 60_000)

  it('registra la auditoría de todas las mutaciones del taller', async () => {
    const events = await databaseService.client.auditLog.findMany({
      where: { userId: adminIds.userId },
      select: { event: true },
    })
    const codes = new Set(events.map((event) => event.event))
    expect(codes).toContain('APPOINTMENT_ATTENDED')
    expect(codes).toContain('WORK_ORDER_CREATED')
    expect(codes).toContain('WORK_ORDER_DIAGNOSIS_UPDATED')
    expect(codes).toContain('WORK_ORDER_BUDGET_SAVED')
    expect(codes).toContain('WORK_ORDER_BUDGET_SENT')
    expect(codes).toContain('WORK_ORDER_BUDGET_APPROVED')
    expect(codes).toContain('WORK_ORDER_BUDGET_REJECTED')
    expect(codes).toContain('WORK_ORDER_TECHNICIAN_ASSIGNED')
  }, 60_000)
})
