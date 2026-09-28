import { z } from 'zod'

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => value || null)

const basePagination = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(20),
}

export const existenceQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  ...basePagination,
})

export const movementQuerySchema = z.object({
  productId: z.uuid().optional(),
  type: z
    .enum(['INITIAL', 'ENTRY', 'EXIT', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT'])
    .optional(),
  from: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'La fecha inicial debe usar formato AAAA-MM-DD.',
    )
    .optional(),
  to: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'La fecha final debe usar formato AAAA-MM-DD.',
    )
    .optional(),
  ...basePagination,
})

const movementInputSchema = z.object({
  productId: z.uuid('Selecciona un producto.'),
  quantity: z.coerce
    .number()
    .finite()
    .positive('La cantidad debe ser mayor que cero.')
    .max(999_999_999, 'La cantidad supera el límite permitido.'),
  idempotencyKey: z
    .string()
    .trim()
    .min(8, 'La clave de idempotencia debe tener al menos 8 caracteres.')
    .max(100),
  notes: optionalText(300),
  occurredAt: z.coerce.date().optional(),
  referenceType: optionalText(40),
  referenceId: optionalText(80),
})

export const initialStockSchema = movementInputSchema.strict()
export const entrySchema = movementInputSchema.strict()
export const exitSchema = movementInputSchema.strict()

export const adjustmentSchema = movementInputSchema
  .extend({
    quantity: z.coerce
      .number()
      .finite()
      .refine((value) => value !== 0, 'El ajuste no puede ser cero.')
      .max(999_999_999, 'El ajuste supera el límite permitido.'),
  })
  .strict()

export type MovementInputDto = z.infer<typeof movementInputSchema>
export type ExistenceQueryDto = z.infer<typeof existenceQuerySchema>
export type MovementQueryDto = z.infer<typeof movementQuerySchema>
