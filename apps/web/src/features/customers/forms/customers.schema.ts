import { z } from 'zod'

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{5,14}$/, 'Ingresa un teléfono válido.')

const emailSchema = z
  .string()
  .trim()
  .max(254, 'El correo no puede superar 254 caracteres.')
  .refine(
    (value) => value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    'Ingresa un correo electrónico válido.',
  )

export const customerInputSchema = z
  .object({
    type: z.enum(['NATURAL', 'LEGAL']),
    documentNumber: z.string().trim().min(1, 'Ingresa el documento.'),
    firstName: z.string().trim(),
    lastName: z.string().trim(),
    legalName: z.string().trim(),
    phone: phoneSchema,
    email: emailSchema,
  })
  .superRefine((values, context) => {
    const isNatural = values.type === 'NATURAL'
    const documentRegExp = isNatural ? /^\d{8}$/ : /^\d{11}$/
    if (!documentRegExp.test(values.documentNumber)) {
      context.addIssue({
        code: 'custom',
        path: ['documentNumber'],
        message: isNatural
          ? 'El DNI debe tener 8 dígitos.'
          : 'El RUC debe tener 11 dígitos.',
      })
    }

    if (isNatural) {
      if (!values.firstName) {
        context.addIssue({
          code: 'custom',
          path: ['firstName'],
          message: 'Ingresa los nombres.',
        })
      } else if (values.firstName.length > 80) {
        context.addIssue({
          code: 'custom',
          path: ['firstName'],
          message: 'El nombre no puede superar 80 caracteres.',
        })
      }
      if (!values.lastName) {
        context.addIssue({
          code: 'custom',
          path: ['lastName'],
          message: 'Ingresa los apellidos.',
        })
      } else if (values.lastName.length > 80) {
        context.addIssue({
          code: 'custom',
          path: ['lastName'],
          message: 'El apellido no puede superar 80 caracteres.',
        })
      }
    } else if (!values.legalName) {
      context.addIssue({
        code: 'custom',
        path: ['legalName'],
        message: 'Ingresa la razón social.',
      })
    } else if (values.legalName.length > 160) {
      context.addIssue({
        code: 'custom',
        path: ['legalName'],
        message: 'La razón social no puede superar 160 caracteres.',
      })
    }
  })

export type CustomerFormValues = {
  type: 'NATURAL' | 'LEGAL'
  documentNumber: string
  firstName: string
  lastName: string
  legalName: string
  phone: string
  email: string
}

export const emptyCustomer: CustomerFormValues = {
  type: 'NATURAL',
  documentNumber: '',
  firstName: '',
  lastName: '',
  legalName: '',
  phone: '',
  email: '',
}
