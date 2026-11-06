import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Megaphone } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { SmartSelect } from '@/components/ui/smart-select'
import { cn } from '@/lib/utils'
import {
  announcementFormSchema,
  emptyAnnouncement,
  mapAnnouncementToFormValues,
  mapFormValuesToCreatePayload,
  mapFormValuesToUpdatePayload,
  type AnnouncementFormValues,
} from '../forms/announcement.schema'
import type {
  AnnouncementItem,
  AnnouncementStatus,
  AnnouncementType,
  CreateAnnouncementPayload,
  UpdateAnnouncementPayload,
} from '../types/announcements.types'

interface AnnouncementAdminFormModalProps {
  open: boolean
  initialData?: AnnouncementItem | null
  onClose: () => void
  onSubmitCreate: (payload: CreateAnnouncementPayload) => Promise<void>
  onSubmitUpdate: (
    id: string,
    payload: UpdateAnnouncementPayload,
  ) => Promise<void>
}

export function AnnouncementAdminFormModal({
  open,
  initialData,
  onClose,
  onSubmitCreate,
  onSubmitUpdate,
}: AnnouncementAdminFormModalProps) {
  const isEditing = Boolean(initialData)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: emptyAnnouncement,
    mode: 'onTouched',
  })

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = form

  const type = useWatch({ control, name: 'type' })
  const status = useWatch({ control, name: 'status' })
  const notifyUsers = useWatch({ control, name: 'notifyUsers' })

  useEffect(() => {
    if (!open) return
    reset(
      initialData
        ? mapAnnouncementToFormValues(initialData)
        : emptyAnnouncement,
    )
  }, [open, reset, initialData])

  const submit = handleSubmit(async (values) => {
    setIsSubmitting(true)
    try {
      if (isEditing && initialData) {
        const payload = mapFormValuesToUpdatePayload(values)
        await onSubmitUpdate(initialData.id, payload)
        toast.success('Anuncio actualizado correctamente.')
      } else {
        const payload = mapFormValuesToCreatePayload(values)
        await onSubmitCreate(payload)
        toast.success('Anuncio publicado con éxito.')
      }
      onClose()
    } catch {
      toast.error('Ocurrió un error al procesar el anuncio.')
    } finally {
      setIsSubmitting(false)
    }
  })

  const error = (name: keyof AnnouncementFormValues) => {
    const message = errors[name]?.message
    return message ? String(message) : undefined
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar anuncio SaaS' : 'Publicar nuevo anuncio SaaS'}
      description={
        isEditing
          ? 'Actualiza el contenido, tipo o estado del anuncio para los talleres.'
          : 'Publica actualizaciones de versiones, mantenimientos preventivos o comunicados en la plataforma.'
      }
      visual={
        <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <Megaphone aria-hidden className="size-6" />
        </span>
      }
      className="max-w-2xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="announcement-form"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Guardando…'
              : isEditing
                ? 'Guardar cambios'
                : 'Publicar anuncio'}
          </Button>
        </div>
      }
    >
      <form
        id="announcement-form"
        onSubmit={submit}
        noValidate
        className="space-y-5 min-w-0 overflow-x-hidden"
      >
        {/* Title */}
        <Field
          label="Título del Anuncio"
          error={error('title')}
          required
          hint="Ej. Torcly v1.1.2 — Notificaciones Operativas"
        >
          <Input
            {...register('title')}
            invalid={Boolean(error('title'))}
            placeholder="Ej. Torcly v1.1.2 — Notificaciones Operativas"
          />
        </Field>

        {/* Row Type & Status */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Tipo de Anuncio"
            error={error('type')}
            required
            hint="Define el propósito y etiqueta visual"
          >
            <SmartSelect
              id="announcement-form-type"
              value={type}
              onChange={(val) =>
                setValue('type', val as AnnouncementType, {
                  shouldValidate: true,
                })
              }
              options={[
                { value: 'UPDATE', label: 'Actualización (Release / Versión)' },
                { value: 'MAINTENANCE', label: 'Mantenimiento Preventivo' },
                { value: 'COMMUNICATION', label: 'Comunicado General' },
              ]}
              placeholder="Seleccionar tipo"
              aria-label="Tipo de anuncio"
            />
          </Field>

          <Field
            label="Estado"
            error={error('status')}
            required
            hint="Controla si se muestra en el feed"
          >
            <SmartSelect
              id="announcement-form-status"
              value={status}
              onChange={(val) =>
                setValue('status', val as AnnouncementStatus, {
                  shouldValidate: true,
                })
              }
              options={[
                { value: 'PUBLISHED', label: 'Publicado (Visible en feed)' },
                { value: 'DRAFT', label: 'Borrador (Solo administradores)' },
                { value: 'ARCHIVED', label: 'Archivado' },
              ]}
              placeholder="Seleccionar estado"
              aria-label="Estado del anuncio"
            />
          </Field>
        </div>

        {/* Version tag and Video URL */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Etiqueta de Versión"
            error={error('versionTag')}
            hint="Opcional. Ej. v1.1.2"
          >
            <Input
              {...register('versionTag')}
              invalid={Boolean(error('versionTag'))}
              placeholder="Ej. v1.1.2"
            />
          </Field>

          <Field
            label="URL Video Tutorial / Demo"
            error={error('videoUrl')}
            hint="Opcional (YouTube o Loom)"
          >
            <Input
              type="url"
              {...register('videoUrl')}
              invalid={Boolean(error('videoUrl'))}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </Field>
        </div>

        {/* Maintenance Date Window (only if type is MAINTENANCE) */}
        {type === 'MAINTENANCE' && (
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-2">
            <Field
              label="Inicio de Mantenimiento"
              error={error('startsAt')}
              hint="Fecha y hora de inicio"
            >
              <Input
                type="datetime-local"
                {...register('startsAt')}
                invalid={Boolean(error('startsAt'))}
              />
            </Field>

            <Field
              label="Fin de Mantenimiento"
              error={error('endsAt')}
              hint="Fecha y hora de culminación estimada"
            >
              <Input
                type="datetime-local"
                {...register('endsAt')}
                invalid={Boolean(error('endsAt'))}
              />
            </Field>
          </div>
        )}

        {/* Summary */}
        <Field
          label="Resumen Breve"
          error={error('summary')}
          required
          hint="Descripción corta visible en la tarjeta del feed (máx. 500 caracteres)."
        >
          <Input
            {...register('summary')}
            invalid={Boolean(error('summary'))}
            placeholder="Breve resumen de la novedad que aparecerá en el feed principal."
          />
        </Field>

        {/* Content */}
        <Field
          label="Contenido Completo"
          error={error('content')}
          required
          hint="Detalle de cambios, changelog, guías de usuario o instrucciones operativas."
        >
          <textarea
            id="announcement-content"
            {...register('content')}
            rows={6}
            aria-invalid={Boolean(error('content'))}
            placeholder="Detalle de cambios, changelog, guías de usuario o instrucciones operativas."
            className={cn(
              'w-full min-w-0 resize-y rounded-[10px] border border-input bg-card px-3 py-2.5 text-sm leading-relaxed transition-[border-color,background-color] duration-150 ease-out hover:bg-background focus:border-primary/70 focus:outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 overflow-x-hidden break-words whitespace-pre-wrap',
              error('content') && 'border-red-500 focus:border-red-600',
            )}
          />
        </Field>

        {/* Broadcast Checkbox */}
        <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-3.5 shadow-xs">
          <input
            type="checkbox"
            id="notifyUsers"
            checked={notifyUsers}
            onChange={(e) => setValue('notifyUsers', e.target.checked)}
            className="mt-0.5 size-4 rounded border-input accent-primary cursor-pointer"
          />
          <label
            htmlFor="notifyUsers"
            className="cursor-pointer select-none space-y-0.5"
          >
            <span className="text-sm font-medium text-foreground">
              Difundir a la campana de notificaciones de todos los talleres
            </span>
            <p className="text-xs text-muted-foreground">
              Enviará una alerta a los usuarios de talleres activos para que
              revisen este anuncio.
            </p>
          </label>
        </div>
      </form>
    </Modal>
  )
}

function Field({
  label,
  error,
  hint,
  required,
  children,
}: {
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span className="text-foreground">
        {label}
        {required && <span className="ml-1 text-emerald-700">*</span>}
      </span>
      {children}
      {error ? (
        <span className="block text-xs font-normal text-red-600">{error}</span>
      ) : hint ? (
        <span className="block text-xs font-normal text-muted-foreground">
          {hint}
        </span>
      ) : null}
    </label>
  )
}
