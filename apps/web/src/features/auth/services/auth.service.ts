import { api } from '@/infrastructure/api/client'
import { endpoints } from '@/infrastructure/api/endpoints'
import type { User, LoginInput, RecoveryInput } from '../types/auth.types'
export const authService = {
  me: (signal?: AbortSignal) => api.get<User>(endpoints.auth.me, signal),
  login: (input: LoginInput) => api.post<User>(endpoints.auth.login, input),
  logout: () => api.post<void>(endpoints.auth.logout),
  forgotPassword: (input: RecoveryInput) =>
    api.post<void>(endpoints.auth.forgotPassword, input),
  resetPassword: (password: string, token: string) =>
    api.post<void>(endpoints.auth.resetPassword, { password, token }),
}
