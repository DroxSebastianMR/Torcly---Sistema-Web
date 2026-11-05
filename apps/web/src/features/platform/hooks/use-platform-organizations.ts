import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { platformService } from '../services/platform.service'
import type {
  CreatePlatformOrganizationInput,
  CreatePlatformOrganizationMemberInput,
  UpdatePlatformOrganizationInput,
  PlatformOrganizationFilters,
} from '../types/platform.types'

export const platformKeys = {
  all: ['platform'] as const,
  organizations: (filters: PlatformOrganizationFilters) =>
    ['platform', 'organizations', filters] as const,
  roles: ['platform', 'roles'] as const,
  members: (organizationId: string) =>
    ['platform', 'organizations', organizationId, 'members'] as const,
}

export const usePlatformOrganizations = (
  filters: PlatformOrganizationFilters,
) =>
  useQuery({
    queryKey: platformKeys.organizations(filters),
    queryFn: ({ signal }) => platformService.listOrganizations(filters, signal),
    staleTime: 30_000,
  })

export const usePlatformRoles = () =>
  useQuery({
    queryKey: platformKeys.roles,
    queryFn: ({ signal }) => platformService.listRoles(signal),
    staleTime: 5 * 60_000,
  })

export function useCreatePlatformOrganization() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePlatformOrganizationInput) =>
      platformService.createOrganization(input),
    onSuccess: () => client.invalidateQueries({ queryKey: platformKeys.all }),
  })
}

export function useUpdatePlatformOrganization() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({
      organizationId,
      input,
    }: {
      organizationId: string
      input: UpdatePlatformOrganizationInput
    }) => platformService.updateOrganization(organizationId, input),
    onSuccess: () => client.invalidateQueries({ queryKey: platformKeys.all }),
  })
}

export const usePlatformOrganizationMembers = (organizationId?: string) =>
  useQuery({
    queryKey: platformKeys.members(organizationId ?? 'none'),
    queryFn: ({ signal }) =>
      platformService.listOrganizationMembers(organizationId!, signal),
    enabled: Boolean(organizationId),
    staleTime: 30_000,
  })

export function useUpdatePlatformOrganizationStatus() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({
      organizationId,
      active,
    }: {
      organizationId: string
      active: boolean
    }) => platformService.updateOrganizationStatus(organizationId, active),
    onSuccess: () => client.invalidateQueries({ queryKey: platformKeys.all }),
  })
}

export function useCreatePlatformOrganizationMember() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({
      organizationId,
      input,
    }: {
      organizationId: string
      input: CreatePlatformOrganizationMemberInput
    }) => platformService.createOrganizationMember(organizationId, input),
    onSuccess: (_result, variables) =>
      client.invalidateQueries({
        queryKey: platformKeys.members(variables.organizationId),
      }),
  })
}

export function useUpdatePlatformOrganizationMember() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({
      organizationId,
      userId,
      input,
    }: {
      organizationId: string
      userId: string
      input: { active?: boolean; roleId?: string }
    }) =>
      platformService.updateOrganizationMember(organizationId, userId, input),
    onSuccess: (_result, variables) => {
      void client.invalidateQueries({
        queryKey: platformKeys.members(variables.organizationId),
      })
      void client.invalidateQueries({ queryKey: platformKeys.all })
    },
  })
}
