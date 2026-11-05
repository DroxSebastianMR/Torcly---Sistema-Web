import type { Permission } from '@/lib/permissions'
export interface User {
  id: string
  name: string
  email: string
  username: string
  permissions: Permission[]
  /** Cuenta interna de Torcly, separada de los permisos de un taller. */
  isPlatformAdmin?: boolean
  organization?: {
    id: string
    code: string
    name: string
  }
}
export interface LoginInput {
  identifier: string
  password: string
}

export interface RecoveryInput {
  identifier: string
}
