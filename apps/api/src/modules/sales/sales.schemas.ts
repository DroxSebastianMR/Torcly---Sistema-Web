import { z } from 'zod'
import {
  hasAtMostThreeDecimals,
  QUANTITY_MAX_DECIMALS_MESSAGE,
} from '../../shared/validation/quantity.js'

export const saleIdSchema = z.object({
  id: z.uuid('Venta inválida.'),
})

export const saleQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.enum(['all', 'DRAFT', 'CONFIRMED', 'CANCELLED']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(10),
})

export const saleProductLineSchema = z
  .object({
    type: z.literal('PRODUCT'),
    productId: z.uuid('Producto inválido.'),
    quantity: z.coerce
      .number()
      .finite()
      .min(0.001, 'La cantidad debe ser mayor a cero.')
      .max(999_999_999, 'La cantidad es demasiado grande.')
      .refine(hasAtMostThreeDecimals, QUANTITY_MAX_DECIMALS_MESSAGE),
  })
  .strict()

export const saleServiceLineSchema = z
  .object({
    type: z.literal('SERVICE'),
    serviceId: z.uuid('Servicio inválido.'),
  })
  .strict()

export const saleLineInputSchema = z.discriminatedUnion('type', [
  saleProductLineSchema,
  saleServiceLineSchema,
])

export const saleInputSchema = z
  .object({
    customerId: z
      .uuid('Cliente inválido.')
      .nullish()
      .transform((value) => value ?? null),
    lines: z
      .array(saleLineInputSchema)
      .min(1, 'Agrega al menos un producto o servicio.')
      .max(100, 'Se permite un máximo de 100 líneas por venta.'),
  })
  .strict()

export const saleCreateSchema = saleInputSchema.extend({
  confirm: z.boolean().optional().default(false),
})

export const saleUpdateSchema = saleInputSchema.strict()

export const saleCancelSchema = z
  .object({
    reason: z
      .string()
      .trim()
      .min(3, 'Indica un motivo de anulación de al menos 3 caracteres.')
      .max(300, 'El motivo no puede superar 300 caracteres.'),
  })
  .strict()

export const splitPaymentItemSchema = z
  .object({
    method: z.enum(['CASH', 'CARD', 'TRANSFER', 'DIGITAL_WALLET']),
    amount: z.coerce.number().positive('El monto debe ser mayor a cero.'),
  })
  .strict()

export const saleConfirmAndPaySchema = z
  .object({
    paymentMethod: z.enum([
      'CASH',
      'CARD',
      'TRANSFER',
      'DIGITAL_WALLET',
      'MIXED',
    ]),
    amountPaid: z.coerce
      .number()
      .positive('El monto a cobrar debe ser mayor a cero.'),
    cashReceived: z.coerce.number().positive().optional(),
    cashChange: z.coerce.number().nonnegative().optional(),
    notes: z.string().trim().max(300).optional(),
    splitPayments: z.array(splitPaymentItemSchema).optional(),
  })
  .strict()

export type SaleInputDto = z.infer<typeof saleInputSchema>
export type SaleQueryDto = z.infer<typeof saleQuerySchema>
export type SaleConfirmAndPayDto = z.infer<typeof saleConfirmAndPaySchema>
