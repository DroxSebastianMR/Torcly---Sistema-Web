import { z } from 'zod'
import {
  hasAtMostThreeDecimals,
  QUANTITY_MAX_DECIMALS_MESSAGE,
} from '../../shared/validation/quantity.js'

export const quotationIdSchema = z.object({
  id: z.uuid('Cotización inválida.'),
})

export const quotationQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z
    .enum(['all', 'DRAFT', 'SENT', 'APPROVED', 'EXPIRED', 'REJECTED'])
    .default('all'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(10),
})

export const quotationItemSchema = z
  .object({
    type: z.enum(['PRODUCT', 'SERVICE']),
    productId: z.uuid('Producto inválido.').nullish(),
    serviceId: z.uuid('Servicio inválido.').nullish(),
    name: z.string().trim().min(1, 'Nombre requerido.').max(120),
    code: z.string().trim().min(1, 'Código requerido.').max(50),
    unitLabel: z.string().trim().max(30).nullish(),
    unitPrice: z.coerce
      .number()
      .finite()
      .nonnegative('El precio unitario no puede ser negativo.')
      .max(999_999_999, 'Precio demasiado alto.'),
    quantity: z.coerce
      .number()
      .finite()
      .min(0.001, 'La cantidad debe ser mayor a cero.')
      .max(999_999_999, 'La cantidad es demasiado grande.')
      .refine(hasAtMostThreeDecimals, QUANTITY_MAX_DECIMALS_MESSAGE),
  })
  .strict()

export const quotationCreateSchema = z
  .object({
    customerId: z.uuid('Cliente inválido.').nullish(),
    vehicleId: z.uuid('Vehículo inválido.').nullish(),
    vehiclePlate: z
      .string()
      .trim()
      .max(20, 'La placa no puede exceder 20 caracteres.')
      .nullish(),
    validUntil: z.string().trim().nullish(),
    notes: z.string().trim().max(500, 'Notas máximo 500 caracteres.').nullish(),
    items: z
      .array(quotationItemSchema)
      .min(1, 'Agrega al menos un ítem al presupuesto.')
      .max(100, 'Máximo 100 ítems permitidos.'),
  })
  .strict()

export const quotationUpdateSchema = quotationCreateSchema
  .extend({
    status: z
      .enum(['DRAFT', 'SENT', 'APPROVED', 'EXPIRED', 'REJECTED'])
      .optional(),
  })
  .strict()

export type QuotationCreateDto = z.infer<typeof quotationCreateSchema>
export type QuotationUpdateDto = z.infer<typeof quotationUpdateSchema>
export type QuotationQueryDto = z.infer<typeof quotationQuerySchema>
