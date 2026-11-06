import { useState } from 'react'
import { Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
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
      title="Gestionar suscripción SaaS"
      description={`Configuración de plan y vigencia para ${subscription.organizationName} (${subscription.organizationCode}).`}
      className="max-w-2xl"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button type="submit" form="subscription-edit-form" disabled={busy}>
            {busy ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      }
    >
      <form
        id="subscription-edit-form"
        onSubmit={(e) => void handleSubmit(e)}
        noValidate
        className="space-y-5"
      >
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-xs text-emerald-950">
          <div className="flex items-center gap-2 font-semibold text-emerald-900 text-sm">
            <Crown className="size-4 text-primary" />
            <span>Plan asignado actualmente: {selectedPlan.name}</span>
          </div>
          <p className="mt-1.5 text-xs text-emerald-800">
            Límites del plan: hasta {selectedPlan.maxMembers} miembros,{' '}
            {selectedPlan.maxTechnicians} técnicos y {selectedPlan.maxProducts}{' '}
            productos en inventario.
          </p>
        </div>

        <Field label="Plan comercial" required>
          <SmartSelect
            value={planId}
            onChange={setPlanId}
            options={planSelectOptions}
            aria-label="Seleccionar plan comercial"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Estado de la suscripción" required>
            <SmartSelect
              value={status}
              onChange={(val) => setStatus(val as SubscriptionStatus)}
              options={statusOptions}
              aria-label="Estado de suscripción"
            />
          </Field>

          <Field label="Ciclo de facturación" required>
            <SmartSelect
              value={billingCycle}
              onChange={(val) => setBillingCycle(val as BillingCycle)}
              options={billingCycleOptions}
              aria-label="Ciclo de facturación"
            />
          </Field>
        </div>

        <Field
          label="Fecha de renovación o vencimiento"
          hint="Dejar vacío si la suscripción no tiene fecha de corte definida."
        >
          <DatePicker
            value={renewalDate}
            onChange={setRenewalDate}
            placeholder="Seleccionar fecha de renovación"
          />
        </Field>

        <Field
          label="Observaciones o notas administrativas"
          hint="Quedan registradas para el equipo de soporte y facturación."
        >
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej. Promoción 3 meses de descuento / Upgrade autorizado por soporte"
            maxLength={500}
          />
        </Field>

        {selectedPlan.features.length > 0 && (
          <div className="rounded-xl border border-border bg-muted/40 p-3.5">
            <span className="block font-semibold text-xs text-foreground uppercase tracking-wider">
              Beneficios incluidos en este plan:
            </span>
            <ul className="mt-2.5 grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-2">
              {selectedPlan.features.map((feat, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="inline-block size-1.5 shrink-0 rounded-full bg-emerald-700"
                    style={{
                      width: '6px',
                      height: '6px',
                      minWidth: '6px',
                      minHeight: '6px',
                    }}
                  />
                  <span className="leading-snug text-foreground/80">
                    {feat}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </Modal>
  )
}

function Field({
  label,
  error,
  hint,
  required,
  children,
}: {
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span>
        {label}
        {required && <span className="ml-1 text-emerald-700">*</span>}
      </span>
      {children}
      {error ? (
        <span className="block text-xs font-normal text-red-600">{error}</span>
      ) : hint ? (
        <span className="block text-xs font-normal text-muted-foreground">
          {hint}
        </span>
      ) : null}
    </label>
  )
}
