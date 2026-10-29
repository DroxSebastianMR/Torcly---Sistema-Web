import { z } from 'zod'

export const MAX_PAYMENT_AMOUNT = 999_999_999

const amountTextPattern = /^\d+(?:\.\d{0,2})?$/

export function parsePaymentAmount(value: string): number | null {
  const trimmed = value.trim()
  if (!amountTextPattern.test(trimmed)) return null
  const amount = Number(trimmed)
  return Number.isFinite(amount) ? amount : null
}

export function formatPaymentAmount(amount: number): string {
  return Number.isFinite(amount) ? amount.toFixed(2) : ''
}

const amountSchema = z
  .string()
  .trim()
  .min(1, 'El importe es obligatorio.')
  .superRefine((value, context) => {
    const amount = parsePaymentAmount(value)
    if (amount === null) {
      context.addIssue({
        code: 'custom',
        message:
          'El importe debe ser un número válido con hasta dos decimales.',
      })
      return
    }
    if (amount <= 0) {
      context.addIssue({
        code: 'custom',
        message: 'El importe debe ser mayor a cero.',
      })
      return
    }
    if (amount > MAX_PAYMENT_AMOUNT) {
      context.addIssue({
        code: 'custom',
        message: 'El importe es demasiado grande.',
      })
    }
  })

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
