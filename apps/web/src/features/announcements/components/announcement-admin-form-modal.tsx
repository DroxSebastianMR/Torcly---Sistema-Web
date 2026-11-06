import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { SmartSelect } from '@/components/ui/smart-select'
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

  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState<AnnouncementType>('UPDATE')
  const [status, setStatus] = useState<AnnouncementStatus>('PUBLISHED')
  const [versionTag, setVersionTag] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [notifyUsers, setNotifyUsers] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title)
      setSummary(initialData.summary)
      setContent(initialData.content)
      setType(initialData.type)
      setStatus(initialData.status)
      setVersionTag(initialData.versionTag ?? '')
      setVideoUrl(initialData.videoUrl ?? '')
      setStartsAt(initialData.startsAt ? initialData.startsAt.slice(0, 16) : '')
      setEndsAt(initialData.endsAt ? initialData.endsAt.slice(0, 16) : '')
      setNotifyUsers(false)
    } else {
      setTitle('')
      setSummary('')
      setContent('')
      setType('UPDATE')
      setStatus('PUBLISHED')
      setVersionTag('v1.1.2')
      setVideoUrl('')
      setStartsAt('')
      setEndsAt('')
      setNotifyUsers(true)
    }
  }, [initialData, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !summary.trim() || !content.trim()) {
      toast.error(
        'Completa los campos obligatorios (título, resumen y contenido).',
      )
      return
    }

    setIsSubmitting(true)
    try {
      if (isEditing && initialData) {
        const payload: UpdateAnnouncementPayload = {
          title: title.trim(),
          summary: summary.trim(),
          content: content.trim(),
          type,
          status,
          versionTag: versionTag.trim() || null,
          videoUrl: videoUrl.trim() || null,
          startsAt: startsAt ? new Date(startsAt).toISOString() : null,
          endsAt: endsAt ? new Date(endsAt).toISOString() : null,
          notifyUsers,
        }
        await onSubmitUpdate(initialData.id, payload)
        toast.success('Anuncio actualizado correctamente.')
      } else {
        const payload: CreateAnnouncementPayload = {
          title: title.trim(),
          summary: summary.trim(),
          content: content.trim(),
          type,
          status,
          versionTag: versionTag.trim() || null,
          videoUrl: videoUrl.trim() || null,
          startsAt: startsAt ? new Date(startsAt).toISOString() : null,
          endsAt: endsAt ? new Date(endsAt).toISOString() : null,
          notifyUsers,
        }
        await onSubmitCreate(payload)
        toast.success('Anuncio publicado con éxito.')
      }
      onClose()
    } catch {
      toast.error('Ocurrió un error al procesar el anuncio.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar Anuncio SaaS' : 'Publicar Nuevo Anuncio SaaS'}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Title */}
        <div className="space-y-1">
          <label className="font-semibold text-foreground">
            Título del Anuncio <span className="text-destructive">*</span>
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ej. Torcly v1.1.2 — Notificaciones Operativas"
            required
            className="text-xs"
          />
        </div>

        {/* Row Type & Status */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label
              htmlFor="announcement-form-type"
              className="font-semibold text-foreground"
            >
              Tipo de Anuncio
            </label>
            <SmartSelect
              id="announcement-form-type"
              value={type}
              onChange={(val) => setType(val as AnnouncementType)}
              options={[
                { value: 'UPDATE', label: 'Actualización (Release / Versión)' },
                { value: 'MAINTENANCE', label: 'Mantenimiento Preventivo' },
                { value: 'COMMUNICATION', label: 'Comunicado General' },
              ]}
              placeholder="Seleccionar tipo"
              aria-label="Tipo de anuncio"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="announcement-form-status"
              className="font-semibold text-foreground"
            >
              Estado
            </label>
            <SmartSelect
              id="announcement-form-status"
              value={status}
              onChange={(val) => setStatus(val as AnnouncementStatus)}
              options={[
                { value: 'PUBLISHED', label: 'Publicado (Visible en feed)' },
                { value: 'DRAFT', label: 'Borrador (Solo administradores)' },
                { value: 'ARCHIVED', label: 'Archivado' },
              ]}
              placeholder="Seleccionar estado"
              aria-label="Estado del anuncio"
            />
          </div>
        </div>

        {/* Version tag and Video URL */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="font-semibold text-foreground">
              Etiqueta de Versión{' '}
              <span className="text-muted-foreground font-normal">
                (opcional)
              </span>
            </label>
            <Input
              value={versionTag}
              onChange={(e) => setVersionTag(e.target.value)}
              placeholder="ej. v1.1.2"
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">
              URL Video Tutorial / Demo{' '}
              <span className="text-muted-foreground font-normal">
                (YouTube, Loom)
              </span>
            </label>
            <Input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="text-xs"
            />
          </div>
        </div>

        {/* Maintenance Date Window (only if type is MAINTENANCE) */}
        {type === 'MAINTENANCE' && (
          <div className="grid grid-cols-1 gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">
                Inicio de Mantenimiento
              </label>
              <Input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground">
                Fin de Mantenimiento
              </label>
              <Input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="space-y-1">
          <label className="font-semibold text-foreground">
            Resumen Breve <span className="text-destructive">*</span>
          </label>
          <Input
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Breve descripción que aparecerá en la tarjeta del feed."
            required
            className="text-xs"
          />
        </div>

        {/* Content */}
        <div className="space-y-1">
          <label className="font-semibold text-foreground">
            Contenido Completo <span className="text-destructive">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder="Detalle de cambios, changelog, guías de usuario o instrucciones operativas."
            required
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        {/* Broadcast Checkbox */}
        <div className="flex items-center gap-2 rounded-lg border bg-muted/10 p-3">
          <input
            type="checkbox"
            id="notifyUsers"
            checked={notifyUsers}
            onChange={(e) => setNotifyUsers(e.target.checked)}
            className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="notifyUsers" className="cursor-pointer select-none">
            <span className="font-medium text-foreground">
              Difundir a la campana de notificaciones de todos los talleres
            </span>
            <p className="text-[11px] text-muted-foreground">
              Enviará una alerta a los usuarios de talleres activos para que
              revisen este anuncio.
            </p>
          </label>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting
              ? 'Guardando…'
              : isEditing
                ? 'Actualizar Anuncio'
                : 'Publicar Anuncio'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
