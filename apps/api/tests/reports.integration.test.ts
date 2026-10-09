import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { databaseService } from '../src/infrastructure/database/prisma.service.js'
import { hashPassword } from '../src/modules/auth/password.js'

const runDatabaseTests = process.env.DATABASE_TESTS === 'true'
const describeWithDatabase = describe.runIf(runDatabaseTests)

describeWithDatabase('Reportes integrados con PostgreSQL', () => {
  const app = createApp()
  const suffix = randomUUID().slice(0, 8)
  const password = `Clave-rep-${suffix}!`

  const adminOrder = { roleCode: `admin-rep-${suffix}` }
  const partialOrder = { roleCode: `partial-rep-${suffix}` }
  const noAccessOrder = { roleCode: `no-rep-${suffix}` }

  const adminIdentity = {
    username: `admin_r_${suffix}`,
    email: `admin_r_${suffix}@torcly.local`,
    name: `Admin Reportes ${suffix}`,
  }
  const partialIdentity = {
    username: `partial_r_${suffix}`,
    email: `partial_r_${suffix}@torcly.local`,
    name: `Lector parcial reportes ${suffix}`,
  }
  const noAccessIdentity = {
    username: `no_r_${suffix}`,
    email: `no_r_${suffix}@torcly.local`,
    name: `Sin acceso reportes ${suffix}`,
  }

  const adminIds = { userId: '', roleId: '' }
  const partialIds = { userId: '', roleId: '' }
  const noAccessIds = { userId: '', roleId: '' }
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

    const permissionCodes = [
      'reports:read',
      'sales:read',
      'cash:read',
      'inventory:read',
      'services:read',
      'workshop:read',
      'appointments:read',
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

    const [adminRole, partialRole, noAccessRole] = await Promise.all([
      databaseService.client.role.create({
        data: {
          code: adminOrder.roleCode,
          name: 'Administrador de reportes',
          permissions: {
            create: permissionCodes.map((code) => ({
              permissionId: permissionByCode.get(code)!,
            })),
          },
        },
      }),
      databaseService.client.role.create({
        data: {
          code: partialOrder.roleCode,
          name: 'Lector parcial de reportes',
          permissions: {
            create: [{ permissionId: permissionByCode.get('reports:read')! }],
          },
        },
      }),
      databaseService.client.role.create({
        data: { code: noAccessOrder.roleCode, name: 'Sin acceso reportes' },
      }),
    ])

    const [admin, partial, noAccess] = await Promise.all([
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
          username: partialIdentity.username,
          email: partialIdentity.email,
          displayName: partialIdentity.name,
          passwordHash: sharedPasswordHash,
          roles: { create: { roleId: partialRole.id } },
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
    Object.assign(partialIds, { userId: partial.id, roleId: partialRole.id })
    Object.assign(noAccessIds, { userId: noAccess.id, roleId: noAccessRole.id })
    cleanupRoleIds.push(adminRole.id, partialRole.id, noAccessRole.id)
  }, 60_000)

  afterAll(async () => {
    const userIds = [
      adminIds.userId,
      partialIds.userId,
      noAccessIds.userId,
    ].filter(Boolean)

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

  it('exige reports:read para consultar el resumen', async () => {
    const noAccessAgent = await loginAs(noAccessIdentity.username)
    const denied = await noAccessAgent.get('/api/v1/reports/summary')
    expect(denied.status).toBe(403)
    expect(denied.body.error.code).toBe('AUTH_FORBIDDEN')
  })

  it('omite los bloques sin permisos de lectura en el resumen', async () => {
    const partialAgent = await loginAs(partialIdentity.username)
    const summary = await partialAgent.get(
      '/api/v1/reports/summary?from=2026-10-01&to=2026-10-10',
    )
    expect(summary.status).toBe(200)
    expect(summary.body.period).toEqual({
      from: '2026-10-01',
      to: '2026-10-10',
    })
    expect(Object.keys(summary.body.blocks)).toEqual([])
    expect(summary.body.blocks.payments).toBeUndefined()
    expect(summary.body.generatedAt).toBeTruthy()
  })

  it('rechaza un bloque sin los permisos de su fuente', async () => {
    const partialAgent = await loginAs(partialIdentity.username)
    const denied = await partialAgent.get('/api/v1/reports/blocks/payments')
    expect(denied.status).toBe(403)
    expect(denied.body.error.code).toBe('REPORTS_BLOCK_FORBIDDEN')
  })

  it('consulta ventas con descriptor, métricas y serie sin UUIDs', async () => {
    const adminAgent = await loginAs(adminIdentity.username)
    const block = await adminAgent.get(
      '/api/v1/reports/blocks/sales?from=2026-10-01&to=2026-10-10',
    )
    expect(block.status).toBe(200)
    expect(block.body.block).toBe('sales')
    expect(block.body.descriptor).toMatchObject({
      block: 'sales',
      source: 'sales',
      periodField: 'confirmedAt',
    })
    expect(block.body.period).toEqual({ from: '2026-10-01', to: '2026-10-10' })
    expect(block.body.granularity).toBe('day')
    expect(block.body.metrics).toMatchObject({
      count: 0,
      amount: 0,
      averageTicket: 0,
    })
    expect(Array.isArray(block.body.trend)).toBe(true)
    expect(block.body.trend).toHaveLength(10)
    expect(block.body.composition).toEqual([])
    expect(JSON.stringify(block.body)).not.toMatch(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/,
    )
  })

  it('es solo lectura: no expone rutas de mutación en reportes', async () => {
    const adminAgent = await loginAs(adminIdentity.username)
    const post = await adminAgent.post('/api/v1/reports/summary').send({})
    expect(post.status).toBe(404)
    const put = await adminAgent.put('/api/v1/reports/blocks/sales').send({})
    expect(put.status).toBe(404)
    const del = await adminAgent.delete('/api/v1/reports/blocks/sales')
    expect(del.status).toBe(404)
  })

  it('rechaza períodos invertidos y bloques desconocidos', async () => {
    const adminAgent = await loginAs(adminIdentity.username)
    const inverted = await adminAgent.get(
      '/api/v1/reports/summary?from=2026-10-10&to=2026-10-01',
    )
    expect(inverted.status).toBe(400)
    expect(inverted.body.error.code).toBe('REPORTS_DATE_RANGE_INVALID')

    const unknown = await adminAgent.get('/api/v1/reports/blocks/unknown')
    expect(unknown.status).toBe(400)
  })
})
