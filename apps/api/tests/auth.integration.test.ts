import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { databaseService } from '../src/infrastructure/database/prisma.service.js'
import { hashPassword } from '../src/modules/auth/password.js'
import { hashSessionToken } from '../src/modules/auth/session-token.js'
import { seedDatabase } from '../prisma/seed.js'

const runDatabaseTests = process.env.DATABASE_TESTS === 'true'
const describeWithDatabase = describe.runIf(runDatabaseTests)

describeWithDatabase('Autenticación integrada con PostgreSQL', () => {
  const app = createApp()
  const suffix = randomUUID().slice(0, 8)
  const password = `Clave-integracion-${suffix}!`
  const identity = {
    username: `test_${suffix}`,
    email: `test_${suffix}@torcly.local`,
    name: `Prueba ${suffix}`,
  }
  const lockedIdentity = {
    username: `lock_${suffix}`,
    email: `lock_${suffix}@torcly.local`,
  }
  const inactiveIdentity = {
    username: `inactive_${suffix}`,
    email: `inactive_${suffix}@torcly.local`,
  }
  const permissionCode = `integration-${suffix}:read`
  const roleCode = `integration-${suffix}`
  let userId = ''
  let lockedUserId = ''
  let inactiveUserId = ''
  let roleId = ''
  let permissionId = ''
  let seededUserId = ''
  let seededRoleId = ''
  let seededPermissionId = ''

  beforeAll(async () => {
    await databaseService.connect()
    const permission = await databaseService.client.permission.create({
      data: { code: permissionCode, description: 'Prueba integrada temporal' },
    })
    const role = await databaseService.client.role.create({
      data: {
        code: roleCode,
        name: 'Rol temporal',
        permissions: {
          create: { permissionId: permission.id },
        },
      },
    })
    const passwordHash = await hashPassword(password)
    const user = await databaseService.client.user.create({
      data: {
        username: identity.username,
        email: identity.email,
        displayName: identity.name,
        passwordHash,
        roles: { create: { roleId: role.id } },
      },
    })
    const lockedUser = await databaseService.client.user.create({
      data: {
        username: lockedIdentity.username,
        email: lockedIdentity.email,
        displayName: 'Cuenta para bloqueo',
        passwordHash,
      },
    })
    const inactiveUser = await databaseService.client.user.create({
      data: {
        username: inactiveIdentity.username,
        email: inactiveIdentity.email,
        displayName: 'Cuenta inactiva',
        passwordHash,
        active: false,
      },
    })

    userId = user.id
    lockedUserId = lockedUser.id
    inactiveUserId = inactiveUser.id
    roleId = role.id
    permissionId = permission.id
  }, 60_000)

  afterAll(async () => {
    await databaseService.client.auditLog.deleteMany({
      where: {
        OR: [
          { userId: { in: [userId, lockedUserId] } },
          {
            identifier: {
              in: [
                identity.email,
                lockedIdentity.email,
                inactiveIdentity.email,
              ],
            },
          },
        ],
      },
    })
    await databaseService.client.user.deleteMany({
      where: {
        id: {
          in: [userId, lockedUserId, inactiveUserId, seededUserId].filter(
            Boolean,
          ),
        },
      },
    })
    await databaseService.client.role.deleteMany({
      where: { id: { in: [roleId, seededRoleId].filter(Boolean) } },
    })
    await databaseService.client.permission.deleteMany({
      where: { id: { in: [permissionId, seededPermissionId].filter(Boolean) } },
    })
    await databaseService.disconnect()
  }, 60_000)

  it('ejecuta el seed dos veces sin duplicar el administrador', async () => {
    const seedInput = {
      email: `seed_${suffix}@torcly.local`,
      username: `seed_${suffix}`,
      name: 'Administrador de prueba',
      password,
      roleCode: `seed-role-${suffix}`,
      permissionCodes: [`seed-${suffix}:read`],
    }
    const first = await seedDatabase(databaseService.client, seedInput)
    const second = await seedDatabase(databaseService.client, seedInput)
    const role = await databaseService.client.role.findUniqueOrThrow({
      where: { code: seedInput.roleCode },
      include: { permissions: true },
    })
    const permission =
      await databaseService.client.permission.findUniqueOrThrow({
        where: { code: seedInput.permissionCodes[0] },
      })

    seededUserId = first.id
    seededRoleId = role.id
    seededPermissionId = permission.id
    expect(second.id).toBe(first.id)
    expect(role.permissions).toHaveLength(1)
    expect(
      await databaseService.client.user.count({
        where: { email: seedInput.email },
      }),
    ).toBe(1)
  }, 60_000)

  it('inicia, conserva y cierra una sesión HttpOnly', async () => {
    const agent = request.agent(app)
    const login = await agent.post('/api/v1/auth/login').send({
      identifier: identity.username.toUpperCase(),
      password,
    })

    expect(login.status).toBe(200)
    expect(login.body).toMatchObject({
      email: identity.email,
      username: identity.username,
      permissions: [permissionCode],
    })
    expect(login.headers['set-cookie']?.[0]).toContain('HttpOnly')
    expect(login.headers['set-cookie']?.[0]).toContain('SameSite=Lax')

    const me = await agent.get('/api/v1/auth/me')
    expect(me.status).toBe(200)
    expect(me.body.id).toBe(userId)

    const logout = await agent.post('/api/v1/auth/logout')
    expect(logout.status).toBe(204)
    expect((await agent.get('/api/v1/auth/me')).status).toBe(401)
  }, 60_000)

  it('no guarda la contraseña legible y devuelve errores genéricos', async () => {
    const stored = await databaseService.client.user.findUniqueOrThrow({
      where: { id: userId },
      select: { passwordHash: true },
    })
    expect(stored.passwordHash).not.toContain(password)

    const unknown = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: `unknown_${suffix}`,
        password: 'incorrecta',
      })
    const invalid = await request(app).post('/api/v1/auth/login').send({
      identifier: lockedIdentity.email,
      password: 'incorrecta',
    })
    const inactive = await request(app).post('/api/v1/auth/login').send({
      identifier: inactiveIdentity.email,
      password,
    })
    expect(unknown.status).toBe(401)
    expect(invalid.status).toBe(401)
    expect(inactive.status).toBe(401)
    expect(unknown.body.error.message).toBe(invalid.body.error.message)
    expect(unknown.body.error.message).toBe(inactive.body.error.message)
  }, 60_000)

  it('bloquea la cuenta durante quince minutos tras cinco fallos', async () => {
    // El caso anterior registró el primer fallo de esta cuenta.
    for (let attempt = 2; attempt <= 5; attempt += 1) {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: lockedIdentity.username,
          password: `incorrecta-${attempt}`,
        })
      expect(response.status).toBe(401)
    }

    const stored = await databaseService.client.user.findUniqueOrThrow({
      where: { id: lockedUserId },
      select: { failedLoginAttempts: true, lockedUntil: true },
    })
    expect(stored.failedLoginAttempts).toBe(5)
    expect(stored.lockedUntil!.getTime()).toBeGreaterThan(
      Date.now() + 14 * 60 * 1000,
    )

    const blocked = await request(app).post('/api/v1/auth/login').send({
      identifier: lockedIdentity.email,
      password,
    })
    expect(blocked.status).toBe(401)
    expect(blocked.body.error.code).toBe('AUTH_INVALID_CREDENTIALS')
  }, 60_000)

  it('expira por inactividad y deniega permisos ausentes', async () => {
    const agent = request.agent(app)
    const login = await agent.post('/api/v1/auth/login').send({
      identifier: identity.email,
      password,
    })
    expect(login.status).toBe(200)

    const denied = await agent.post('/api/v1/products').send({})
    expect(denied.status).toBe(403)
    expect(denied.body.error.code).toBe('AUTH_FORBIDDEN')

    const cookie = login.headers['set-cookie']?.[0]
    const token = cookie?.match(/torcly_session=([^;]+)/)?.[1]
    expect(token).toBeTruthy()
    await databaseService.client.authSession.update({
      where: { tokenHash: hashSessionToken(decodeURIComponent(token!)) },
      data: { expiresAt: new Date(Date.now() - 1) },
    })

    const expired = await agent.get('/api/v1/auth/me')
    expect(expired.status).toBe(401)
    expect(expired.body.error.code).toBe('AUTH_SESSION_EXPIRED')
  }, 60_000)

  it('conserva la auditoría mínima de seguridad', async () => {
    const records = await databaseService.client.auditLog.findMany({
      where: { userId: { in: [userId, lockedUserId, inactiveUserId] } },
      select: { event: true },
    })
    const events = new Set(records.map((record) => record.event))

    expect([...events]).toEqual(
      expect.arrayContaining([
        'LOGIN_SUCCESS',
        'LOGIN_FAILURE',
        'ACCOUNT_LOCKED',
        'LOGOUT',
        'SESSION_EXPIRED',
        'ACCESS_DENIED',
      ]),
    )
  }, 60_000)
})
