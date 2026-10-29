import { api } from '@/infrastructure/api/client'
import { endpoints } from '@/infrastructure/api/endpoints'
import type {
  ChangePasswordInput,
  ProfileData,
  UpdateProfileInput,
} from '../types/profile.types'

export const profileService = {
  getProfile(signal?: AbortSignal) {
    return api.get<ProfileData>(endpoints.profile.root, signal)
  },

  updateProfile(input: UpdateProfileInput) {
    return api.put<ProfileData>(endpoints.profile.root, input)
  },

  changePassword(input: ChangePasswordInput) {
    return api.post<{ status: string; message: string }>(
      endpoints.profile.changePassword,
      input,
    )
  },
}
