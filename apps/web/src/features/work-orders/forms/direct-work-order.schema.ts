import { z } from 'zod'

export const receptionFuelLevelOptions = [
  { value: 'E', label: 'Vacío' },
  { value: '1/4', label: '1/4 de tanque' },
  { value: '1/2', label: '1/2 tanque' },
  { value: '3/4', label: '3/4 de tanque' },
  { value: 'F', label: 'Tanque lleno' },
] as const

const phoneRegExp = /^\+?[1-9]\d{5,14}$/

export const directWorkOrderFormSchema = z
  .object({
    isNewCustomer: z.boolean(),
    // Cliente existente
    customerId: z.string().trim(),
    vehicleId: z.string().trim(),
    // Nuevo cliente (walk-in)
    customerType: z.enum(['NATURAL', 'LEGAL']),
    documentNumber: z.string().trim(),
    firstName: z.string().trim(),
    lastName: z.string().trim(),
    legalName: z.string().trim(),
    phone: z.string().trim(),
    email: z.string().trim(),
    // Nuevo vehículo
    vehiclePlate: z.string().trim(),
    vehicleBrand: z.string().trim(),
    vehicleModel: z.string().trim(),
    vehicleYear: z.union([z.number(), z.string()]),
    // Datos comunes de la orden
    currentMileage: z
      .number()
      .int('El kilometraje debe ser un número entero.')
      .min(0, 'El kilometraje no puede ser negativo.')
      .max(2_000_000, 'Kilometraje fuera de rango.')
      .nullable()
      .optional(),
    receptionNotes: z
      .string()
      .trim()
      .max(500, 'Las observaciones no pueden exceder los 500 caracteres.')
      .optional(),
    receptionFuelLevel: z.enum(['E', '1/4', '1/2', '3/4', 'F']),
    hasSpareTire: z.boolean(),
    hasJackAndTools: z.boolean(),
    hasVehicleDocuments: z.boolean(),
    hasRadioFaceplate: z.boolean(),
    externalDamageNotes: z
      .string()
      .trim()
      .max(1000, 'Los daños externos no pueden exceder los 1000 caracteres.')
      .optional(),
    photoUrls: z.string().optional(),
  })
  .superRefine((values, context) => {
    if (!values.isNewCustomer) {
      if (!values.customerId) {
        context.addIssue({
          code: 'custom',
          path: ['customerId'],
          message: 'Selecciona un cliente.',
        })
      }
      if (!values.vehicleId) {
        context.addIssue({
          code: 'custom',
          path: ['vehicleId'],
          message: 'Selecciona un vehículo.',
        })
      }
      return
    }

    // Validación de nuevo cliente
    const isNatural = values.customerType === 'NATURAL'
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
      if (!values.firstName.trim()) {
        context.addIssue({
          code: 'custom',
          path: ['firstName'],
          message: 'Ingresa los nombres.',
        })
      } else if (values.firstName.trim().length > 80) {
        context.addIssue({
          code: 'custom',
          path: ['firstName'],
          message: 'El nombre no puede superar 80 caracteres.',
        })
      }
      if (!values.lastName.trim()) {
        context.addIssue({
          code: 'custom',
          path: ['lastName'],
          message: 'Ingresa los apellidos.',
        })
      } else if (values.lastName.trim().length > 80) {
        context.addIssue({
          code: 'custom',
          path: ['lastName'],
          message: 'El apellido no puede superar 80 caracteres.',
        })
      }
    } else {
      if (!values.legalName.trim()) {
        context.addIssue({
          code: 'custom',
          path: ['legalName'],
          message: 'Ingresa la razón social.',
        })
      } else if (values.legalName.trim().length > 160) {
        context.addIssue({
          code: 'custom',
          path: ['legalName'],
          message: 'La razón social no puede superar 160 caracteres.',
        })
      }
    }

    if (!phoneRegExp.test(values.phone.trim())) {
      context.addIssue({
        code: 'custom',
        path: ['phone'],
        message: 'Ingresa un teléfono válido.',
      })
    }

    if (
      values.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())
    ) {
      context.addIssue({
        code: 'custom',
        path: ['email'],
        message: 'Ingresa un correo electrónico válido.',
      })
    }

    // Validación de nuevo vehículo
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

    const currentYear = new Date().getFullYear() + 1
    const yearNum = Number(values.vehicleYear)
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
  })

export type DirectWorkOrderFormValues = z.infer<
  typeof directWorkOrderFormSchema
>
