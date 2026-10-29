import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { databaseService } from '../src/infrastructure/database/prisma.service.js'
import { hashPassword } from '../src/modules/auth/password.js'

const runDatabaseTests = process.env.DATABASE_TESTS === 'true'
const describeWithDatabase = describe.runIf(runDatabaseTests)

describeWithDatabase('Usuarios integrados con PostgreSQL', () => {
  const app = createApp()
  const suffix = randomUUID().slice(0, 8)
  const password = `Clave-usuarios-${suffix}!`
  const createdPassword = `Clave-creada-${suffix}!`

  const adminOrder = { roleCode: `admin-users-${suffix}` }
  const readerOrder = { roleCode: `reader-users-${suffix}` }
  const noAccessOrder = { roleCode: `no-access-${suffix}` }

  const identity = {
    username: `admin_${suffix}`,
    email: `admin_${suffix}@torcly.local`,
    name: `Admin ${suffix}`,
  }
  const readerIdentity = {
    username: `reader_${suffix}`,
    email: `reader_${suffix}@torcly.local`,
    name: `Lector ${suffix}`,
  }
  const noAccessIdentity = {
    username: `ninguno_${suffix}`,
    email: `ninguno_${suffix}@torcly.local`,
    name: `Sin acceso ${suffix}`,
  }

  const adminIds = { userId: '', roleId: '' }
  const readerIds = { userId: '', roleId: '' }
  const noAccessIds = { userId: '', roleId: '' }
  const createdIds = { userId: '', roleId: '' }
  const cleanupRoleIds: string[] = []
  let sharedPasswordHash = ''

  beforeAll(async () => {
    await databaseService.connect()
    sharedPasswordHash = await hashPassword(password)

    const [readPermission, writePermission] = await Promise.all([
      databaseService.client.permission.upsert({
        where: { code: 'users:read' },
        create: { code: 'users:read', description: 'Solo lectura de usuarios' },
        update: {},
      }),
      databaseService.client.permission.upsert({
        where: { code: 'users:write' },
        create: {
          code: 'users:write',
          description: 'Escritura de usuarios',
        },
        update: {},
      }),
    ])

    const [adminRole, readerRole, noAccessRole] = await Promise.all([
      databaseService.client.role.create({
        data: {
          code: adminOrder.roleCode,
          name: 'Administrador de usuarios',
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
          name: 'Lector de usuarios',
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
    Object.assign(noAccessIds, { userId: noAccess.id, roleId: noAccessRole.id })
    cleanupRoleIds.push(adminRole.id, readerRole.id, noAccessRole.id)
  }, 60_000)

  afterAll(async () => {
    const userIds = [
      adminIds.userId,
      readerIds.userId,
      noAccessIds.userId,
      createdIds.userId,
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

  it('bloquea a quien no tiene permiso aunque invoque la API directamente', async () => {
    const noAccessAgent = request.agent(app)
    await noAccessAgent.post('/api/v1/auth/login').send({
      identifier: noAccessIdentity.username,
      password,
    })
    const response = await noAccessAgent.get('/api/v1/users')
    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe('AUTH_FORBIDDEN')

    const readerAgent = request.agent(app)
    await readerAgent.post('/api/v1/auth/login').send({
      identifier: readerIdentity.email,
      password,
    })
    const list = await readerAgent.get('/api/v1/users')
    expect(list.status).toBe(200)
    const write = await readerAgent.post('/api/v1/users').send({})
    expect(write.status).toBe(403)
    expect(write.body.error.code).toBe('AUTH_FORBIDDEN')
  }, 60_000)

  it('crea, normaliza, rechaza duplicados y lista usuarios', async () => {
    const adminAgent = request.agent(app)
    await adminAgent.post('/api/v1/auth/login').send({
      identifier: identity.email,
      password,
    })

    const create = await adminAgent.post('/api/v1/users').send({
      username: 'Creado.Por_Admin',
      email: `Creado_${suffix}@Torcly.Local`,
      displayName: `Usuario creado ${suffix}`,
      password: createdPassword,
      roleId: adminIds.roleId,
    })
    expect(create.status).toBe(201)
    expect(create.body.data.username).toBe('creado.por_admin')
    expect(create.body.data.email).toBe(`creado_${suffix}@torcly.local`)
    expect(create.body.data.active).toBe(true)
    createdIds.userId = create.body.data.id
    createdIds.roleId = adminIds.roleId

    const duplicate = await adminAgent.post('/api/v1/users').send({
      username: `otro_${suffix}`,
      email: create.body.data.email,
      displayName: 'Duplicado',
      password: createdPassword,
      roleId: adminIds.roleId,
    })
    expect(duplicate.status).toBe(409)
    expect(duplicate.body.error.code).toBe('USER_DUPLICATE')

    const invalidRole = await adminAgent.post('/api/v1/users').send({
      username: `invalido_${suffix}`,
      email: `invalido_${suffix}@torcly.local`,
      displayName: 'Rol inválido',
      password: createdPassword,
      roleId: '2b8a4c19-9d3e-4f1b-8a2c-4f1b2c3d4e5f',
    })
    expect(invalidRole.status).toBe(400)
    expect(invalidRole.body.error.code).toBe('USER_ROLE_INVALID')

    const list = await adminAgent.get('/api/v1/users')
    expect(list.status).toBe(200)
    expect(list.body.pagination.total).toBeGreaterThanOrEqual(4)

    const searched = await adminAgent.get(
      '/api/v1/users?search=Creado&pageSize=50',
    )
    expect(searched.status).toBe(200)
    expect(searched.body.data).toHaveLength(1)
    expect(searched.body.data[0].username).toBe('creado.por_admin')

    const inactiveFiltered = await adminAgent.get(
      '/api/v1/users?status=inactive',
    )
    expect(inactiveFiltered.status).toBe(200)
    expect(
      inactiveFiltered.body.data.every(
        (user: { active: boolean }) => !user.active,
      ),
    ).toBe(true)
  }, 60_000)

  it('consulta detalle, actualiza datos y cambia rol con auditoría', async () => {
    const adminAgent = request.agent(app)
    await adminAgent.post('/api/v1/auth/login').send({
      identifier: identity.username,
      password,
    })

    const detail = await adminAgent.get(`/api/v1/users/${createdIds.userId}`)
    expect(detail.status).toBe(200)
    expect(detail.body.data.roles[0].id).toBe(adminIds.roleId)
    expect(detail.body.data.permissions).toContain('users:read')

    const updated = await adminAgent
      .put(`/api/v1/users/${createdIds.userId}`)
      .send({
        email: `renombrado_${suffix}@torcly.local`,
        displayName: `Renombrado ${suffix}`,
      })
    expect(updated.status).toBe(200)
    expect(updated.body.data.displayName).toBe(`Renombrado ${suffix}`)

    const roleChange = await adminAgent
      .patch(`/api/v1/users/${createdIds.userId}/role`)
      .send({ roleId: readerIds.roleId })
    expect(roleChange.status).toBe(200)
    expect(roleChange.body.data.roles[0].id).toBe(readerIds.roleId)

    const events = await databaseService.client.auditLog.findMany({
      where: {
        userId: createdIds.userId,
        event: { in: ['USER_CREATED', 'USER_UPDATED', 'USER_ROLE_CHANGED'] },
      },
      orderBy: { createdAt: 'asc' },
    })
    expect(events.map((event) => event.event)).toEqual([
      'USER_CREATED',
      'USER_UPDATED',
      'USER_ROLE_CHANGED',
    ])
    expect(events[2].metadata).toMatchObject({
      fromRoleCode: adminOrder.roleCode,
      toRoleCode: readerOrder.roleCode,
    })
  }, 60_000)

  it('desactiva, revoca sesiones y reactiva el acceso', async () => {
    const adminAgent = request.agent(app)
    await adminAgent.post('/api/v1/auth/login').send({
      identifier: identity.username,
      password,
    })

    const createdAgent = request.agent(app)
    const login = await createdAgent.post('/api/v1/auth/login').send({
      identifier: `renombrado_${suffix}@torcly.local`,
      password: createdPassword,
    })
    expect(login.status).toBe(200)
    const activeSessionsBefore = await databaseService.client.authSession.count(
      {
        where: { userId: createdIds.userId, revokedAt: null },
      },
    )
    expect(activeSessionsBefore).toBeGreaterThanOrEqual(1)

    const deactivated = await adminAgent
      .patch(`/api/v1/users/${createdIds.userId}/status`)
      .send({ active: false })
    expect(deactivated.status).toBe(200)
    expect(deactivated.body.data.active).toBe(false)

    const rejected = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: `renombrado_${suffix}@torcly.local`,
        password: createdPassword,
      })
    expect(rejected.status).toBe(401)

    const revoked = await createdAgent.get('/api/v1/auth/me')
    expect(revoked.status).toBe(401)

    const activeSessionsAfter = await databaseService.client.authSession.count({
      where: { userId: createdIds.userId, revokedAt: null },
    })
    expect(activeSessionsAfter).toBe(0)

    const reactivated = await adminAgent
      .patch(`/api/v1/users/${createdIds.userId}/status`)
      .send({ active: true })
    expect(reactivated.status).toBe(200)
    expect(reactivated.body.data.active).toBe(true)

    const allowed = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: `renombrado_${suffix}@torcly.local`,
        password: createdPassword,
      })
    expect(allowed.status).toBe(200)

    const stateEvents = await databaseService.client.auditLog.findMany({
      where: {
        userId: createdIds.userId,
        event: { in: ['USER_DEACTIVATED', 'USER_ACTIVATED'] },
      },
      orderBy: { createdAt: 'asc' },
    })
    expect(stateEvents.map((event) => event.event)).toEqual([
      'USER_DEACTIVATED',
      'USER_ACTIVATED',
    ])
  }, 60_000)

  it('protege la propia cuenta del administrador', async () => {
    const adminAgent = request.agent(app)
    await adminAgent.post('/api/v1/auth/login').send({
      identifier: identity.username,
      password,
    })

    const selfStatus = await adminAgent
      .patch(`/api/v1/users/${adminIds.userId}/status`)
      .send({ active: false })
    expect(selfStatus.status).toBe(409)
    expect(selfStatus.body.error.code).toBe('USER_SELF_OPERATION')

    const selfRole = await adminAgent
      .patch(`/api/v1/users/${adminIds.userId}/role`)
      .send({ roleId: readerIds.roleId })
    expect(selfRole.status).toBe(409)
    expect(selfRole.body.error.code).toBe('USER_SELF_OPERATION')

    const me = await adminAgent.get('/api/v1/auth/me')
    expect(me.status).toBe(200)
    expect(me.body.id).toBe(adminIds.userId)
  }, 60_000)
})
