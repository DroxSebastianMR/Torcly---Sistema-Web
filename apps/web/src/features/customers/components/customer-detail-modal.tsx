import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/error-state'
import { Modal } from '@/components/ui/modal'
import { useCustomer } from '../hooks/use-customers'
import type { Customer } from '../types/customers.types'
import {
  customerDisplayName,
  customerTypeLabel,
  dateFormatter,
  documentLabel,
} from '../utils/customer-formatters'

interface CustomerDetailModalProps {
  open: boolean
  customer?: Customer | null
  customerId?: string | null
  canWrite: boolean
  onClose: () => void
  onEdit: (customer: Customer) => void
}

export function CustomerDetailModal({
  open,
  customer,
  customerId,
  canWrite,
  onClose,
  onEdit,
}: CustomerDetailModalProps) {
  const remoteCustomer = useCustomer(
    customer?.id ?? customerId ?? '',
    open && !customer,
  )
  const details = customer ?? remoteCustomer.data

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={details ? customerDisplayName(details) : 'Ficha del cliente'}
      description={
        details
          ? `${documentLabel(details.type)} ${details.documentNumber}`
          : 'Consulta los datos registrados del cliente.'
      }
      className="max-w-2xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          {details && canWrite && (
            <Button type="button" onClick={() => onEdit(details)}>
              <Pencil size={16} /> Editar cliente
            </Button>
          )}
        </div>
      }
    >
      {remoteCustomer.isPending && !details ? (
        <CustomerDetailSkeleton />
      ) : remoteCustomer.isError && !details ? (
        <ErrorState
          title="No se pudo cargar la ficha"
          description="Verifica la conexión e inténtalo nuevamente."
          busy={remoteCustomer.isFetching}
          action={{
            label: 'Reintentar',
            onClick: () => void remoteCustomer.refetch(),
          }}
        />
      ) : details ? (
        <dl className="grid overflow-hidden rounded-2xl border border-[#dce9e2] sm:grid-cols-2">
          <Datum label="Documento" value={details.documentNumber} mono />
          <Datum label="Tipo" value={customerTypeLabel(details.type)} />
          <Datum label="Teléfono" value={details.phone} mono />
          <Datum label="Correo" value={details.email ?? 'Sin registro'} />
          <Datum label="Registrado" value={dateFormatter(details.createdAt)} />
          <Datum
            label="Última actualización"
            value={dateFormatter(details.updatedAt)}
          />
        </dl>
      ) : null}
    </Modal>
  )
}

function Datum({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="border-b border-[#e4ede8] px-4 py-3.5 odd:sm:border-r odd:sm:border-[#e4ede8] even:sm:border-l-0 sm:px-5 [&:nth-last-child(-n+2)]:sm:border-b-0">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd
        className={`mt-1.5 text-[15px] font-bold leading-6 text-foreground ${
          mono ? 'font-mono tracking-tight' : ''
        }`}
      >
        {value}
      </dd>
    </div>
  )
}

function CustomerDetailSkeleton() {
  return (
    <div className="grid animate-pulse gap-3 sm:grid-cols-2">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="rounded-xl border p-4">
          <div className="h-3 w-20 rounded bg-muted" />
          <div className="mt-3 h-4 w-36 rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}
