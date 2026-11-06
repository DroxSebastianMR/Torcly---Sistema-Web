import { useState } from 'react'
import { Edit3, Plus, Trash2, TrendingUp, Video } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Pagination } from '@/components/ui/pagination'
import { AnnouncementAdminFormModal } from '../components/announcement-admin-form-modal'
import {
  useActiveVersion,
  useAnnouncementMutations,
  useAnnouncements,
} from '../hooks/use-announcements'
import type {
  AnnouncementFilters,
  AnnouncementItem,
  AnnouncementStatus,
  AnnouncementType,
  CreateAnnouncementPayload,
  UpdateAnnouncementPayload,
} from '../types/announcements.types'
import {
  formatAnnouncementDate,
  getAnnouncementAppearance,
} from '../utils/announcement-formatters'

export default function AnnouncementsAdminPage() {
  const [filters, setFilters] = useState<AnnouncementFilters>({
    page: 1,
    pageSize: 10,
  })
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] =
    useState<AnnouncementItem | null>(null)

  const {
    data: announcementsData,
    isLoading,
    isError,
    refetch,
  } = useAnnouncements(filters)
  const { data: activeVersion } = useActiveVersion()
  const mutations = useAnnouncementMutations()

  const announcements = announcementsData?.data ?? []
  const pagination = announcementsData?.pagination

  const handleOpenCreate = () => {
    setEditingAnnouncement(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (item: AnnouncementItem) => {
    setEditingAnnouncement(item)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar el anuncio "${title}"?`)) {
      return
    }
    try {
      await mutations.deleteAnnouncement.mutateAsync(id)
      toast.success('Anuncio eliminado.')
    } catch {
      toast.error('No se pudo eliminar el anuncio.')
    }
  }

  const handleGenerateRelease = async () => {
    try {
      await mutations.generateVersionRelease.mutateAsync()
      toast.success('Anuncio de versión generado y publicado con éxito.')
    } catch {
      toast.error('No se pudo generar el anuncio de versión.')
    }
  }

  const handleCreateSubmit = async (payload: CreateAnnouncementPayload) => {
    await mutations.createAnnouncement.mutateAsync(payload)
  }

  const handleUpdateSubmit = async (
    id: string,
    payload: UpdateAnnouncementPayload,
  ) => {
    await mutations.updateAnnouncement.mutateAsync({ id, payload })
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <span>Consola de Administración SaaS</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-brand-forest sm:text-[2rem]">
              Gestión de Anuncios y Novedades
            </h1>
            {activeVersion && (
              <span
                style={{
                  backgroundColor: '#E7F6EF',
                  color: '#329B78',
                }}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold"
              >
                Versión activa: {activeVersion.versionTag}
              </span>
            )}
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Publica y administra releases de versiones, ventanas de
            mantenimiento programadas, comunicados generales y difusión a todos
            los talleres.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateRelease}
            disabled={mutations.generateVersionRelease.isPending}
            className="gap-1.5"
          >
            <TrendingUp size={14} className="text-primary" />
            <span>Generar Release v{activeVersion?.version ?? '1.1.2'}</span>
          </Button>

          <Button size="sm" onClick={handleOpenCreate} className="gap-1.5">
            <Plus size={14} />
            <span>Nuevo Anuncio</span>
          </Button>
        </div>
      </header>

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-xs">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-muted-foreground">Tipo:</span>
          <select
            value={filters.type ?? ''}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                type: (e.target.value as AnnouncementType) || undefined,
                page: 1,
              }))
            }
            className="rounded-md border border-input bg-background px-2.5 py-1 text-xs"
          >
            <option value="">Todos los tipos</option>
            <option value="UPDATE">Actualizaciones</option>
            <option value="MAINTENANCE">Mantenimientos</option>
            <option value="COMMUNICATION">Comunicados</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-muted-foreground">Estado:</span>
          <select
            value={filters.status ?? ''}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                status: (e.target.value as AnnouncementStatus) || undefined,
                page: 1,
              }))
            }
            className="rounded-md border border-input bg-background px-2.5 py-1 text-xs"
          >
            <option value="">Todos los estados</option>
            <option value="PUBLISHED">Publicados</option>
            <option value="DRAFT">Borradores</option>
            <option value="ARCHIVED">Archivados</option>
          </select>
        </div>
      </div>

      {/* Admin Announcements List */}
      {isLoading ? (
        <div className="rounded-xl border bg-card p-8 text-center text-xs text-muted-foreground">
          Cargando anuncios…
        </div>
      ) : isError ? (
        <ErrorState
          title="Error al consultar anuncios"
          description="No se pudo obtener la lista de anuncios."
          action={{
            label: 'Reintentar',
            onClick: () => {
              void refetch()
            },
          }}
        />
      ) : announcements.length === 0 ? (
        <EmptyState
          title="No hay anuncios registrados"
          description="Crea el primer comunicado o genera el anuncio de la versión activa."
          action={{
            label: 'Crear Anuncio',
            onClick: handleOpenCreate,
          }}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <div className="divide-y divide-border/60">
            {announcements.map((announcement) => {
              const appearance = getAnnouncementAppearance(announcement.type)
              const Icon = appearance.icon
              return (
                <div
                  key={announcement.id}
                  className="flex flex-col gap-4 p-4.5 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/30 transition-colors"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div
                      style={{
                        backgroundColor: appearance.bg,
                        color: appearance.accent,
                      }}
                      className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl"
                    >
                      <Icon size={16} />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">
                          {announcement.title}
                        </span>

                        <span
                          style={{
                            backgroundColor: appearance.bg,
                            color: appearance.accent,
                          }}
                          className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                        >
                          {appearance.label}
                        </span>

                        {announcement.versionTag && (
                          <span
                            style={{
                              backgroundColor: '#E7F6EF',
                              color: '#329B78',
                            }}
                            className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                          >
                            {announcement.versionTag}
                          </span>
                        )}

                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                            announcement.status === 'PUBLISHED'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : announcement.status === 'DRAFT'
                                ? 'bg-amber-500/10 text-amber-600'
                                : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {announcement.status}
                        </span>

                        {announcement.videoUrl && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Video size={11} /> Video
                          </span>
                        )}
                      </div>

                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {announcement.summary}
                      </p>

                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>
                          Publicado:{' '}
                          {formatAnnouncementDate(announcement.publishedAt)}
                        </span>
                        <span>•</span>
                        <span>Por: {announcement.createdBy}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(announcement)}
                      className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Edit3 size={13} />
                      <span>Editar</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleDelete(announcement.id, announcement.title)
                      }
                      className="h-8 gap-1 text-xs text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 size={13} />
                      <span>Eliminar</span>
                    </Button>
                  </div>
                </div>
              )
            })}
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

      {/* Admin Form Modal */}
      <AnnouncementAdminFormModal
        open={isFormOpen}
        initialData={editingAnnouncement}
        onClose={() => setIsFormOpen(false)}
        onSubmitCreate={handleCreateSubmit}
        onSubmitUpdate={handleUpdateSubmit}
      />
    </div>
  )
}
