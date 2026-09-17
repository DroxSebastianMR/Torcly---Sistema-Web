import { useState, type PropsWithChildren } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { AuthContext } from '@/features/auth/hooks/auth-context'
import { authService } from '@/features/auth/services/auth.service'
import type { User } from '@/features/auth/types/auth.types'
import { env } from '@/app/config/env'
import { modules } from '@/lib/permissions'
export function AuthProvider({ children }: PropsWithChildren) {
  const client = useQueryClient()
  const [demo, setDemo] = useState<User | null>(null)
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
    enabled: !env.demo,
  })
  return (
    <AuthContext.Provider
      value={{
        user: demo ?? session.data ?? null,
        loading: !env.demo && session.isPending,
        error: !env.demo && session.isError,
        retry: () => {
          void session.refetch()
        },
        login: async (input) => {
          const user = await authService.login(input)
          client.clear()
          setDemo(null)
          client.setQueryData(['auth', 'session'], user)
        },
        logout: async () => {
          if (!demo) await authService.logout()
          setDemo(null)
          client.clear()
          client.setQueryData(['auth', 'session'], null)
        },
        enterDemo: () => {
          if (env.demo)
            setDemo({
              id: 'demo',
              name: 'Usuario de demostración',
              email: 'demo@torcly.local',
              permissions: modules.map((module) => `${module}:read` as const),
            })
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
