import { useState } from 'react'
import { Building2, Edit2, Plus, Power, PowerOff, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { SmartSelect } from '@/components/ui/smart-select'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { hasPermission } from '@/lib/permissions'
import { usePurchaseMutations, useSuppliers } from '../hooks/use-purchases'
import type { SupplierFilters, SupplierSummary } from '../types/purchases.types'
import { getPurchaseErrorMessage } from '../utils/purchase-formatters'
import { SupplierFormModal } from './supplier-form-modal'

interface SuppliersModalProps {
  open: boolean
  onClose: () => void
}

const initialFilters: SupplierFilters = {
  search: '',
  active: 'all',
  page: 1,
  pageSize: 10,
}

export function SuppliersModal({ open, onClose }: SuppliersModalProps) {
  const { user } = useAuth()
  const canWrite = hasPermission(user?.permissions ?? [], 'purchases:write')
  const [filters, setFilters] = useState<SupplierFilters>(initialFilters)
  const [supplierFormOpen, setSupplierFormOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] =
    useState<SupplierSummary | null>(null)

  const suppliersQuery = useSuppliers(filters, open)
  const mutations = usePurchaseMutations()

  const suppliers = suppliersQuery.data?.data ?? []
  const total = suppliersQuery.data?.pagination.total ?? 0
  const totalPages = suppliersQuery.data?.pagination.totalPages ?? 1

  const handleToggleStatus = async (supplier: SupplierSummary) => {
    try {
      await mutations.toggleSupplierStatus.mutateAsync({
        id: supplier.id,
        active: !supplier.active,
      })
      toast.success(
        supplier.active
          ? 'Proveedor desactivado.'
          : 'Proveedor reactivado exitosamente.',
      )
    } catch (error) {
      toast.error(getPurchaseErrorMessage(error))
    }
  }

  const openCreate = () => {
    setEditingSupplier(null)
    setSupplierFormOpen(true)
  }

  const openEdit = (supplier: SupplierSummary) => {
    setEditingSupplier(supplier)
    setSupplierFormOpen(true)
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title="Gestión de Proveedores">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="search"
                placeholder="Buscar por razón social, documento o contacto…"
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    search: e.target.value,
                    page: 1,
                  }))
                }
                className="h-9 pl-9 pr-3 text-xs"
                aria-label="Buscar proveedores"
              />
            </div>

            <div className="flex items-center gap-2">
              <SmartSelect
                value={filters.active}
                onChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    active: value as SupplierFilters['active'],
                    page: 1,
                  }))
                }
                aria-label="Filtrar por estado del proveedor"
                options={[
                  { value: 'all', label: 'Todos los estados' },
                  { value: 'true', label: 'Activos' },
                  { value: 'false', label: 'Inactivos' },
                ]}
                className="w-44"
              />

              {canWrite && (
                <Button
                  onClick={openCreate}
                  className="h-8 px-3 text-xs gap-1.5"
                >
                  <Plus size={15} />
                  Nuevo proveedor
                </Button>
              )}
            </div>
          </div>

          {suppliersQuery.isLoading && (
            <div className="space-y-2" aria-label="Cargando proveedores">
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  className="h-12 animate-pulse rounded-lg bg-muted"
                />
              ))}
            </div>
          )}

          {suppliersQuery.isError && (
            <ErrorState
              title="No se pudieron cargar los proveedores"
              action={{
                label: 'Reintentar',
                onClick: () => suppliersQuery.refetch(),
              }}
            />
          )}

          {!suppliersQuery.isLoading &&
            !suppliersQuery.isError &&
            suppliers.length === 0 && (
              <EmptyState
                icon={Building2}
                title="No hay proveedores"
                description={
                  filters.search
                    ? 'No se encontraron resultados para tu búsqueda.'
                    : 'Aún no hay proveedores registrados.'
                }
              />
            )}

          {!suppliersQuery.isLoading &&
            !suppliersQuery.isError &&
            suppliers.length > 0 && (
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[#d6e3dd] bg-[#eaf2ee] text-[11px] font-bold uppercase tracking-wider text-[#53685f]">
                    <tr>
                      <th className="px-4 py-2.5">Razón Social</th>
                      <th className="px-3 py-2.5">Documento</th>
                      <th className="px-3 py-2.5">Contacto</th>
                      <th className="px-3 py-2.5">Estado</th>
                      {canWrite && (
                        <th className="w-20 px-3 py-2.5 text-right">
                          <span className="sr-only">Acciones</span>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y text-xs">
                    {suppliers.map((s) => (
                      <tr key={s.id} className="hover:bg-muted/30">
                        <td className="px-4 py-2.5 font-medium">
                          {s.legalName}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-muted-foreground">
                          {s.documentNumber}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {s.contactName || s.phone || s.email || '—'}
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              s.active
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-zinc-100 text-zinc-600'
                            }`}
                          >
                            {s.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        {canWrite && (
                          <td className="px-3 py-2.5 text-right">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => openEdit(s)}
                                className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                                aria-label={`Editar proveedor ${s.legalName}`}
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(s)}
                                className={`flex size-7 items-center justify-center rounded-lg ${
                                  s.active
                                    ? 'text-amber-600 hover:bg-amber-50'
                                    : 'text-emerald-600 hover:bg-emerald-50'
                                }`}
                                aria-label={
                                  s.active
                                    ? `Desactivar proveedor ${s.legalName}`
                                    : `Activar proveedor ${s.legalName}`
                                }
                              >
                                {s.active ? (
                                  <PowerOff size={13} />
                                ) : (
                                  <Power size={13} />
                                )}
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {total} {total === 1 ? 'proveedor' : 'proveedores'} (Página{' '}
                {filters.page} de {totalPages})
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="h-8 px-3 text-xs"
                  disabled={filters.page <= 1}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  className="h-8 px-3 text-xs"
                  disabled={filters.page >= totalPages}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <SupplierFormModal
        open={supplierFormOpen}
        supplier={editingSupplier}
        onClose={() => {
          setSupplierFormOpen(false)
          setEditingSupplier(null)
        }}
      />
    </>
  )
}
