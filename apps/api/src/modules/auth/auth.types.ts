export interface AuthUser {
  id: string
  name: string
  email: string
  username: string
  permissions: string[]
  isPlatformAdmin?: boolean
  role?: {
    code: string
    name: string
  }
  organization?: {
    id: string
    code: string
    name: string
  }
}

export interface RequestContext {
  requestId?: string
  ipAddress?: string
  userAgent?: string
  /** Tenant resuelto por la sesión autenticada; nunca procede del cliente. */
  organizationId?: string
}

export interface LoginInput {
  identifier: string
  password: string
}

export interface PasswordRecoveryRequestInput {
  identifier: string
}

export interface PasswordResetInput {
  token: string
  password: string
}
