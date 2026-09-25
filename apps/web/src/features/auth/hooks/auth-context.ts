import { createContext, useContext } from 'react'
import type { LoginInput, User } from '../types/auth.types'
export interface AuthContextValue {
  user: User | null
  loading: boolean
  error: boolean
  errorDetail?: unknown
  retry: () => void
  login: (input: LoginInput) => Promise<void>
  logout: () => Promise<void>
}
export const AuthContext = createContext<AuthContextValue | null>(null)
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('AuthProvider requerido')
  return context
}
