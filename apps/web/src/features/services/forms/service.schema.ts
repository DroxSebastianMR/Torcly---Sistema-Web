import { z } from 'zod'

export const serviceFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, 'Ingresa un código válido.')
    .max(40)
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9._-]*$/,
      'Usa letras, números, puntos o guiones.',
    ),
  name: z.string().trim().min(2, 'Ingresa el nombre del servicio.').max(120),
  description: z.string().trim().max(500),
  price: z.coerce
    .number<number>()
    .finite()
    .min(0, 'El precio no puede ser negativo.'),
})

export type ServiceFormValues = z.input<typeof serviceFormSchema>
