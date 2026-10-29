import { z } from 'zod'

export const paymentIdSchema = z.object({
  id: z.uuid('Venta inválida.'),
})

export const paymentIdParamSchema = z.object({
  paymentId: z.uuid('Pago inválido.'),
})

export const paymentQuerySchema = z.object({
  search: z.string().trim().max(120).default(''),
  status: z.enum(['all', 'PENDING', 'PARTIALLY_PAID', 'PAID']).default('all'),
  method: z
    .enum(['all', 'CASH', 'CARD', 'TRANSFER', 'DIGITAL_WALLET'])
    .default('all'),
  from: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'La fecha inicial debe tener formato AAAA-MM-DD.',
    )
    .optional(),
  to: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'La fecha final debe tener formato AAAA-MM-DD.',
    )
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(20),
})

const paymentAmountSchema = z
  .number()
  .finite('El importe debe ser un número válido.')
  .positive('El importe debe ser mayor a cero.')
  .max(999_999_999, 'El importe es demasiado grande.')
  .refine((value) => {
    const cents = Math.round(value * 100)
    return Math.abs(value * 100 - cents) < 1e-6
  }, 'El importe solo admite hasta dos decimales.')

export const paymentRegisterSchema = z
  .object({
    requestId: z.uuid('El identificador de la operación es inválido.'),
    amount: paymentAmountSchema,
    method: z.enum(['CASH', 'CARD', 'TRANSFER', 'DIGITAL_WALLET']),
    notes: z
      .string()
      .trim()
      .max(300, 'La observación no puede exceder los 300 caracteres.')
      .optional(),
  })
  .strict()

export const paymentCompensateSchema = z
  .object({
    requestId: z.uuid('El identificador de la operación es inválido.'),
    amount: paymentAmountSchema,
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
  .strict()

export type PaymentQueryDto = z.infer<typeof paymentQuerySchema>
export type PaymentRegisterDto = z.infer<typeof paymentRegisterSchema>
export type PaymentCompensateDto = z.infer<typeof paymentCompensateSchema>
