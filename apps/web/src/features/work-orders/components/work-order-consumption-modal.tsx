import { useMemo, useState } from 'react'
import { CheckSquare, PackageMinus, Square } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useWorkOrdersMutations } from '../hooks/use-work-orders'
import type {
  WorkOrderDetail,
  WorkOrderExecution,
} from '../types/work-orders.types'
import {
  getWorkOrderErrorMessage,
  quantityFormatter,
} from '../utils/work-order-formatters'

interface WorkOrderConsumptionModalProps {
  open: boolean
  order: WorkOrderDetail | null
  execution: WorkOrderExecution | null
  executionLoading?: boolean
  onClose: () => void
  onBack?: () => void
}

type QuantitiesByLine = Record<string, string>

function isValidQuantity(value: string, pending: number) {
  const quantity = Number(value)
  return (
    Number.isFinite(quantity) &&
    quantity > 0 &&
    quantity <= pending &&
    Math.abs(quantity * 1000 - Math.round(quantity * 1000)) < Number.EPSILON
  )
}

export function WorkOrderConsumptionModal({
  open,
  order,
  execution,
  executionLoading = false,
  onClose,
  onBack,
}: WorkOrderConsumptionModalProps) {
  const mutations = useWorkOrdersMutations()
  const [selectedLineIds, setSelectedLineIds] = useState<string[]>([])
  const [quantities, setQuantities] = useState<QuantitiesByLine>({})
  const busy = mutations.consume.isPending
  const pendingLines = useMemo(
    () => (execution?.productLines ?? []).filter((line) => line.pending > 0),
    [execution?.productLines],
  )
  const allSelected =
    pendingLines.length > 0 &&
    pendingLines.every((line) => selectedLineIds.includes(line.lineId))

  const closeModal = () => {
    if (busy) return
    setSelectedLineIds([])
    setQuantities({})
    onClose()
  }

  const backToDetail = () => {
    if (busy) return
    setSelectedLineIds([])
    setQuantities({})
    ;(onBack ?? onClose)()
  }

  const toggleLine = (lineId: string) => {
    setSelectedLineIds((current) =>
      current.includes(lineId)
        ? current.filter((id) => id !== lineId)
        : [...current, lineId],
    )
  }

  const toggleAll = () => {
    setSelectedLineIds(
      allSelected ? [] : pendingLines.map((line) => line.lineId),
    )
  }

  const submit = async () => {
    if (!order) return
    if (!selectedLineIds.length) {
      toast.error('Marca al menos un repuesto para registrar el consumo.')
      return
    }

    const selectedLines = pendingLines.filter((line) =>
      selectedLineIds.includes(line.lineId),
    )
    const invalidLine = selectedLines.find(
      (line) =>
        !isValidQuantity(
          quantities[line.lineId] ?? String(line.pending),
          line.pending,
        ),
    )
    if (invalidLine) {
      toast.error(
        `Revisa la cantidad de ${invalidLine.name}. Debe ser mayor a cero, no superar ${quantityFormatter.format(invalidLine.pending)} y tener hasta 3 decimales.`,
      )
      return
    }

    try {
      await mutations.consume.mutateAsync({
        id: order.id,
        input: {
          requestId: crypto.randomUUID(),
          items: selectedLines.map((line) => ({
            lineId: line.lineId,
            quantity: Number(quantities[line.lineId] ?? line.pending),
          })),
        },
      })
      toast.success(
        selectedLines.length === 1
          ? 'Consumo registrado correctamente.'
          : `${selectedLines.length} consumos registrados correctamente.`,
      )
      backToDetail()
    } catch (error) {
      toast.error(getWorkOrderErrorMessage(error))
    }
  }

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title="Consumir repuestos"
      description={
        order
          ? `Marca los repuestos utilizados en la orden ${order.code} y confirma sus cantidades.`
          : undefined
      }
      className="max-w-2xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={backToDetail}>
            Atrás
          </Button>
          <Button
            type="button"
            disabled={busy || executionLoading || pendingLines.length === 0}
            onClick={() => void submit()}
          >
            {busy ? 'Registrando…' : 'Registrar consumos'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-foreground">
            Repuestos pendientes
          </p>
          {pendingLines.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy || executionLoading}
              onClick={toggleAll}
              aria-pressed={allSelected}
            >
              {allSelected ? (
                <CheckSquare aria-hidden size={16} />
              ) : (
                <Square aria-hidden size={16} />
              )}
              {allSelected ? 'Desmarcar todos' : 'Marcar todos'}
            </Button>
          )}
        </div>

        {executionLoading ? (
          <p className="rounded-lg bg-muted/60 px-3 py-3 text-sm text-muted-foreground">
            Cargando los repuestos pendientes…
          </p>
        ) : pendingLines.length === 0 ? (
          <p className="rounded-lg bg-muted/60 px-3 py-3 text-sm text-muted-foreground">
            No hay repuestos pendientes. Solo aparecen los productos del
            presupuesto aprobado que aún tienen cantidad por consumir.
          </p>
        ) : (
          <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
            {pendingLines.map((line) => {
              const selected = selectedLineIds.includes(line.lineId)
              const checkboxId = `consumption-line-${line.lineId}`
              return (
                <div
                  key={line.lineId}
                  className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 rounded-xl border border-border bg-card p-3 sm:grid-cols-[auto_minmax(0,1fr)_9rem] sm:items-center"
                >
                  <input
                    id={checkboxId}
                    type="checkbox"
                    checked={selected}
                    disabled={busy}
                    onChange={() => toggleLine(line.lineId)}
                    className="mt-1 size-4 rounded border-input accent-primary sm:mt-0"
                  />
                  <label
                    htmlFor={checkboxId}
                    className="min-w-0 cursor-pointer"
                  >
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {line.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {line.code} · Pendiente:{' '}
                      {quantityFormatter.format(line.pending)}
                      {line.unitLabel ? ` ${line.unitLabel}` : ''}
                    </span>
                  </label>
                  <div className="col-start-2 mt-3 space-y-1 sm:col-start-auto sm:mt-0">
                    <label
                      htmlFor={`consumption-quantity-${line.lineId}`}
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Cantidad
                    </label>
                    <Input
                      id={`consumption-quantity-${line.lineId}`}
                      aria-label={`Cantidad para ${line.name}`}
                      type="number"
                      min="0.001"
                      max={line.pending}
                      step="0.001"
                      value={quantities[line.lineId] ?? String(line.pending)}
                      disabled={!selected || busy}
                      onChange={(event) =>
                        setQuantities((current) => ({
                          ...current,
                          [line.lineId]: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <p className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          <PackageMinus aria-hidden size={14} className="mt-0.5 shrink-0" />
          Se registrarán solo los repuestos marcados. Cada envío es idempotente:
          no duplicará la salida de inventario.
        </p>
      </div>
    </Modal>
  )
}
