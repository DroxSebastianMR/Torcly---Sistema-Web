import { AppError } from '../../shared/errors/app-error.js'
import type { AuthUser } from './auth.types.js'

export interface OrganizationContext {
  id: string
  code: string
  name: string
}

/**
 * Obtiene el tenant de una solicitud ya autenticada. El valor procede de la
 * sesión y de la membresía resuelta por el servidor, nunca de un identificador
 * enviado por el navegador.
 */
export function requireOrganizationContext(
  user: AuthUser | undefined,
): OrganizationContext {
  if (!user) {
    throw new AppError(401, 'AUTH_REQUIRED', 'Debes iniciar sesión.')
  }

  if (!user.organization) {
    throw new AppError(
      403,
      'ORGANIZATION_CONTEXT_REQUIRED',
      'Selecciona una organización válida para continuar.',
    )
  }

  return user.organization
}

/**
 * Protege capacidades internas de Torcly. Ser administrador de plataforma no
 * concede permisos de un taller: el acceso operativo siempre requiere una
 * membresía de organización y sus permisos explícitos.
 */
export function requirePlatformAdministrator(user: AuthUser | undefined): void {
  if (!user) {
    throw new AppError(401, 'AUTH_REQUIRED', 'Debes iniciar sesión.')
  }

  if (!user.isPlatformAdmin) {
    throw new AppError(
      403,
      'PLATFORM_ACCESS_FORBIDDEN',
      'No tienes acceso a la administración de plataforma.',
    )
  }
}
