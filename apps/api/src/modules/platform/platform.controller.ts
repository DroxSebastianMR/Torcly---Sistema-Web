import type { RequestHandler } from 'express'

/**
 * Punto de entrada mínimo para la consola interna. No entrega datos de
 * talleres; permite que el frontend compruebe el acceso de plataforma.
 */
export const getPlatformAccess: RequestHandler = (_request, response) => {
  response.status(200).json({
    data: {
      access: 'platform',
    },
  })
}
