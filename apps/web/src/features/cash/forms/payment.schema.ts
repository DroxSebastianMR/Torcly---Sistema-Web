import { z } from 'zod'

const amountSchema = z
  .number()
  .finite('El importe debe ser un número válido.')
  .positive('El importe debe ser mayor a cero.')
  .max(999_999_999, 'El importe es demasiado grande.')
  .refine((value) => {
    const cents = Math.round(value * 100)
    return Math.abs(value * 100 - cents) < 1e-6
  }, 'El importe solo admite hasta dos decimales.')

export const paymentRegisterSchema = z.object({
  amount: amountSchema,
  method: z.enum(['CASH', 'CARD', 'TRANSFER', 'DIGITAL_WALLET']),
  notes: z
    .string()
    .trim()
    .max(300, 'La observación no puede exceder los 300 caracteres.')
    .optional(),
})

export const paymentCompensationSchema = z.object({
  amount: amountSchema,
  reason: z
    .string()
    .trim()
    .min(3, 'El motivo de la compensación es obligatorio.')
    .max(300, 'El motivo no puede exceder los 300 caracteres.'),
  notes: z
    .string()
    .trim()
    .max(300, 'La observación no puede exceder los 300 caracteres.')
    .optional(),
})

export type PaymentRegisterFormValues = z.infer<typeof paymentRegisterSchema>
export type PaymentCompensationFormValues = z.infer<
  typeof paymentCompensationSchema
>
