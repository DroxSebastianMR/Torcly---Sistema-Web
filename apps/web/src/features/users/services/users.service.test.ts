import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
}))

vi.mock('@/infrastructure/api/client', () => ({ api }))

import { usersService } from './users.service'

describe('Servicio de usuarios', () => {
  beforeEach(() => {
    api.get.mockReset()
    api.post.mockReset()
    api.put.mockReset()
    api.patch.mockReset()
    api.get.mockResolvedValue({ data: [] })
    api.post.mockResolvedValue({ data: {} })
    api.put.mockResolvedValue({ data: {} })
    api.patch.mockResolvedValue({ data: {} })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('lista usuarios con filtros y paginación', async () => {
    await usersService.list({
      search: 'juan',
      status: 'active',
      page: 2,
      pageSize: 50,
    })

    expect(api.get).toHaveBeenCalledWith(
      '/users?status=active&page=2&pageSize=50&search=juan',
      undefined,
    )
  })

  it('consulta los roles disponibles para formularios', async () => {
    await usersService.roles()
    expect(api.get).toHaveBeenCalledWith('/users/roles', undefined)
  })

  it('crea, actualiza, cambia rol y estado con los endpoints correctos', async () => {
    const roleId = '3f0d0d5a-2b8a-4c19-9d3e-4f1b2c3d4e5f'
    await usersService.create({
      username: 'jperez',
      email: 'jperez@torcly.local',
      displayName: 'Juan Pérez',
      password: 'Clave-segura-123',
      roleId,
    })
    expect(api.post).toHaveBeenCalledWith('/users', expect.objectContaining({}))

    await usersService.update('u1', {
      email: 'otro@torcly.local',
      displayName: 'Otro',
    })
    expect(api.put).toHaveBeenCalledWith(
      '/users/u1',
      expect.objectContaining({}),
    )

    await usersService.updateRole('u1', roleId)
    expect(api.patch).toHaveBeenCalledWith('/users/u1/role', { roleId })

    await usersService.updateStatus('u1', false)
    expect(api.patch).toHaveBeenCalledWith('/users/u1/status', {
      active: false,
    })
  })
})
