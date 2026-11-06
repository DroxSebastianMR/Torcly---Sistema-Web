import { Calendar, Clock, ExternalLink, Tag, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import type { AnnouncementItem } from '../types/announcements.types'
import {
  formatAnnouncementDate,
  getAnnouncementAppearance,
  getEmbeddableVideoUrl,
} from '../utils/announcement-formatters'

interface AnnouncementDetailModalProps {
  announcement: AnnouncementItem | null
  open: boolean
  onClose: () => void
  onMarkAsRead?: (id: string) => void
}

export function AnnouncementDetailModal({
  announcement,
  open,
  onClose,
  onMarkAsRead,
}: AnnouncementDetailModalProps) {
  if (!announcement) return null

  const appearance = getAnnouncementAppearance(announcement.type)
  const embedUrl = getEmbeddableVideoUrl(announcement.videoUrl)
  const Icon = appearance.icon

  const handleClose = () => {
    if (!announcement.isRead && onMarkAsRead) {
      onMarkAsRead(announcement.id)
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={announcement.title}
      className="max-w-3xl"
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar size={13} />
            <span>
              Publicado: {formatAnnouncementDate(announcement.publishedAt)}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handleClose}>
            Entendido
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            style={{
              backgroundColor: appearance.bg,
              color: appearance.accent,
            }}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
          >
            <Icon size={14} />
            {appearance.label}
          </span>

          {announcement.versionTag && (
            <span
              style={{
                backgroundColor: '#E7F6EF',
                color: '#329B78',
              }}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold"
            >
              <Tag size={12} />
              {announcement.versionTag}
            </span>
          )}

          {announcement.createdBy && (
            <span className="text-xs text-muted-foreground">
              por{' '}
              <span className="font-medium text-foreground">
                {announcement.createdBy}
              </span>
            </span>
          )}
        </div>

        {/* Maintenance banner if applicable */}
        {announcement.type === 'MAINTENANCE' &&
          (announcement.startsAt || announcement.endsAt) && (
            <div
              style={{
                backgroundColor: '#FFF0F4',
                borderColor: '#CE4779',
              }}
              className="flex items-start gap-3 rounded-xl border border-opacity-30 p-4 text-xs"
            >
              <Clock
                size={16}
                style={{ color: '#CE4779' }}
                className="mt-0.5 shrink-0"
              />
              <div className="space-y-1">
                <p className="font-semibold" style={{ color: '#CE4779' }}>
                  Ventana de Mantenimiento Programada
                </p>
                <p className="text-muted-foreground">
                  {announcement.startsAt &&
                    `Inicio: ${formatAnnouncementDate(announcement.startsAt)}`}
                  {announcement.endsAt &&
                    ` — Finalización: ${formatAnnouncementDate(announcement.endsAt)}`}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Durante este horario la plataforma podría experimentar
                  interrupciones temporales.
                </p>
              </div>
            </div>
          )}

        {/* Video Tutorial if present */}
        {embedUrl && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Video size={14} />
              <span>Video demostrativo / tutorial:</span>
            </div>
            <div className="overflow-hidden rounded-xl border bg-black/5 aspect-video w-full shadow-inner">
              <iframe
                src={embedUrl}
                title={announcement.title}
                className="size-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            {announcement.videoUrl && (
              <div className="text-right">
                <a
                  href={announcement.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                >
                  Abrir enlace en pestaña nueva <ExternalLink size={11} />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        <div className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
          <p className="font-medium text-foreground">{announcement.summary}</p>
        </div>

        {/* Content body */}
        <div className="prose prose-sm max-w-none text-xs leading-relaxed text-foreground whitespace-pre-wrap">
          {announcement.content}
        </div>
      </div>
    </Modal>
  )
}
