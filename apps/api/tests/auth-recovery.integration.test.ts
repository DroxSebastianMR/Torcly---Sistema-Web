import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { databaseService } from '../src/infrastructure/database/prisma.service.js'
import { hashPassword } from '../src/modules/auth/password.js'
import {
  setPasswordResetNotifier,
  type PasswordResetMessage,
} from '../src/modules/auth/password-reset-notifier.js'

const runDatabaseTests = process.env.DATABASE_TESTS === 'true'
const describeWithDatabase = describe.runIf(runDatabaseTests)

describeWithDatabase('Recuperación de contraseña con PostgreSQL', () => {
  const app = createApp()
  const suffix = randomUUID().slice(0, 8)
  const identity = {
    username: `recovery_${suffix}`,
    email: `recovery_${suffix}@torcly.local`,
  }
  const initialPassword = `Inicial-${suffix}-2026!`
  const newPassword = `Nueva-${suffix}-2026!`
  const captured: PasswordResetMessage[] = []
  let userId = ''

  beforeAll(async () => {
    await databaseService.connect()
    const user = await databaseService.client.user.create({
      data: {
        username: identity.username,
        email: identity.email,
        displayName: 'Cuenta de recuperación',
        passwordHash: await hashPassword(initialPassword),
      },
    })
    userId = user.id
    setPasswordResetNotifier({
      send: async (message) => {
        captured.push(message)
      },
    })
  }, 60_000)

  afterAll(async () => {
    await databaseService.client.auditLog.deleteMany({
      where: { userId },
    })
    await databaseService.client.user.deleteMany({ where: { id: userId } })
    await databaseService.disconnect()
  }, 60_000)

  it('no revela si la cuenta existe al solicitar recuperación', async () => {
    const existing = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ identifier: identity.email })
    const missing = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ identifier: `missing_${suffix}@torcly.local` })

    expect(existing.status).toBe(200)
    expect(missing.status).toBe(200)
    expect(existing.body).toEqual(missing.body)
  }, 60_000)

  it('restablece con un solo uso e invalida sesiones previas', async () => {
    const agent = request.agent(app)
    const login = await agent.post('/api/v1/auth/login').send({
      identifier: identity.email,
      password: initialPassword,
    })
    expect(login.status).toBe(200)

    captured.length = 0
    await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ identifier: identity.email })
    expect(captured).toHaveLength(1)
    const token = captured[0].token

    const reset = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token, password: newPassword })
    expect(reset.status).toBe(200)

    const reuse = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token, password: `${newPassword}x` })
    expect(reuse.status).toBe(400)
    expect(reuse.body.error.code).toBe('AUTH_RESET_INVALID')

    const revoked = await agent.get('/api/v1/auth/me')
    expect(revoked.status).toBe(401)

    const reLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: identity.email,
      password: newPassword,
    })
    expect(reLogin.status).toBe(200)

    const events = await databaseService.client.auditLog.findMany({
      where: { userId },
      select: { event: true },
    })
    const set = new Set(events.map((event) => event.event))
    expect([...set]).toEqual(
      expect.arrayContaining([
        'PASSWORD_RESET_REQUESTED',
        'PASSWORD_RESET_COMPLETED',
      ]),
    )
  }, 60_000)
})
