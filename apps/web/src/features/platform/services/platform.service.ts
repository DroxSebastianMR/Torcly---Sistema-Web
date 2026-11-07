import { api } from '@/infrastructure/api/client'
import { endpoints } from '@/infrastructure/api/endpoints'
import type { User } from '@/features/auth/types/auth.types'
import type {
  CreatePlatformOrganizationInput,
  CreatePlatformOrganizationMemberInput,
  PlatformOrganization,
  PlatformOrganizationFilters,
  PlatformOrganizationsResponse,
  PlatformRole,
  PlatformOrganizationMember,
  UpdatePlatformOrganizationInput,
} from '../types/platform.types'

function query(filters: PlatformOrganizationFilters) {
  const params = new URLSearchParams({
    status: filters.status,
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  })
  if (filters.search.trim()) params.set('search', filters.search.trim())
  return params.toString()
}

export const platformService = {
  listOrganizations: (
    filters: PlatformOrganizationFilters,
    signal?: AbortSignal,
  ) =>
    api.get<PlatformOrganizationsResponse>(
      `${endpoints.platform.organizations}?${query(filters)}`,
      signal,
    ),
  listRoles: (signal?: AbortSignal) =>
    api.get<{ data: PlatformRole[] }>(endpoints.platform.roles, signal),
  createOrganization: (input: CreatePlatformOrganizationInput) =>
    api.post<{ data: PlatformOrganization }>(
      endpoints.platform.organizations,
      input,
    ),
  updateOrganization: (
    organizationId: string,
    input: UpdatePlatformOrganizationInput,
  ) =>
    api.patch<{ data: PlatformOrganization }>(
      endpoints.platform.organization(organizationId),
      input,
    ),
  updateOrganizationStatus: (organizationId: string, active: boolean) =>
    api.patch<{ data: PlatformOrganization }>(
      endpoints.platform.organizationStatus(organizationId),
      { active },
    ),
  listOrganizationMembers: (organizationId: string, signal?: AbortSignal) =>
    api.get<{ data: PlatformOrganizationMember[] }>(
      endpoints.platform.organizationMembers(organizationId),
      signal,
    ),
  createOrganizationMember: (
    organizationId: string,
    input: CreatePlatformOrganizationMemberInput,
  ) =>
    api.post<{ data: PlatformOrganizationMember }>(
      endpoints.platform.organizationMembers(organizationId),
      input,
    ),
  updateOrganizationMember: (
    organizationId: string,
    userId: string,
    input: { active?: boolean; roleId?: string },
  ) =>
    api.patch<{ data: PlatformOrganizationMember }>(
      endpoints.platform.organizationMember(organizationId, userId),
      input,
    ),
  resetMemberPassword: (organizationId: string, userId: string) =>
    api.post<{
      data: {
        temporaryPassword: string
        member: PlatformOrganizationMember
      }
    }>(
      endpoints.platform.organizationMemberResetPassword(
        organizationId,
        userId,
      ),
    ),
  impersonateOrganization: (organizationId: string) =>
    api.post<{ data: User }>(endpoints.platform.impersonate(organizationId)),
  exitImpersonation: () =>
    api.post<{ data: User }>(endpoints.platform.exitImpersonation),
}
