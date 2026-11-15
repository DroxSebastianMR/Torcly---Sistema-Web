import { isAxiosError } from 'axios'
import type {
  Customer,
  CustomerCreateInput,
  CustomerType,
} from '../types/customers.types'
import type { CustomerFormValues } from '../forms/customers.schema'

export function getCustomersErrorMessage(error: unknown) {
  if (isAxiosError<{ error?: { message?: string } }>(error)) {
    return (
      error.response?.data.error?.message ??
      'No se pudo completar la operación.'
    )
  }
  return 'No se pudo completar la operación.'
}

export function customerDisplayName(customer: Customer) {
  if (customer.type === 'NATURAL') {
    return [customer.firstName, customer.lastName].filter(Boolean).join(' ')
  }
  return customer.legalName ?? 'Sin razón social'
}

export function customerInitials(customer: Customer) {
  if (customer.type === 'NATURAL') {
    return `${customer.firstName?.[0] ?? ''}${customer.lastName?.[0] ?? ''}`.toUpperCase()
  }
  return (customer.legalName ?? 'S').slice(0, 2).toUpperCase()
}

export function customerTypeLabel(type: CustomerType) {
  return type === 'NATURAL' ? 'Persona natural' : 'Persona jurídica'
}

export function documentLabel(type: CustomerType) {
  return type === 'NATURAL' ? 'DNI' : 'RUC'
}

export function dateFormatter(value: string) {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function mapCustomerFormValues(
  values: CustomerFormValues,
): CustomerCreateInput {
  const base = {
    documentNumber: values.documentNumber,
    phone: values.phone,
    email: values.email.trim() ? values.email.trim() : null,
  }

  const cleanPlate = values.vehiclePlate
    ? values.vehiclePlate.toUpperCase().replace(/[\s-]/g, '').trim()
    : ''

  const vehicle =
    values.registerVehicle && cleanPlate
      ? {
          plate: cleanPlate,
          brand: values.vehicleBrand.trim(),
          model: values.vehicleModel.trim(),
          year: Number(values.vehicleYear),
          mileage:
            values.vehicleMileage !== '' && values.vehicleMileage !== undefined
              ? Number(values.vehicleMileage)
              : null,
        }
      : null

  const customerData =
    values.type === 'NATURAL'
      ? {
          ...base,
          type: 'NATURAL' as const,
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
        }
      : {
          ...base,
          type: 'LEGAL' as const,
          legalName: values.legalName.trim(),
        }

  return vehicle ? { ...customerData, vehicle } : customerData
}

export function mapCustomerToFormValues(
  customer: Customer,
): CustomerFormValues {
  return {
    type: customer.type,
    documentNumber: customer.documentNumber,
    firstName: customer.firstName ?? '',
    lastName: customer.lastName ?? '',
    legalName: customer.legalName ?? '',
    phone: customer.phone,
    email: customer.email ?? '',
    registerVehicle: false,
    vehiclePlate: '',
    vehicleBrand: '',
    vehicleModel: '',
    vehicleYear: new Date().getFullYear(),
    vehicleMileage: '',
  }
}
