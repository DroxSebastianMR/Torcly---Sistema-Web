import { useEffect, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { SmartSelect } from '@/components/ui/smart-select'
import { cn } from '@/lib/utils'
import { AnnouncementMarkdown } from './announcement-markdown'
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
  const contentValue = useWatch({ control, name: 'content' })
  const contentRegister = register('content')
  const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [previewMode, setPreviewMode] = useState(false)

  const insertFormatting = (prefix: string, suffix = '') => {
    const textarea = contentTextareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const current = textarea.value
    const selected = current.slice(start, end)
    const replacement = selected
      ? `${prefix}${selected}${suffix}`
      : `${prefix}${suffix}`
    const nextValue = current.slice(0, start) + replacement + current.slice(end)
    setValue('content', nextValue, {
      shouldValidate: true,
      shouldDirty: true,
    })
    setTimeout(() => {
      textarea.focus()
      const cursorPos = start + prefix.length + (selected ? selected.length : 0)
      textarea.setSelectionRange(cursorPos, cursorPos)
    }, 10)
  }

  const applyFontSize = (size: number) => {
    const textarea = contentTextareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const current = textarea.value
    const selected = current.slice(start, end)

    let replacement = ''
    let newCursorStart = start
    let newCursorEnd = end

    if (!selected) {
      replacement = `[size:${size}]Texto[/size]`
      newCursorStart = start + `[size:${size}]`.length
      newCursorEnd = newCursorStart + 5
    } else {
      const match = /^\[size:\d+\]([\s\S]+)\[\/size\]$/.exec(selected)
      const innerText = match ? match[1] : selected
      replacement = `[size:${size}]${innerText}[/size]`
      newCursorStart = start
      newCursorEnd = start + replacement.length
    }

    const nextValue = current.slice(0, start) + replacement + current.slice(end)
    setValue('content', nextValue, {
      shouldValidate: true,
      shouldDirty: true,
    })
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newCursorStart, newCursorEnd)
    }, 10)
  }

  const changeFontSize = (delta: 1 | -1) => {
    const textarea = contentTextareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const current = textarea.value
    const selected = current.slice(start, end)

    let currentSize = 14
    const match = /\[size:(\d+)\]/.exec(selected)
    if (match) {
      currentSize = parseInt(match[1], 10)
    }

    const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32]
    const currentIndex = FONT_SIZES.indexOf(currentSize)
    let nextIndex =
      currentIndex !== -1 ? currentIndex + delta : delta > 0 ? 3 : 1
    if (nextIndex < 0) nextIndex = 0
    if (nextIndex >= FONT_SIZES.length) nextIndex = FONT_SIZES.length - 1
    applyFontSize(FONT_SIZES[nextIndex])
  }

  useEffect(() => {
    if (contentTextareaRef.current) {
      contentTextareaRef.current.style.height = 'auto'
      contentTextareaRef.current.style.height = `${Math.max(140, contentTextareaRef.current.scrollHeight)}px`
    }
  }, [contentValue, open])

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
              onChange={(val) => {
                const nextType = val as AnnouncementType
                setValue('type', nextType, {
                  shouldValidate: true,
                })
                if (nextType !== 'UPDATE') {
                  setValue('versionTag', '')
                }
              }}
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

        {/* Version tag (only for UPDATE) and Video URL */}
        {type === 'UPDATE' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Etiqueta de Versión"
              error={error('versionTag')}
              hint="Opcional. Ej. v1.2.0"
            >
              <Input
                {...register('versionTag')}
                invalid={Boolean(error('versionTag'))}
                placeholder="Ej. v1.2.0"
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
        ) : (
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
        )}

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
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="announcement-content"
              className="text-sm font-medium text-foreground cursor-pointer"
            >
              Contenido Completo{' '}
              <span className="ml-1 text-emerald-700">*</span>
            </label>
            <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setPreviewMode(false)}
                className={cn(
                  'rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer',
                  !previewMode
                    ? 'bg-card text-foreground shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Editor
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode(true)}
                className={cn(
                  'rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer',
                  previewMode
                    ? 'bg-card text-foreground shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Vista Previa
              </button>
            </div>
          </div>

          {!previewMode ? (
            <>
              {/* Quick formatting toolbar */}
              <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border/70 bg-muted/20 px-2 py-1.5 text-xs">
                <span className="mr-1 text-[11px] font-semibold text-muted-foreground">
                  Encabezados:
                </span>
                <button
                  type="button"
                  onClick={() => insertFormatting('# ')}
                  className="cursor-pointer rounded border border-border/60 bg-card px-2 py-0.5 text-[11px] font-bold text-foreground transition-colors hover:bg-muted"
                  title="Título Principal Grande (H1)"
                >
                  # Grande
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('## ')}
                  className="cursor-pointer rounded border border-border/60 bg-card px-2 py-0.5 text-[11px] font-semibold text-foreground transition-colors hover:bg-muted"
                  title="Título Mediano (H2)"
                >
                  ## Mediano
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('### ')}
                  className="cursor-pointer rounded border border-border/60 bg-card px-2 py-0.5 text-[11px] font-medium text-foreground transition-colors hover:bg-muted"
                  title="Subtítulo Estándar (H3)"
                >
                  ### Normal
                </button>

                <div className="mx-1 h-3.5 w-px bg-border/70" />

                <span className="mr-1 text-[11px] font-semibold text-muted-foreground">
                  Tamaño:
                </span>
                <div className="inline-flex items-center rounded-md border border-border/60 bg-card">
                  <button
                    type="button"
                    onClick={() => changeFontSize(-1)}
                    className="cursor-pointer px-1.5 py-0.5 text-[11px] font-bold text-foreground hover:bg-muted transition-colors border-r border-border/50"
                    title="Disminuir tamaño (A-)"
                  >
                    A-
                  </button>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        applyFontSize(Number(e.target.value))
                        e.target.value = ''
                      }
                    }}
                    defaultValue=""
                    className="cursor-pointer bg-transparent px-1.5 py-0.5 text-[11px] font-semibold text-foreground outline-none"
                    title="Seleccionar tamaño de fuente en píxeles (tipo Word)"
                  >
                    <option value="" disabled>
                      Tamaño
                    </option>
                    <option value="10">10 px</option>
                    <option value="12">12 px</option>
                    <option value="14">14 px (normal)</option>
                    <option value="16">16 px</option>
                    <option value="18">18 px</option>
                    <option value="20">20 px</option>
                    <option value="24">24 px</option>
                    <option value="28">28 px</option>
                    <option value="32">32 px</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => changeFontSize(1)}
                    className="cursor-pointer px-1.5 py-0.5 text-[11px] font-bold text-foreground hover:bg-muted transition-colors border-l border-border/50"
                    title="Aumentar tamaño (A+)"
                  >
                    A+
                  </button>
                </div>

                <div className="mx-1 h-3.5 w-px bg-border/70" />

                <span className="mr-1 text-[11px] font-semibold text-muted-foreground">
                  Estilo:
                </span>
                <button
                  type="button"
                  onClick={() => insertFormatting('**', '**')}
                  className="cursor-pointer rounded border border-border/60 bg-card px-2 py-0.5 text-[11px] font-bold text-foreground transition-colors hover:bg-muted"
                  title="Texto en negrita"
                >
                  **B** Negrita
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('1. ')}
                  className="cursor-pointer rounded border border-border/60 bg-card px-2 py-0.5 text-[11px] font-medium text-foreground transition-colors hover:bg-muted"
                  title="Lista numerada con badge"
                >
                  1. Numeración
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('- ')}
                  className="cursor-pointer rounded border border-border/60 bg-card px-2 py-0.5 text-[11px] font-medium text-foreground transition-colors hover:bg-muted"
                  title="Viñeta de lista"
                >
                  • Viñeta
                </button>
              </div>

              <textarea
                id="announcement-content"
                {...contentRegister}
                ref={(element) => {
                  contentRegister.ref(element)
                  contentTextareaRef.current = element
                }}
                rows={6}
                aria-invalid={Boolean(error('content'))}
                placeholder="Detalle de cambios, changelog, guías de usuario o instrucciones operativas."
                className={cn(
                  'no-scrollbar w-full min-w-0 resize-y rounded-[10px] border border-input bg-card px-3 py-2.5 text-sm leading-relaxed transition-[border-color,background-color] duration-150 ease-out hover:bg-background focus:border-primary/70 focus:outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 overflow-x-hidden break-words whitespace-pre-wrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                  error('content') && 'border-red-500 focus:border-red-600',
                )}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              />
            </>
          ) : (
            <div className="min-h-[160px] rounded-[10px] border border-border bg-card p-4 shadow-2xs">
              <AnnouncementMarkdown
                content={
                  contentValue?.trim() ||
                  '*(Escribe contenido en el editor para visualizarlo aquí)*'
                }
              />
            </div>
          )}

          {error('content') ? (
            <span className="block text-xs font-normal text-red-600">
              {error('content')}
            </span>
          ) : (
            <span className="block text-xs font-normal text-muted-foreground">
              Selecciona cualquier texto y ajusta su tamaño con el selector o
              A+/A- (tipo Word), o usa # para títulos.
            </span>
          )}
        </div>

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
