import { useState } from 'react'
import { Crown, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { SmartSelect } from '@/components/ui/smart-select'
import type {
  OrganizationSubscription,
  Plan,
  SubscriptionStatus,
  BillingCycle,
  UpdatePlatformSubscriptionInput,
} from '../types/subscriptions.types'

interface SubscriptionEditModalProps {
  subscription: OrganizationSubscription | null
  plans: Plan[]
  busy: boolean
  onClose: () => void
  onSubmit: (
    organizationId: string,
    input: UpdatePlatformSubscriptionInput,
  ) => Promise<void>
}

const statusOptions: Array<{ value: SubscriptionStatus; label: string }> = [
  { value: 'ACTIVE', label: 'Activa' },
  { value: 'TRIAL', label: 'En prueba' },
  { value: 'PAST_DUE', label: 'Vencida / Pago pendiente' },
  { value: 'SUSPENDED', label: 'Suspendida' },
  { value: 'CANCELED', label: 'Cancelada' },
]

const billingCycleOptions: Array<{ value: BillingCycle; label: string }> = [
  { value: 'MONTHLY', label: 'Mensual' },
  { value: 'ANNUAL', label: 'Anual' },
]

export function SubscriptionEditModal({
  subscription,
  plans,
  busy,
  onClose,
  onSubmit,
}: SubscriptionEditModalProps) {
  if (!subscription) return null

  return (
    <SubscriptionEditForm
      key={subscription.id}
      subscription={subscription}
      plans={plans}
      busy={busy}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  )
}

function SubscriptionEditForm({
  subscription,
  plans,
  busy,
  onClose,
  onSubmit,
}: {
  subscription: OrganizationSubscription
  plans: Plan[]
  busy: boolean
  onClose: () => void
  onSubmit: (
    organizationId: string,
    input: UpdatePlatformSubscriptionInput,
  ) => Promise<void>
}) {
  const initialDate = subscription.renewsAt
    ? subscription.renewsAt.substring(0, 10)
    : ''

  const [planId, setPlanId] = useState(subscription.planId)
  const [status, setStatus] = useState<SubscriptionStatus>(subscription.status)
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    subscription.billingCycle,
  )
  const [renewalDate, setRenewalDate] = useState(initialDate)
  const [notes, setNotes] = useState(subscription.notes ?? '')

  const selectedPlan = plans.find((p) => p.id === planId) ?? subscription.plan

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const isoDate = renewalDate
      ? new Date(`${renewalDate}T23:59:59.000Z`).toISOString()
      : null

    await onSubmit(subscription.organizationId, {
      planId,
      status,
      billingCycle,
      renewsAt: isoDate,
      notes: notes.trim() || null,
    })
  }

  const planSelectOptions = plans.map((plan) => ({
    value: plan.id,
    label: `${plan.name} (${plan.code}) — Max ${plan.maxMembers} miembros, ${plan.maxTechnicians} técnicos`,
  }))

  return (
    <Modal
      open
      onClose={onClose}
      busy={busy}
      title="Gestionar Suscripción SaaS"
      description={`Configuración de plan y vigencia para ${subscription.organizationName} (${subscription.organizationCode}).`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" disabled={busy} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="subscription-edit-form"
            disabled={busy}
            className="bg-brand-forest hover:bg-brand-forest/90"
          >
            Guardar cambios
          </Button>
        </div>
      }
    >
      <form
        id="subscription-edit-form"
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4 text-xs"
      >
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5 text-xs text-emerald-950">
          <div className="flex items-center gap-2 font-semibold text-emerald-900">
            <Crown className="size-4 text-brand-forest" />
            <span>Plan asignado actualmente: {selectedPlan.name}</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-800">
            Límites del plan: hasta {selectedPlan.maxMembers} miembros,{' '}
            {selectedPlan.maxTechnicians} técnicos y {selectedPlan.maxProducts}{' '}
            productos en inventario.
          </p>
        </div>

        <div>
          <label className="block font-medium text-foreground">
            Plan comercial *
          </label>
          <SmartSelect
            value={planId}
            onChange={setPlanId}
            options={planSelectOptions}
            className="mt-1.5"
            aria-label="Seleccionar plan comercial"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block font-medium text-foreground">
              Estado de la suscripción *
            </label>
            <SmartSelect
              value={status}
              onChange={(val) => setStatus(val as SubscriptionStatus)}
              options={statusOptions}
              className="mt-1.5"
              aria-label="Estado de suscripción"
            />
          </div>

          <div>
            <label className="block font-medium text-foreground">
              Ciclo de facturación *
            </label>
            <SmartSelect
              value={billingCycle}
              onChange={(val) => setBillingCycle(val as BillingCycle)}
              options={billingCycleOptions}
              className="mt-1.5"
              aria-label="Ciclo de facturación"
            />
          </div>
        </div>

        <div>
          <label className="block font-medium text-foreground">
            Fecha de renovación o vencimiento
          </label>
          <Input
            type="date"
            value={renewalDate}
            onChange={(e) => setRenewalDate(e.target.value)}
            className="mt-1.5"
          />
          <span className="mt-1 block text-[11px] text-muted-foreground">
            Dejar vacío si la suscripción no tiene fecha de corte definida.
          </span>
        </div>

        <div>
          <label className="block font-medium text-foreground">
            Observaciones o notas administrativas
          </label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej. Promoción 3 meses de descuento / Upgrade autorizado por soporte"
            maxLength={500}
            className="mt-1.5"
          />
        </div>

        {selectedPlan.features.length > 0 && (
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <Sparkles className="size-3.5 text-brand-forest" />
              Beneficios incluidos en este plan:
            </span>
            <ul className="mt-2 grid grid-cols-1 gap-1 text-[11px] text-muted-foreground sm:grid-cols-2">
              {selectedPlan.features.map((feat, idx) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-brand-forest" />
                  {feat}
                </li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </Modal>
  )
}
