import { useState } from 'react'
import { Building2, Edit2, Plus, Power, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Input } from '@/components/ui/input'
import { ModuleMetrics } from '@/components/ui/module-metrics'
import { Pagination } from '@/components/ui/pagination'
import { SmartSelect } from '@/components/ui/smart-select'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { hasPermission } from '@/lib/permissions'
import { SupplierFormModal } from '../components/supplier-form-modal'
import { usePurchaseMutations, useSuppliers } from '../hooks/use-purchases'
import type { SupplierFilters, SupplierSummary } from '../types/purchases.types'
import { getPurchaseErrorMessage } from '../utils/purchase-formatters'

const initialFilters: SupplierFilters = {
  search: '',
  active: 'all',
  page: 1,
  pageSize: 15,
}

export default function SuppliersPage() {
  const { user } = useAuth()
  const canWrite = hasPermission(user?.permissions ?? [], 'purchases:write')
  const [filters, setFilters] = useState<SupplierFilters>(initialFilters)
  const [supplierFormOpen, setSupplierFormOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] =
    useState<SupplierSummary | null>(null)
  const [supplierToToggle, setSupplierToToggle] =
    useState<SupplierSummary | null>(null)

  const suppliersQuery = useSuppliers(filters, true)
  const mutations = usePurchaseMutations()

  const suppliers = suppliersQuery.data?.data ?? []
  const total = suppliersQuery.data?.pagination.total ?? 0
  const totalPages = suppliersQuery.data?.pagination.totalPages ?? 1

  const activeCount = suppliers.filter((s) => s.active).length
  const inactiveCount = suppliers.filter((s) => !s.active).length

  const handleToggleStatus = async () => {
    if (!supplierToToggle) return
    const nextActive = !supplierToToggle.active
    try {
      await mutations.toggleSupplierStatus.mutateAsync({
        id: supplierToToggle.id,
        active: nextActive,
      })
      toast.success(
        nextActive
          ? `Proveedor "${supplierToToggle.legalName}" reactivado exitosamente.`
          : `Proveedor "${supplierToToggle.legalName}" desactivado.`,
      )
      setSupplierToToggle(null)
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
    <div className="space-y-6">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Catálogo y Abastecimiento
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-forest sm:text-[2rem]">
            Proveedores
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Directorio de distribuidores mayoristas de repuestos, talleres
            aliados y proveedores de suministros para el taller.
          </p>
        </div>
        {canWrite && (
          <div className="flex shrink-0">
            <Button onClick={openCreate} className="gap-1.5">
              <Plus size={17} />
              Nuevo proveedor
            </Button>
          </div>
        )}
      </header>

      <ModuleMetrics
        items={[
          { label: 'Proveedores registrados', value: total },
          {
            label: 'Activos',
            value: activeCount,
            valueLabel: 'en esta página',
            tone: 'success',
          },
          {
            label: 'Inactivos',
            value: inactiveCount,
            valueLabel: 'en esta página',
            tone: 'default',
          },
        ]}
      />

      <section
        aria-label="Filtros de proveedores"
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-[0_10px_28px_rgb(16_44_37_/_5%)] sm:p-5"
      >
        <div className="relative flex-1 min-w-[240px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Buscar por razón social, RUC, DNI o contacto…"
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                search: e.target.value,
                page: 1,
              }))
            }
            className="h-10 pl-9 pr-3 text-sm"
            aria-label="Buscar proveedores"
          />
        </div>

        <div className="w-48">
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
              { value: 'true', label: 'Solo activos' },
              { value: 'false', label: 'Solo inactivos' },
            ]}
          />
        </div>
      </section>

      <section
        aria-label="Resultados de proveedores"
        className="overflow-hidden rounded-2xl border bg-card shadow-[0_10px_35px_rgba(16,44,37,0.04)]"
      >
        {suppliersQuery.isLoading && (
          <div className="space-y-3 p-5" aria-label="Cargando proveedores">
            {Array.from({ length: 5 }, (_, index) => (
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
              title="No se encontraron proveedores"
              description={
                filters.search
                  ? 'No hay proveedores que coincidan con los criterios de búsqueda.'
                  : 'Aún no has registrado ningún proveedor comercial en el taller.'
              }
            />
          )}

        {!suppliersQuery.isLoading &&
          !suppliersQuery.isError &&
          suppliers.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#d6e3dd] bg-[#eaf2ee] text-[11px] font-bold uppercase tracking-wider text-[#53685f]">
                  <tr>
                    <th className="px-5 py-3">Razón Social / Nombre</th>
                    <th className="px-4 py-3">RUC / DNI</th>
                    <th className="px-4 py-3">Contacto</th>
                    <th className="px-4 py-3">Teléfono / WhatsApp</th>
                    <th className="px-4 py-3">Correo</th>
                    <th className="px-4 py-3">Estado</th>
                    {canWrite && (
                      <th className="w-24 px-4 py-3 text-right">
                        <span className="sr-only">Acciones</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {suppliers.map((supplier) => (
                    <tr
                      key={supplier.id}
                      className="transition-colors hover:bg-muted/15"
                    >
                      <td className="px-5 py-3.5 font-semibold text-brand-forest">
                        {supplier.legalName}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                        {supplier.documentNumber}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {supplier.contactName || '—'}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {supplier.phone || '—'}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {supplier.email || '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            supplier.active
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          {supplier.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      {canWrite && (
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEdit(supplier)}
                              className="h-8 gap-1 px-2.5 text-xs"
                            >
                              <Edit2 size={13} />
                              <span>Editar</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSupplierToToggle(supplier)}
                              className={
                                supplier.active
                                  ? 'h-8 px-2 text-rose-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700'
                                  : 'h-8 px-2 text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'
                              }
                              title={
                                supplier.active
                                  ? 'Desactivar proveedor'
                                  : 'Activar proveedor'
                              }
                            >
                              <Power size={13} />
                            </Button>
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
          <div className="border-t border-border p-3">
            <Pagination
              page={filters.page}
              totalPages={totalPages}
              onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
            />
          </div>
        )}
      </section>

      {/* Modal de Creación / Edición */}
      <SupplierFormModal
        open={supplierFormOpen}
        supplier={editingSupplier}
        onClose={() => {
          setSupplierFormOpen(false)
          setEditingSupplier(null)
        }}
      />

      {/* Diálogo de Confirmación para Alternar Estado */}
      <ConfirmationDialog
        open={Boolean(supplierToToggle)}
        title={
          supplierToToggle?.active
            ? '¿Desactivar proveedor?'
            : '¿Activar proveedor?'
        }
        description={
          supplierToToggle?.active
            ? `El proveedor "${supplierToToggle.legalName}" quedará inactivo. No podrá ser seleccionado en nuevas órdenes de compra mientras permanezca inactivo.`
            : `El proveedor "${supplierToToggle?.legalName}" volverá a estar disponible para cotizaciones y compras.`
        }
        variant={supplierToToggle?.active ? 'danger' : 'success'}
        confirmLabel={
          supplierToToggle?.active ? 'Sí, desactivar' : 'Sí, activar'
        }
        cancelLabel="Cancelar"
        pending={mutations.toggleSupplierStatus.isPending}
        onConfirm={handleToggleStatus}
        onCancel={() => setSupplierToToggle(null)}
      />
    </div>
  )
}
