import { z } from 'zod'

export const productFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, 'Ingresa un código válido.')
    .max(40)
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9._-]*$/,
      'Usa letras, números, puntos o guiones.',
    ),
  barcode: z
    .string()
    .trim()
    .max(32)
    .refine(
      (value) => !value || /^[A-Za-z0-9-]{4,32}$/.test(value),
      'El código de barras no es válido.',
    ),
  name: z.string().trim().min(2, 'Ingresa el nombre.').max(120),
  description: z.string().trim().max(500),
  categoryId: z.string().min(1, 'Selecciona una categoría.'),
  brandId: z.string(),
  unitId: z.string().min(1, 'Selecciona una unidad.'),
  salePrice: z.coerce
    .number<number>()
    .finite()
    .min(0, 'El precio no puede ser negativo.'),
  minimumStock: z.coerce
    .number<number>()
    .finite()
    .min(0, 'El stock mínimo no puede ser negativo.'),
})

export type ProductFormValues = z.input<typeof productFormSchema>
