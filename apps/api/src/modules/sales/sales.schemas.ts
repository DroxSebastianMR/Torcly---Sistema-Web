import { z } from 'zod'

export const saleIdSchema = z.object({
  id: z.uuid('Venta inválida.'),
})

export const saleQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.enum(['all', 'DRAFT', 'CONFIRMED']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(20),
})

export const saleProductLineSchema = z
  .object({
    type: z.literal('PRODUCT'),
    productId: z.uuid('Producto inválido.'),
    quantity: z.coerce
      .number()
      .finite()
      .min(0.001, 'La cantidad debe ser mayor a cero.')
      .max(999_999_999, 'La cantidad es demasiado grande.'),
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

export const saleUpdateSchema = saleInputSchema.strict()

export type SaleInputDto = z.infer<typeof saleInputSchema>
export type SaleQueryDto = z.infer<typeof saleQuerySchema>
