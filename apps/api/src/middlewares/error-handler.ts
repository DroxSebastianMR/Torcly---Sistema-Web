import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'
import { AppError } from '../shared/errors/app-error.js'

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _request,
  response,
  next,
) => {
  if (response.headersSent) {
    next(error)
    return
  }
  const parseError =
    error instanceof SyntaxError &&
    'type' in error &&
    error.type === 'entity.parse.failed'
  const tooLarge =
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === 'entity.too.large'
  const validationError = error instanceof ZodError
  const status =
    error instanceof AppError
      ? error.status
      : validationError
        ? 400
        : parseError
          ? 400
          : tooLarge
            ? 413
            : 500
  const code =
    error instanceof AppError
      ? error.code
      : validationError
        ? 'VALIDATION_ERROR'
        : parseError
          ? 'INVALID_JSON'
          : tooLarge
            ? 'PAYLOAD_TOO_LARGE'
            : 'INTERNAL_ERROR'
  const message =
    error instanceof AppError
      ? error.message
      : validationError
        ? 'Revisa los datos ingresados.'
        : parseError
          ? 'El cuerpo JSON no es válido.'
          : tooLarge
            ? 'La solicitud supera el tamaño permitido.'
            : 'No se pudo procesar la solicitud.'
  if (status >= 500)
    console.error(
      JSON.stringify({
        level: 'error',
        requestId: response.locals.requestId,
        code,
      }),
    )
  response.status(status).json({
    error: {
      code,
      message,
      requestId: response.locals.requestId,
      ...(validationError
        ? {
            fields: error.issues.map((issue) => ({
              field: issue.path.join('.'),
              message: issue.message,
            })),
          }
        : {}),
    },
  })
}
