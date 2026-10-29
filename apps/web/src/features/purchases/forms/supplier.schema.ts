import { z } from 'zod'

export const supplierFormSchema = z.object({
  legalName: z
    .string()
    .trim()
    .min(2, 'La razón social debe tener al menos 2 caracteres.')
    .max(150, 'Máximo 150 caracteres.'),
  documentNumber: z
    .string()
    .trim()
    .min(3, 'El documento debe tener al menos 3 caracteres.')
    .max(30, 'Máximo 30 caracteres.'),
  contactName: z.string().trim().max(100, 'Máximo 100 caracteres.').optional(),
  phone: z.string().trim().max(30, 'Máximo 30 caracteres.').optional(),
  email: z
    .string()
    .trim()
    .email('Correo inválido.')
    .or(z.literal(''))
    .optional(),
})

export type SupplierFormValues = z.infer<typeof supplierFormSchema>
