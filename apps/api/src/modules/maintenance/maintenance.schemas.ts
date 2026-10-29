import { z } from 'zod'

export const maintenanceScheduleSchema = z
  .object({
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    message: z
      .string()
      .trim()
      .min(5, 'Describe la ventana con al menos 5 caracteres.')
      .max(300, 'Usa un máximo de 300 caracteres.'),
  })
  .refine((value) => value.endsAt.getTime() > value.startsAt.getTime(), {
    message: 'El fin debe ser posterior al inicio.',
    path: ['endsAt'],
  })

export const maintenanceIdParamSchema = z.object({
  id: z.uuid('El identificador no es válido.'),
})
