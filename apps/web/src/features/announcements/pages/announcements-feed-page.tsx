import { useState } from 'react'
import {
  CheckCheck,
  FileText,
  Layers,
  TrendingUp,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Pagination } from '@/components/ui/pagination'
import { AnnouncementCard } from '../components/announcement-card'
import { AnnouncementDetailModal } from '../components/announcement-detail-modal'
import {
  useAnnouncementMutations,
  useAnnouncements,
  useUnreadAnnouncementsCount,
} from '../hooks/use-announcements'
import type {
  AnnouncementFilters,
  AnnouncementItem,
  AnnouncementType,
} from '../types/announcements.types'

const CATEGORY_TABS: Array<{
  id: string
  label: string
  type?: AnnouncementType
  icon: LucideIcon
}> = [
  { id: 'all', label: 'Todas', icon: Layers },
  { id: 'UPDATE', label: 'Actualizaciones', type: 'UPDATE', icon: TrendingUp },
  {
    id: 'MAINTENANCE',
    label: 'Mantenimientos',
    type: 'MAINTENANCE',
    icon: Wrench,
  },
  {
    id: 'COMMUNICATION',
    label: 'Comunicados',
    type: 'COMMUNICATION',
    icon: FileText,
  },
]

export default function AnnouncementsFeedPage() {
  const [filters, setFilters] = useState<AnnouncementFilters>({
    page: 1,
    pageSize: 10,
  })
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<AnnouncementItem | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const {
    data: announcementsData,
    isLoading,
    isError,
    refetch,
  } = useAnnouncements(filters)
  const { data: unreadData } = useUnreadAnnouncementsCount()
  const mutations = useAnnouncementMutations()

  const unreadCount = unreadData?.count ?? 0
  const announcements = announcementsData?.data ?? []
  const pagination = announcementsData?.pagination

  const handleTabChange = (type?: AnnouncementType) => {
    setFilters((prev) => ({
      ...prev,
      type,
      page: 1,
    }))
  }

  const handleOpenDetail = (announcement: AnnouncementItem) => {
    setSelectedAnnouncement(announcement)
    setIsDetailOpen(true)
    if (!announcement.isRead) {
      mutations.markAsRead.mutate(announcement.id)
    }
  }

  const handleMarkAsRead = (id: string) => {
    mutations.markAsRead.mutate(id, {
      onSuccess: () => {
        toast.success('Novedad marcada como leída.')
      },
      onError: () => {
        toast.error('No se pudo marcar la novedad.')
      },
    })
  }

  const handleMarkAllAsRead = async () => {
    try {
      const res = await mutations.markAllAsRead.mutateAsync()
      toast.success(
        res.updatedCount > 0
          ? `${res.updatedCount} novedades marcadas como leídas.`
          : 'Todas las novedades ya se encuentran leídas.',
      )
    } catch {
      toast.error('No se pudieron marcar las novedades.')
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Header conforming to Torcly standard */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <span>Plataforma SaaS</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-brand-forest sm:text-[2rem]">
              Novedades del Sistema
            </h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {unreadCount} {unreadCount === 1 ? 'nueva' : 'nuevas'}
              </span>
            )}
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Historial de versiones de Torcly, mejoras operativas, tutoriales en
            video y avisos preventivos de mantenimiento de la plataforma.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={mutations.markAllAsRead.isPending}
            className="self-start gap-1.5"
          >
            <CheckCheck size={14} />
            <span>Marcar todas como leídas</span>
          </Button>
        )}
      </header>

      {/* Category Tabs */}
      <div className="flex border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden overflow-x-auto gap-2">
        {CATEGORY_TABS.map((tab) => {
          const isActive = filters.type === tab.type
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.type)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors shrink-0 ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-muted hover:text-foreground'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Content area */}
      {isLoading ? (
        <div className="rounded-xl border bg-card p-8 text-center text-xs text-muted-foreground">
          Cargando novedades del sistema…
        </div>
      ) : isError ? (
        <ErrorState
          title="Error al cargar las novedades"
          description="No se pudieron obtener las publicaciones en este momento."
          action={{
            label: 'Reintentar',
            onClick: () => {
              void refetch()
            },
          }}
        />
      ) : announcements.length === 0 ? (
        <EmptyState
          title="No hay novedades en esta sección"
          description="Te notificaremos tan pronto como se publiquen nuevas versiones o comunicados del sistema."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <div className="divide-y divide-border/60">
            {announcements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                onOpenDetail={handleOpenDetail}
                onMarkAsRead={handleMarkAsRead}
                isMarking={mutations.markAsRead.isPending}
              />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
            />
          )}
        </div>
      )}

      {/* Detail Modal */}
      <AnnouncementDetailModal
        open={isDetailOpen}
        announcement={selectedAnnouncement}
        onClose={() => setIsDetailOpen(false)}
        onMarkAsRead={handleMarkAsRead}
      />
    </div>
  )
}
