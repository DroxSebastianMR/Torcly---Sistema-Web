export interface AuthUser {
  id: string
  name: string
  email: string
  username: string
  permissions: string[]
  isPlatformAdmin?: boolean
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
