import { z } from 'zod'

const cashAmount = z
  .number()
  .finite('El importe debe ser un número válido.')
  .min(0, 'El importe debe ser cero o mayor.')
  .max(999_999_999, 'El importe es demasiado grande.')
  .refine(
    (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6,
    'El importe solo admite hasta dos decimales.',
  )

const optionalNotes = z
  .string()
  .trim()
  .max(300, 'La observación no puede exceder los 300 caracteres.')
  .optional()

export const cashSessionIdSchema = z.object({
  id: z.uuid('Caja inválida.'),
})

export const cashSessionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(50).default(10),
})

export const cashSessionOpenSchema = z
  .object({
    requestId: z.uuid('El identificador de la operación es inválido.'),
    openingAmount: cashAmount,
    notes: optionalNotes,
  })
  .strict()

export const cashSessionCloseSchema = z
  .object({
    requestId: z.uuid('El identificador de la operación es inválido.'),
    countedCashAmount: cashAmount,
    notes: optionalNotes,
  })
  .strict()

export type CashSessionQueryDto = z.infer<typeof cashSessionQuerySchema>
export type CashSessionOpenDto = z.infer<typeof cashSessionOpenSchema>
export type CashSessionCloseDto = z.infer<typeof cashSessionCloseSchema>
