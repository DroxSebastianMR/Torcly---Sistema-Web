import { describe, expect, it, vi, beforeEach } from 'vitest'
import { platformService } from '../src/modules/platform/platform.service.js'
import { databaseService } from '../src/infrastructure/database/prisma.service.js'
import { authService } from '../src/modules/auth/auth.service.js'

describe('Platform Impersonation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects impersonation if requester is not a platform admin', async () => {
    await expect(
      platformService.impersonateOrganization('org-1', {
        id: 'user-1',
        name: 'Mecánico',
        email: 'mec@example.com',
        username: 'mecanico',
        permissions: [],
        isPlatformAdmin: false,
      }),
    ).rejects.toThrow('Solo administradores de plataforma pueden usar el modo soporte.')
  })

  it('rejects impersonation if target organization does not exist', async () => {
    vi.spyOn(databaseService.client.organization, 'findUnique').mockResolvedValueOnce(null)

    await expect(
      platformService.impersonateOrganization('org-not-found', {
        id: 'admin-1',
        name: 'Super Admin',
        email: 'super@torcly.com',
        username: 'superadmin',
        permissions: [],
        isPlatformAdmin: true,
      }),
    ).rejects.toThrow('No se encontró la organización.')
  })

  it('successfully creates impersonation session for organization owner/admin', async () => {
    const mockOrg = {
      id: 'org-test',
      code: 'ORG-TEST',
      name: 'Taller San Martín',
      active: true,
      memberships: [
        {
          id: 'mem-1',
          userId: 'user-taller-owner',
          organizationId: 'org-test',
          active: true,
          role: {
            code: 'owner',
            name: 'Dueño del taller',
            permissions: [
              { permission: { code: 'customers:read' } },
              { permission: { code: 'work_orders:read' } },
            ],
          },
          user: {
            id: 'user-taller-owner',
            displayName: 'Roberto Gómez',
            email: 'roberto@taller.com',
            username: 'robertog',
            isPlatformAdmin: false,
          },
        },
      ],
    }

    vi.spyOn(databaseService.client.organization, 'findUnique').mockResolvedValueOnce(mockOrg as any)
    vi.spyOn(databaseService.client.authSession, 'create').mockResolvedValueOnce({} as any)
    vi.spyOn(databaseService.client.auditLog, 'create').mockResolvedValueOnce({} as any)

    const result = await platformService.impersonateOrganization('org-test', {
      id: 'admin-super',
      name: 'Super Admin Torcly',
      email: 'admin@torcly.com',
      username: 'admin',
      permissions: [],
      isPlatformAdmin: true,
    })

    expect(result.token).toBeDefined()
    expect(result.user.id).toBe('user-taller-owner')
    expect(result.user.name).toBe('Roberto Gómez')
    expect(result.user.organization?.name).toBe('Taller San Martín')
    expect(result.user.impersonatedBy).toEqual({
      id: 'admin-super',
      name: 'Super Admin Torcly',
      email: 'admin@torcly.com',
    })
    expect(result.user.permissions).toContain('customers:read')
    expect(result.user.permissions).toContain('work_orders:read')
  })

  it('successfully exits impersonation and returns original admin user', async () => {
    vi.spyOn(databaseService.client.authSession, 'deleteMany').mockResolvedValueOnce({ count: 1 } as any)
    vi.spyOn(authService, 'authenticate').mockResolvedValueOnce({
      tokenHash: 'hash-admin',
      user: {
        id: 'admin-super',
        name: 'Super Admin Torcly',
        email: 'admin@torcly.com',
        username: 'admin',
        permissions: [],
        isPlatformAdmin: true,
      },
    })

    const result = await platformService.exitImpersonation('impersonation-token-hash', 'admin-token')

    expect(result.id).toBe('admin-super')
    expect(result.isPlatformAdmin).toBe(true)
  })
})
