import { useDeferredValue, useState, type ChangeEvent } from 'react'
import { Plus, Pencil, Power, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { ModuleMetrics } from '@/components/ui/module-metrics'
import { Pagination } from '@/components/ui/pagination'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { hasPermission } from '@/lib/permissions'
import {
  useTechnicianMutations,
  useTechnicians,
} from '../hooks/use-technicians'
import type {
  Technician,
  TechnicianFilters,
  TechnicianInput,
} from '../types/technicians.types'

const initial: TechnicianFilters = {
  search: '',
  status: 'all',
  page: 1,
  pageSize: 10,
}
const empty: TechnicianInput = {
  fullName: '',
  document: '',
  phone: '',
  email: '',
  specialties: '',
  notes: '',
}
export default function TechniciansPage() {
  const { user } = useAuth()
  const canWrite = hasPermission(user?.permissions ?? [], 'workshop:write')
  const [filters, setFilters] = useState(initial)
  const [editing, setEditing] = useState<Technician | null>(null)
  const [open, setOpen] = useState(false)
  const deferred = useDeferredValue(filters.search)
  const query = useTechnicians({ ...filters, search: deferred })
  const mutations = useTechnicianMutations()
  const rows = query.data?.data ?? []
  const submit = async (input: TechnicianInput) => {
    try {
      if (editing) await mutations.update.mutateAsync({ id: editing.id, input })
      else await mutations.create.mutateAsync(input)
      toast.success(
        editing
          ? 'Técnico actualizado correctamente.'
          : 'Técnico registrado correctamente.',
      )
      setOpen(false)
    } catch {
      toast.error('No se pudo guardar el técnico. Revisa los datos ingresados.')
    }
  }
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Operación de taller
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-brand-forest sm:text-[2rem]">
            Técnicos
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Registra al personal técnico disponible para asignar órdenes. No
            requieren una cuenta de acceso.
          </p>
        </div>
        {canWrite && (
          <Button
            onClick={() => {
              setEditing(null)
              setOpen(true)
            }}
          >
            <Plus size={17} /> Registrar técnico
          </Button>
        )}
      </header>
      <ModuleMetrics
        items={[
          {
            label: 'Técnicos encontrados',
            value: query.data?.pagination.total ?? 0,
          },
          {
            label: 'Activos en esta página',
            value: rows.filter((item) => item.active).length,
            tone: 'success',
          },
        ]}
      />
      <section className="rounded-2xl border bg-card p-4 shadow-[0_10px_28px_rgb(16_44_37_/_5%)] sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={filters.search}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                search: event.target.value,
                page: 1,
              }))
            }
            placeholder="Buscar por código, nombre, documento o teléfono"
            className="h-12 flex-1"
          />
          <select
            value={filters.status}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                status: event.target.value as TechnicianFilters['status'],
                page: 1,
              }))
            }
            className="h-12 rounded-xl border bg-background px-3 text-sm"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
      </section>
      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#eaf2ee] text-[11px] font-bold uppercase tracking-wider text-[#53685f]">
              <tr>
                <th className="px-5 py-3">Técnico</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Especialidades</th>
                <th className="px-4 py-3">Estado</th>
                {canWrite && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y">
              {query.isFetching ? (
                <tr>
                  <td className="px-5 py-8 text-muted-foreground" colSpan={5}>
                    Cargando técnicos…
                  </td>
                </tr>
              ) : rows.length ? (
                rows.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4">
                      <p className="font-semibold">{item.fullName}</p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {item.code}
                        {item.document ? ` · ${item.document}` : ''}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {item.phone ?? item.email ?? '—'}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {item.specialties ?? '—'}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={
                          item.active
                            ? 'rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700'
                            : 'rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600'
                        }
                      >
                        {item.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    {canWrite && (
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            className="rounded-lg p-2 hover:bg-muted"
                            aria-label={`Editar ${item.fullName}`}
                            onClick={() => {
                              setEditing(item)
                              setOpen(true)
                            }}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="rounded-lg p-2 hover:bg-muted"
                            aria-label={`${item.active ? 'Desactivar' : 'Activar'} ${item.fullName}`}
                            onClick={async () => {
                              try {
                                await mutations.status.mutateAsync({
                                  id: item.id,
                                  active: !item.active,
                                })
                                toast.success(
                                  item.active
                                    ? 'Técnico desactivado.'
                                    : 'Técnico activado.',
                                )
                              } catch {
                                toast.error('No se pudo actualizar el estado.')
                              }
                            }}
                          >
                            <Power size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-muted-foreground"
                  >
                    <Wrench className="mx-auto mb-3" />
                    No se encontraron técnicos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {query.data && (
          <Pagination
            page={filters.page}
            totalPages={query.data.pagination.totalPages}
            onPageChange={(page) =>
              setFilters((current) => ({ ...current, page }))
            }
          />
        )}
      </section>
      <TechnicianModal
        key={`${open}-${editing?.id ?? 'new'}`}
        open={open}
        technician={editing}
        busy={mutations.create.isPending || mutations.update.isPending}
        onClose={() => setOpen(false)}
        onSubmit={submit}
      />
    </div>
  )
}
function TechnicianModal({
  open,
  technician,
  busy,
  onClose,
  onSubmit,
}: {
  open: boolean
  technician: Technician | null
  busy: boolean
  onClose: () => void
  onSubmit: (input: TechnicianInput) => Promise<void>
}) {
  const [values, setValues] = useState<TechnicianInput>(
    technician
      ? {
          fullName: technician.fullName,
          document: technician.document ?? '',
          phone: technician.phone ?? '',
          email: technician.email ?? '',
          specialties: technician.specialties ?? '',
          notes: technician.notes ?? '',
        }
      : empty,
  )
  const set =
    (key: keyof TechnicianInput) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((current) => ({ ...current, [key]: event.target.value }))
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={technician ? 'Editar técnico' : 'Registrar técnico'}
      description="Los técnicos no necesitan usuario ni contraseña para ser asignados."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button form="technician-form" type="submit" disabled={busy}>
            {busy ? 'Guardando…' : 'Guardar técnico'}
          </Button>
        </>
      }
    >
      <form
        id="technician-form"
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault()
          void onSubmit({
            ...values,
            fullName: values.fullName.trim(),
            document: values.document?.trim() || null,
            phone: values.phone?.trim() || null,
            email: values.email?.trim() || null,
            specialties: values.specialties?.trim() || null,
            notes: values.notes?.trim() || null,
          })
        }}
      >
        <label className="sm:col-span-2 text-sm font-medium">
          Nombre completo *
          <Input
            required
            value={values.fullName}
            onChange={set('fullName')}
            placeholder="Ej. Carlos Mendoza Ramos"
            className="mt-2"
          />
        </label>
        <label className="text-sm font-medium">
          Documento
          <Input
            value={values.document ?? ''}
            onChange={set('document')}
            className="mt-2"
          />
        </label>
        <label className="text-sm font-medium">
          Teléfono
          <Input
            value={values.phone ?? ''}
            onChange={set('phone')}
            className="mt-2"
          />
        </label>
        <label className="text-sm font-medium">
          Correo electrónico
          <Input
            type="email"
            value={values.email ?? ''}
            onChange={set('email')}
            className="mt-2"
          />
        </label>
        <label className="text-sm font-medium">
          Especialidades
          <Input
            value={values.specialties ?? ''}
            onChange={set('specialties')}
            placeholder="Frenos, diagnóstico…"
            className="mt-2"
          />
        </label>
        <label className="sm:col-span-2 text-sm font-medium">
          Notas
          <textarea
            value={values.notes ?? ''}
            onChange={set('notes')}
            className="mt-2 min-h-24 w-full rounded-xl border bg-background px-3 py-2 text-sm"
          />
        </label>
      </form>
    </Modal>
  )
}
