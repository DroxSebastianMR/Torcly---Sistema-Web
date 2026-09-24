import type { PropsWithChildren } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { AuthContext } from '@/features/auth/hooks/auth-context'
import { authService } from '@/features/auth/services/auth.service'
export function AuthProvider({ children }: PropsWithChildren) {
  const client = useQueryClient()
  const clearBusinessQueries = () =>
    client.removeQueries({
      predicate: (query) => query.queryKey[0] !== 'auth',
    })
  const session = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: async ({ signal }) => {
      try {
        return await authService.me(signal)
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 401) return null
        throw error
      }
    },
    retry: false,
  })
  return (
    <AuthContext.Provider
      value={{
        user: session.data ?? null,
        loading: session.isPending,
        error: session.isError,
        retry: () => {
          void session.refetch()
        },
        login: async (input) => {
          const user = await authService.login(input)
          clearBusinessQueries()
          client.setQueryData(['auth', 'session'], user)
        },
        logout: async () => {
          await authService.logout()
          clearBusinessQueries()
          client.setQueryData(['auth', 'session'], null)
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
