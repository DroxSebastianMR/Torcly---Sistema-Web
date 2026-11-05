import { useDeferredValue, useMemo, useState } from 'react'
import {
  Building2,
  Pencil,
  Power,
  Plus,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { SmartSelect } from '@/components/ui/smart-select'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { OrganizationFormModal } from '../components/organization-form-modal'
import { OrganizationEditModal } from '../components/organization-edit-modal'
import { OrganizationMembersModal } from '../components/organization-members-modal'
import {
  useCreatePlatformOrganization,
  useCreatePlatformOrganizationMember,
  usePlatformOrganizationMembers,
  usePlatformOrganizations,
  usePlatformRoles,
  useUpdatePlatformOrganizationMember,
  useUpdatePlatformOrganization,
  useUpdatePlatformOrganizationStatus,
} from '../hooks/use-platform-organizations'
import type {
  CreatePlatformOrganizationInput,
  PlatformOrganization,
  PlatformOrganizationFilters,
  UpdatePlatformOrganizationInput,
} from '../types/platform.types'

const initialFilters: PlatformOrganizationFilters = {
  search: '',
  status: 'all',
  page: 1,
  pageSize: 10,
}

function organizationError(error: unknown) {
  if (error instanceof Error && error.message) return error.message
  return 'No se pudo registrar la organización. Inténtalo nuevamente.'
}

export default function PlatformPage() {
  const { user } = useAuth()
  const [filters, setFilters] = useState(initialFilters)
  const [formOpen, setFormOpen] = useState(false)
  const [selectedOrganization, setSelectedOrganization] =
    useState<PlatformOrganization | null>(null)
  const [editingOrganization, setEditingOrganization] =
    useState<PlatformOrganization | null>(null)
  const deferredSearch = useDeferredValue(filters.search)
  const queryFilters = useMemo(
    () => ({ ...filters, search: deferredSearch }),
    [deferredSearch, filters],
  )
  const organizations = usePlatformOrganizations(queryFilters)
  const roles = usePlatformRoles()
  const createOrganization = useCreatePlatformOrganization()
  const members = usePlatformOrganizationMembers(selectedOrganization?.id)
  const updateOrganizationStatus = useUpdatePlatformOrganizationStatus()
  const updateOrganization = useUpdatePlatformOrganization()
  const createMember = useCreatePlatformOrganizationMember()
  const updateMember = useUpdatePlatformOrganizationMember()

  const updateFilters = (next: Partial<PlatformOrganizationFilters>) => {
    setFilters((current) => ({
      ...current,
      ...next,
      ...(next.search !== undefined || next.status !== undefined
        ? { page: 1 }
        : {}),
    }))
  }

  const submit = async (input: CreatePlatformOrganizationInput) => {
    try {
      await createOrganization.mutateAsync(input)
      setFormOpen(false)
      toast.success(`Organización ${input.name} creada correctamente.`)
    } catch (error) {
      toast.error(organizationError(error))
    }
  }

  const toggleOrganization = async (organization: PlatformOrganization) => {
    try {
      await updateOrganizationStatus.mutateAsync({
        organizationId: organization.id,
        active: !organization.active,
      })
      toast.success(
        organization.active
          ? 'Taller desactivado y sesiones revocadas.'
          : 'Taller activado correctamente.',
      )
    } catch (error) {
      toast.error(organizationError(error))
    }
  }

  const editOrganization = async (input: UpdatePlatformOrganizationInput) => {
    if (!editingOrganization) return
    try {
      await updateOrganization.mutateAsync({
        organizationId: editingOrganization.id,
        input,
      })
      setEditingOrganization(null)
      toast.success('Organización actualizada correctamente.')
    } catch (error) {
      toast.error(organizationError(error))
    }
  }

  const total = organizations.data?.pagination.total ?? 0
  const totalPages = organizations.data?.pagination.totalPages ?? 1

  return (
    <section className="space-y-7" aria-labelledby="platform-title">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
            Administración de plataforma
          </p>
          <h1
            id="platform-title"
            className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-brand-forest sm:text-4xl"
          >
            Organizaciones Torcly
          </h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Gestiona talleres y sus responsables. Esta consola nunca muestra ni
            concede acceso a sus datos operativos.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus aria-hidden className="size-4" />
          Nueva organización
        </Button>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-violet-100 bg-violet-50/70 p-5 shadow-sm">
          <ShieldCheck aria-hidden className="size-7 text-violet-600" />
          <h2 className="mt-5 text-base font-semibold text-brand-forest">
            Acceso de plataforma
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {user?.name ?? 'Administrador Torcly'} administra el catálogo
            global, sin entrar al espacio de ningún taller.
          </p>
        </article>
        <article className="rounded-2xl border border-sky-100 bg-sky-50/70 p-5 shadow-sm">
          <Building2 aria-hidden className="size-7 text-sky-600" />
          <h2 className="mt-5 text-base font-semibold text-brand-forest">
            Organizaciones registradas
          </h2>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-brand-forest">
            {total}
          </p>
        </article>
        <article className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5 shadow-sm">
          <UsersRound aria-hidden className="size-7 text-amber-700" />
          <h2 className="mt-5 text-base font-semibold text-brand-forest">
            Aislamiento operativo
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Cada sesión del taller opera únicamente con sus propios datos.
          </p>
        </article>
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_210px]">
          <label className="sr-only" htmlFor="organization-search">
            Buscar organización
          </label>
          <Input
            id="organization-search"
            value={filters.search}
            onChange={(event) => updateFilters({ search: event.target.value })}
            placeholder="Buscar por nombre o código del taller"
          />
          <SmartSelect
            id="organization-status"
            value={filters.status}
            onChange={(status) =>
              updateFilters({
                status: status as PlatformOrganizationFilters['status'],
              })
            }
            options={[
              { value: 'all', label: 'Todos los estados' },
              { value: 'active', label: 'Activas' },
              { value: 'inactive', label: 'Inactivas' },
            ]}
            placeholder="Todos los estados"
            searchThreshold={10}
            aria-label="Estado de organización"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-brand-forest">
              Talleres
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Responsables y membresías iniciales de cada organización.
            </p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            {total}
          </span>
        </div>

        {organizations.isLoading ? (
          <div className="space-y-3 p-5" aria-label="Cargando organizaciones">
            {[1, 2, 3].map((key) => (
              <div
                key={key}
                className="h-16 animate-pulse rounded-xl bg-muted"
              />
            ))}
          </div>
        ) : organizations.isError ? (
          <div className="p-8 text-center">
            <p className="font-medium text-destructive">
              No se pudo consultar las organizaciones.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => void organizations.refetch()}
            >
              Reintentar
            </Button>
          </div>
        ) : organizations.data?.data.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-[860px] w-full text-left text-sm">
              <thead className="bg-[#e9f2ed] text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="px-5 py-4">Organización</th>
                  <th className="px-5 py-4">Responsable</th>
                  <th className="px-5 py-4">Rol inicial</th>
                  <th className="px-5 py-4 text-center">Miembros</th>
                  <th className="px-5 py-4">Estado</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {organizations.data.data.map((organization) => (
                  <tr key={organization.id} className="bg-card">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-brand-forest">
                        {organization.name}
                      </p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {organization.code}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      {organization.owner ? (
                        <>
                          <p className="font-medium text-foreground">
                            {organization.owner.displayName}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {organization.owner.email}
                          </p>
                        </>
                      ) : (
                        <span className="text-muted-foreground">
                          Sin responsable
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {organization.owner?.role.name ?? '—'}
                    </td>
                    <td className="px-5 py-4 text-center font-semibold text-brand-forest">
                      {organization.memberCount}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={
                          organization.active
                            ? 'rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700'
                            : 'rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground'
                        }
                      >
                        {organization.active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingOrganization(organization)}
                        >
                          <Pencil aria-hidden className="size-4" />
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrganization(organization)}
                        >
                          <UsersRound aria-hidden className="size-4" />
                          Miembros
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={updateOrganizationStatus.isPending}
                          onClick={() => void toggleOrganization(organization)}
                        >
                          <Power aria-hidden className="size-4" />
                          {organization.active ? 'Desactivar' : 'Activar'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center">
            <Building2
              aria-hidden
              className="mx-auto size-9 text-muted-foreground"
            />
            <h3 className="mt-3 font-semibold text-brand-forest">
              No se encontraron organizaciones
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Ajusta la búsqueda o crea el primer taller desde esta consola.
            </p>
          </div>
        )}

        {!organizations.isLoading && !organizations.isError && (
          <Pagination
            page={filters.page}
            totalPages={totalPages}
            onPageChange={(page) => updateFilters({ page })}
          />
        )}
      </section>

      <OrganizationFormModal
        key={formOpen ? 'organization-form-open' : 'organization-form-closed'}
        open={formOpen}
        roles={roles.data?.data ?? []}
        busy={createOrganization.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={submit}
      />
      <OrganizationEditModal
        organization={editingOrganization}
        roles={roles.data?.data ?? []}
        busy={updateOrganization.isPending}
        onClose={() => setEditingOrganization(null)}
        onSubmit={editOrganization}
      />
      <OrganizationMembersModal
        organization={selectedOrganization}
        roles={roles.data?.data ?? []}
        members={members.data?.data ?? []}
        loading={members.isLoading}
        busy={createMember.isPending || updateMember.isPending}
        onClose={() => setSelectedOrganization(null)}
        onCreate={async (input) => {
          if (selectedOrganization) {
            await createMember.mutateAsync({
              organizationId: selectedOrganization.id,
              input,
            })
          }
        }}
        onUpdate={async (userId, input) => {
          if (selectedOrganization) {
            await updateMember.mutateAsync({
              organizationId: selectedOrganization.id,
              userId,
              input,
            })
          }
        }}
      />
    </section>
  )
}
