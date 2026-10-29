import { isAxiosError } from 'axios'

type LoginErrorResponse = {
  error?: {
    code?: string
    details?: {
      attemptsRemaining?: unknown
      lockedUntil?: unknown
      lockMinutes?: unknown
      maximumAttempts?: unknown
    }
  }
}

function asPositiveInteger(value: unknown) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
    ? value
    : null
}

export function getLoginFeedback(error: unknown) {
  if (!isAxiosError<LoginErrorResponse>(error)) {
    return {
      title: 'No se pudo iniciar sesión',
      description: 'Revisa tus credenciales y la conexión.',
    }
  }

  const response = error.response?.data.error
  if (response?.code === 'AUTH_LOGIN_LOCKED') {
    const lockMinutes = asPositiveInteger(response.details?.lockMinutes) ?? 15
    const maximumAttempts =
      asPositiveInteger(response.details?.maximumAttempts) ?? 5
    const lockedUntil = response.details?.lockedUntil
    const formattedUntil =
      typeof lockedUntil === 'string' && !Number.isNaN(Date.parse(lockedUntil))
        ? new Intl.DateTimeFormat('es-PE', {
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date(lockedUntil))
        : null

    return {
      title: 'Inicio de sesión bloqueado',
      description: formattedUntil
        ? `Alcanzaste el máximo de ${maximumAttempts} intentos. Inténtalo nuevamente a las ${formattedUntil}.`
        : `Alcanzaste el máximo de ${maximumAttempts} intentos. Espera ${lockMinutes} minutos antes de volver a intentarlo.`,
    }
  }

  const attemptsRemaining = asPositiveInteger(
    response?.details?.attemptsRemaining,
  )
  if (attemptsRemaining !== null) {
    const lockMinutes = asPositiveInteger(response?.details?.lockMinutes) ?? 15
    const intentos = attemptsRemaining === 1 ? 'intento' : 'intentos'
    return {
      title: 'Contraseña incorrecta',
      description: `Te quedan ${attemptsRemaining} ${intentos} antes del bloqueo temporal de ${lockMinutes} minutos.`,
    }
  }

  return {
    title: 'No se pudo iniciar sesión',
    description: 'Revisa tus credenciales y la conexión.',
  }
}
