import { z } from 'zod'
import { isValidDateString } from './appointment.rules.js'

export const appointmentIdSchema = z.object({
  id: z.uuid('Cita inválida.'),
})

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/

export const appointmentQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida.')
    .refine(isValidDateString, 'Fecha inválida.')
    .optional(),
  customerId: z.uuid('Cliente inválido.').optional(),
  status: z.enum(['all', 'PROGRAMADA', 'CANCELADA', 'ATENDIDA']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(20),
})

const appointmentScheduleSchema = z
  .object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida.')
      .refine(isValidDateString, 'Fecha inválida.'),
    time: z.string().regex(timePattern, 'Hora inválida.'),
  })
  .strict()

export const appointmentInputSchema = appointmentScheduleSchema
  .extend({
    customerId: z.uuid('Cliente inválido.'),
    vehicleId: z.uuid('Vehículo inválido.'),
    reason: z
      .string()
      .trim()
      .min(3, 'El motivo es obligatorio.')
      .max(300, 'El motivo no puede exceder los 300 caracteres.'),
  })
  .strict()

export const appointmentRescheduleSchema = appointmentScheduleSchema.strict()

export type AppointmentInputDto = z.infer<typeof appointmentInputSchema>
export type AppointmentRescheduleDto = z.infer<
  typeof appointmentRescheduleSchema
>
export type AppointmentQueryDto = z.infer<typeof appointmentQuerySchema>
