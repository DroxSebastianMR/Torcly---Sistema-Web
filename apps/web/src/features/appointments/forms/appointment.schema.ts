import { z } from 'zod'
import { isSlotPast } from '../utils/appointment-formatters'

const dateValue = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: 'Selecciona una fecha.',
})

const timeValue = z
  .string()
  .regex(/^\d{2}:\d{2}$/, {
    message: 'Selecciona una hora.',
  })
  .refine((time) => time >= '08:00' && time <= '16:00', {
    message: 'La hora debe estar entre las 08:00 y las 16:00.',
  })

export const appointmentFormSchema = z
  .object({
    customerId: z.string().min(1, 'Selecciona un cliente.'),
    vehicleId: z.string().min(1, 'Selecciona un vehículo.'),
    date: dateValue,
    time: timeValue,
    reason: z
      .string()
      .trim()
      .min(3, 'El motivo debe tener al menos 3 caracteres.')
      .max(300, 'El motivo no puede exceder los 300 caracteres.'),
  })
  .superRefine((values, ctx) => {
    if (isSlotPast(values.date, values.time)) {
      ctx.addIssue({
        code: 'custom',
        path: ['time'],
        message: 'La fecha y hora no pueden estar en el pasado.',
      })
    }
  })

export const appointmentRescheduleFormSchema = z
  .object({
    date: dateValue,
    time: timeValue,
  })
  .superRefine((values, ctx) => {
    if (isSlotPast(values.date, values.time)) {
      ctx.addIssue({
        code: 'custom',
        path: ['time'],
        message: 'La fecha y hora no pueden estar en el pasado.',
      })
    }
  })

export type AppointmentFormValues = z.infer<typeof appointmentFormSchema>
export type AppointmentRescheduleFormValues = z.infer<
  typeof appointmentRescheduleFormSchema
>
