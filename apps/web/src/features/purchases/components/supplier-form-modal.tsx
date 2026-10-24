import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import {
  supplierFormSchema,
  type SupplierFormValues,
} from '../forms/supplier.schema'
import { usePurchaseMutations } from '../hooks/use-purchases'
import type { SupplierSummary } from '../types/purchases.types'
import { getPurchaseErrorMessage } from '../utils/purchase-formatters'

interface SupplierFormModalProps {
  open: boolean
  supplier: SupplierSummary | null
  onClose: () => void
}

const defaultValues: SupplierFormValues = {
  legalName: '',
  documentNumber: '',
  contactName: '',
  phone: '',
  email: '',
}

export function SupplierFormModal({
  open,
  supplier,
  onClose,
}: SupplierFormModalProps) {
  const mutations = usePurchaseMutations()
  const isEditing = supplier !== null
  const busy =
    mutations.createSupplier.isPending || mutations.updateSupplier.isPending

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues,
  })
  const { reset, register, handleSubmit, formState } = form

  useEffect(() => {
    if (open && supplier) {
      reset({
        legalName: supplier.legalName,
        documentNumber: supplier.documentNumber,
        contactName: supplier.contactName ?? '',
        phone: supplier.phone ?? '',
        email: supplier.email ?? '',
      })
    } else if (open) {
      reset(defaultValues)
    }
  }, [open, supplier, reset])

  const onSubmit = async (values: SupplierFormValues) => {
    const input = {
      legalName: values.legalName.trim(),
      documentNumber: values.documentNumber.trim(),
      contactName: values.contactName?.trim() || null,
      phone: values.phone?.trim() || null,
      email: values.email?.trim() || null,
    }

    try {
      if (isEditing && supplier) {
        await mutations.updateSupplier.mutateAsync({
          id: supplier.id,
          input,
        })
        toast.success('Proveedor actualizado exitosamente.')
      } else {
        await mutations.createSupplier.mutateAsync(input)
        toast.success('Proveedor registrado exitosamente.')
      }
      onClose()
    } catch (error) {
      toast.error(getPurchaseErrorMessage(error))
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar proveedor' : 'Nuevo proveedor'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="legalName" className="text-sm font-medium">
            Razón Social / Nombre <span className="text-destructive">*</span>
          </label>
          <Input
            id="legalName"
            placeholder="Ej. Distribuidora Automotriz SAC"
            {...register('legalName')}
            aria-invalid={Boolean(formState.errors.legalName)}
          />
          {formState.errors.legalName && (
            <p className="text-xs text-destructive" role="alert">
              {formState.errors.legalName.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="documentNumber" className="text-sm font-medium">
            Documento Único (RUC / DNI / NIT){' '}
            <span className="text-destructive">*</span>
          </label>
          <Input
            id="documentNumber"
            placeholder="Ej. 20123456789"
            {...register('documentNumber')}
            aria-invalid={Boolean(formState.errors.documentNumber)}
          />
          {formState.errors.documentNumber && (
            <p className="text-xs text-destructive" role="alert">
              {formState.errors.documentNumber.message}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="contactName" className="text-sm font-medium">
              Nombre de Contacto
            </label>
            <Input
              id="contactName"
              placeholder="Ej. Carlos Mendoza"
              {...register('contactName')}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="phone" className="text-sm font-medium">
              Teléfono
            </label>
            <Input
              id="phone"
              type="tel"
              placeholder="Ej. +51 987654321"
              {...register('phone')}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Correo Electrónico
          </label>
          <Input
            id="email"
            type="email"
            placeholder="contacto@proveedor.com"
            {...register('email')}
            aria-invalid={Boolean(formState.errors.email)}
          />
          {formState.errors.email && (
            <p className="text-xs text-destructive" role="alert">
              {formState.errors.email.message}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={busy} aria-busy={busy}>
            {busy
              ? 'Guardando…'
              : isEditing
                ? 'Guardar cambios'
                : 'Registrar proveedor'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
