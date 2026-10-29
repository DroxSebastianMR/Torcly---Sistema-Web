import type { Permission } from '@/lib/permissions'
export interface User {
  id: string
  name: string
  email: string
  username: string
  permissions: Permission[]
}
export interface LoginInput {
  identifier: string
  password: string
}

export interface RecoveryInput {
  identifier: string
}
