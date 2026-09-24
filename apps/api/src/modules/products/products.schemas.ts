import { z } from 'zod'

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => value || null)

export const productIdSchema = z.object({
  id: z.uuid('Producto inválido.'),
})

export const productQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  categoryId: z.uuid().optional(),
  status: z.enum(['all', 'active', 'inactive']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(20),
})

export const productInputSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, 'El código debe tener al menos 2 caracteres.')
    .max(40)
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9._-]*$/,
      'Usa letras, números, puntos, guiones o guion bajo.',
    )
    .transform((value) => value.toUpperCase()),
  barcode: optionalText(32).refine(
    (value) => value === null || /^[A-Za-z0-9-]{4,32}$/.test(value),
    'El código de barras no tiene un formato válido.',
  ),
  name: z.string().trim().min(2, 'Ingresa el nombre del producto.').max(120),
  description: optionalText(500),
  categoryId: z.uuid('Selecciona una categoría.'),
  brandId: z.uuid('Selecciona una marca válida.').optional().nullable(),
  unitId: z.uuid('Selecciona una unidad.'),
  salePrice: z.coerce
    .number()
    .finite()
    .min(0, 'El precio no puede ser negativo.')
    .max(9_999_999_999),
  minimumStock: z.coerce
    .number()
    .finite()
    .min(0, 'El stock mínimo no puede ser negativo.')
    .max(999_999_999),
})

export const productStatusSchema = z.object({
  active: z.boolean(),
})

export const catalogItemSchema = z.object({
  name: z.string().trim().min(2, 'Ingresa un nombre.').max(80),
})

export const unitInputSchema = catalogItemSchema.extend({
  symbol: z.string().trim().min(1, 'Ingresa un símbolo.').max(12),
})

export type ProductInputDto = z.infer<typeof productInputSchema>
export type ProductQueryDto = z.infer<typeof productQuerySchema>
