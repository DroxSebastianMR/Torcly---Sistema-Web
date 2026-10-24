import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { profileService } from '../services/profile.service'
import type {
  ChangePasswordInput,
  UpdateProfileInput,
} from '../types/profile.types'

export const profileKeys = {
  all: ['profile'] as const,
  detail: () => [...profileKeys.all, 'detail'] as const,
}

export function useProfile() {
  return useQuery({
    queryKey: profileKeys.detail(),
    queryFn: ({ signal }) => profileService.getProfile(signal),
  })
}

export function useProfileMutations() {
  const queryClient = useQueryClient()

  return {
    updateProfile: useMutation({
      mutationFn: (input: UpdateProfileInput) =>
        profileService.updateProfile(input),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: profileKeys.all })
      },
    }),
    changePassword: useMutation({
      mutationFn: (input: ChangePasswordInput) =>
        profileService.changePassword(input),
    }),
  }
}
