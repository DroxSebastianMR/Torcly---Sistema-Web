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
    registerVehicle: z.boolean(),
    vehiclePlate: z.string().trim(),
    vehicleBrand: z.string().trim(),
    vehicleModel: z.string().trim(),
    vehicleYear: z.union([z.number(), z.string()]),
    vehicleMileage: z.union([z.number(), z.string()]),
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

    if (values.registerVehicle) {
      const cleanPlate = values.vehiclePlate
        .toUpperCase()
        .replace(/[\s-]/g, '')
        .trim()
      if (!cleanPlate) {
        context.addIssue({
          code: 'custom',
          path: ['vehiclePlate'],
          message: 'Ingresa la placa del vehículo.',
        })
      } else if (!/^[A-Z0-9]{5,8}$/.test(cleanPlate)) {
        context.addIssue({
          code: 'custom',
          path: ['vehiclePlate'],
          message: 'La placa debe contener 5 a 8 caracteres alfanuméricos.',
        })
      }

      if (!values.vehicleBrand.trim()) {
        context.addIssue({
          code: 'custom',
          path: ['vehicleBrand'],
          message: 'Ingresa la marca del vehículo.',
        })
      }

      if (!values.vehicleModel.trim()) {
        context.addIssue({
          code: 'custom',
          path: ['vehicleModel'],
          message: 'Ingresa el modelo del vehículo.',
        })
      }

      const yearNum = Number(values.vehicleYear)
      const currentYear = new Date().getFullYear() + 1
      if (
        !yearNum ||
        Number.isNaN(yearNum) ||
        yearNum < 1950 ||
        yearNum > currentYear
      ) {
        context.addIssue({
          code: 'custom',
          path: ['vehicleYear'],
          message: `El año debe estar entre 1950 y ${currentYear}.`,
        })
      }

      if (values.vehicleMileage !== '' && values.vehicleMileage !== undefined) {
        const mileageNum = Number(values.vehicleMileage)
        if (Number.isNaN(mileageNum) || mileageNum < 0) {
          context.addIssue({
            code: 'custom',
            path: ['vehicleMileage'],
            message: 'El kilometraje no puede ser negativo.',
          })
        }
      }
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
  registerVehicle: boolean
  vehiclePlate: string
  vehicleBrand: string
  vehicleModel: string
  vehicleYear: number | string
  vehicleMileage: number | string
}

export const emptyCustomer: CustomerFormValues = {
  type: 'NATURAL',
  documentNumber: '',
  firstName: '',
  lastName: '',
  legalName: '',
  phone: '',
  email: '',
  registerVehicle: false,
  vehiclePlate: '',
  vehicleBrand: '',
  vehicleModel: '',
  vehicleYear: new Date().getFullYear(),
  vehicleMileage: '',
}
