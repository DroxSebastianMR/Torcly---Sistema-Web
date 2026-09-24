import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersService } from '../services/users.service'
import type {
  UserCreateInput,
  UserFilters,
  UserUpdateInput,
} from '../types/users.types'

export const userKeys = {
  all: ['users'] as const,
  list: (filters: UserFilters) => [...userKeys.all, 'list', filters] as const,
  roles: () => [...userKeys.all, 'roles'] as const,
}

export function useUsers(filters: UserFilters) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: ({ signal }) => usersService.list(filters, signal),
    placeholderData: (previous) => previous,
  })
}

export function useUserRoles() {
  return useQuery({
    queryKey: userKeys.roles(),
    queryFn: ({ signal }) => usersService.roles(signal),
    select: (response) => response.data,
  })
}

export function useUserMutations() {
  const queryClient = useQueryClient()
  const refreshUsers = async () => {
    await queryClient.invalidateQueries({ queryKey: userKeys.all })
  }

  return {
    create: useMutation({
      mutationFn: (input: UserCreateInput) => usersService.create(input),
      onSuccess: refreshUsers,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: UserUpdateInput }) =>
        usersService.update(id, input),
      onSuccess: refreshUsers,
    }),
    role: useMutation({
      mutationFn: ({ id, roleId }: { id: string; roleId: string }) =>
        usersService.updateRole(id, roleId),
      onSuccess: refreshUsers,
    }),
    status: useMutation({
      mutationFn: ({ id, active }: { id: string; active: boolean }) =>
        usersService.updateStatus(id, active),
      onSuccess: refreshUsers,
    }),
  }
}
