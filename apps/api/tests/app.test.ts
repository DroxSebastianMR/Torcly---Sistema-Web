import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
const app = createApp()
describe('Base HTTP', () => {
  it('expone la salud de la API y cabeceras', async () => {
    const response = await request(app).get('/api/v1/health')
    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ status: 'ok', service: 'torcly-api' })
    expect(response.headers['x-request-id']).toBeTruthy()
    expect(response.headers['x-powered-by']).toBeUndefined()
  })
  it('responde 404 con error uniforme', async () => {
    const response = await request(app).get('/api/v1/missing')
    expect(response.status).toBe(404)
    expect(response.body.error.code).toBe('NOT_FOUND')
  })
  it('maneja JSON inválido sin filtrar detalles internos', async () => {
    const response = await request(app)
      .post('/api/v1/health')
      .set('Content-Type', 'application/json')
      .send('{')
    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('INVALID_JSON')
  })
  it('responde validación uniforme en autenticación', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({})
    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
    expect(response.body.error.fields.length).toBeGreaterThan(0)
  })
  it('protege sesión y módulos de negocio', async () => {
    const session = await request(app).get('/api/v1/auth/me')
    const products = await request(app).get('/api/v1/products')
    expect(session.status).toBe(401)
    expect(session.body.error.code).toBe('AUTH_REQUIRED')
    expect(products.status).toBe(401)
    expect(products.body.error.code).toBe('AUTH_REQUIRED')
  })
  it('permite el origen de desarrollo', async () => {
    const response = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'http://localhost:5173')
    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:5173',
    )
  })
  it('no autoriza orígenes fuera de la lista', async () => {
    const response = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'https://unknown.example')
    expect(response.headers['access-control-allow-origin']).toBeUndefined()
  })
})
