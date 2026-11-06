import { Check, ChevronRight, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AnnouncementItem } from '../types/announcements.types'
import {
  formatRelativeAnnouncementDate,
  getAnnouncementAppearance,
} from '../utils/announcement-formatters'

interface AnnouncementCardProps {
  announcement: AnnouncementItem
  onOpenDetail: (announcement: AnnouncementItem) => void
  onMarkAsRead?: (id: string) => void
  isMarking?: boolean
}

export function AnnouncementCard({
  announcement,
  onOpenDetail,
  onMarkAsRead,
  isMarking,
}: AnnouncementCardProps) {
  const appearance = getAnnouncementAppearance(announcement.type)
  const Icon = appearance.icon

  return (
    <div
      onClick={() => onOpenDetail(announcement)}
      className={`group flex cursor-pointer items-start justify-between gap-4 px-5 py-4.5 transition-colors hover:bg-muted/40 sm:px-6 ${
        announcement.isRead ? 'bg-card' : 'bg-primary/[0.02]'
      }`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3.5">
        {/* Category icon with exact pastel background and accent color */}
        <div
          style={{
            backgroundColor: appearance.bg,
            color: appearance.accent,
          }}
          className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
        >
          <Icon size={16} />
        </div>

        {/* Text details */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {!announcement.isRead && (
              <span
                className="size-2 shrink-0 rounded-full bg-emerald-500"
                title="Nueva novedad"
                aria-label="Nueva novedad"
              />
            )}

            <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
              {announcement.title}
            </span>

            {/* Version tag if applicable */}
            {announcement.versionTag && (
              <span
                style={{
                  backgroundColor: '#E7F6EF',
                  color: '#329B78',
                }}
                className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold"
              >
                {announcement.versionTag}
              </span>
            )}

            {/* Video tutorial pill */}
            {announcement.videoUrl && (
              <span
                style={{
                  backgroundColor: '#FFFBE8',
                  color: '#C58A24',
                }}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                title="Incluye video explicativo"
              >
                <Video size={10} />
                Video
              </span>
            )}
          </div>

          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {announcement.summary}
          </p>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground/80">
            <span>
              {formatRelativeAnnouncementDate(announcement.publishedAt)}
            </span>
            {announcement.createdBy && (
              <>
                <span>•</span>
                <span>Por {announcement.createdBy}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right actions */}
      <div
        className="flex shrink-0 items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Category Pill Tag on right */}
        <span
          style={{
            backgroundColor: appearance.bg,
            color: appearance.accent,
          }}
          className="hidden rounded-full px-2.5 py-0.5 text-[11px] font-semibold sm:inline-block"
        >
          {appearance.label}
        </span>

        {/* Mark as read button if unread */}
        {!announcement.isRead && onMarkAsRead && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMarkAsRead(announcement.id)}
            disabled={isMarking}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            title="Marcar como leída"
          >
            <Check size={14} />
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onOpenDetail(announcement)}
          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <span className="hidden sm:inline">Ver detalle</span>
          <ChevronRight size={14} className="ml-1" />
        </Button>
      </div>
    </div>
  )
}
