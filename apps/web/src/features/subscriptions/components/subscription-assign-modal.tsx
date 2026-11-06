import { useState } from 'react'
import { Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { SmartSelect } from '@/components/ui/smart-select'
import type { PlatformOrganization } from '@/features/platform/types/platform.types'
import type {
  AssignSubscriptionInput,
  BillingCycle,
  Plan,
  SubscriptionStatus,
} from '../types/subscriptions.types'

interface SubscriptionAssignModalProps {
  open: boolean
  organizations: PlatformOrganization[]
  plans: Plan[]
  initialOrganizationId?: string
  busy: boolean
  onClose: () => void
  onSubmit: (input: AssignSubscriptionInput) => Promise<void>
}

const statusOptions: Array<{ value: SubscriptionStatus; label: string }> = [
  { value: 'ACTIVE', label: 'Activa' },
  { value: 'TRIAL', label: 'En prueba' },
  { value: 'PAST_DUE', label: 'Vencida / Pago pendiente' },
  { value: 'SUSPENDED', label: 'Suspendida' },
  { value: 'CANCELED', label: 'Cancelada' },
]

const billingCycleOptions: Array<{ value: BillingCycle; label: string }> = [
  { value: 'ANNUAL', label: 'Anual (Recomendado)' },
  { value: 'MONTHLY', label: 'Mensual' },
]

export function SubscriptionAssignModal({
  open,
  organizations,
  plans,
  initialOrganizationId,
  busy,
  onClose,
  onSubmit,
}: SubscriptionAssignModalProps) {
  if (!open) return null

  return (
    <SubscriptionAssignForm
      organizations={organizations}
      plans={plans}
      initialOrganizationId={initialOrganizationId}
      busy={busy}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  )
}

function SubscriptionAssignForm({
  organizations,
  plans,
  initialOrganizationId,
  busy,
  onClose,
  onSubmit,
}: {
  organizations: PlatformOrganization[]
  plans: Plan[]
  initialOrganizationId?: string
  busy: boolean
  onClose: () => void
  onSubmit: (input: AssignSubscriptionInput) => Promise<void>
}) {
  const today = new Date().toISOString().substring(0, 10)
  const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .substring(0, 10)

  const [organizationId, setOrganizationId] = useState(
    initialOrganizationId ?? (organizations[0]?.id || ''),
  )
  const [planId, setPlanId] = useState(plans[0]?.id || '')
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('ANNUAL')
  const [status, setStatus] = useState<SubscriptionStatus>('ACTIVE')
  const [startDate, setStartDate] = useState(today)
  const [renewalDate, setRenewalDate] = useState(oneYearLater)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleCycleChange = (nextCycle: BillingCycle) => {
    setBillingCycle(nextCycle)
    const baseDate = startDate ? new Date(`${startDate}T12:00:00Z`) : new Date()
    const days = nextCycle === 'ANNUAL' ? 365 : 30
    const computed = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000)
      .toISOString()
      .substring(0, 10)
    setRenewalDate(computed)
  }

  const handleStartDateChange = (nextStart: string) => {
    setStartDate(nextStart)
    if (nextStart) {
      const baseDate = new Date(`${nextStart}T12:00:00Z`)
      const days = billingCycle === 'ANNUAL' ? 365 : 30
      const computed = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000)
        .toISOString()
        .substring(0, 10)
      setRenewalDate(computed)
    }
  }

  const selectedPlan = plans.find((p) => p.id === planId)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!organizationId) {
      setError('Selecciona la organización o taller.')
      return
    }
    if (!planId) {
      setError('Selecciona el plan comercial a asignar.')
      return
    }

    const isoStart = startDate
      ? new Date(`${startDate}T00:00:00.000Z`).toISOString()
      : undefined
    const isoRenewal = renewalDate
      ? new Date(`${renewalDate}T23:59:59.000Z`).toISOString()
      : null

    await onSubmit({
      organizationId,
      planId,
      status,
      billingCycle,
      startsAt: isoStart,
      renewsAt: isoRenewal,
      notes: notes.trim() || null,
    })
  }

  const organizationOptions = organizations.map((org) => ({
    value: org.id,
    label: `${org.name} (${org.code})${!org.active ? ' · Inactivo' : ''}`,
  }))

  const planOptions = plans.map((plan) => ({
    value: plan.id,
    label: `${plan.name} (${plan.code}) — S/ ${billingCycle === 'ANNUAL' ? plan.priceYearly : plan.priceMonthly}`,
  }))

  return (
    <Modal
      open
      onClose={onClose}
      busy={busy}
      title="Asignar Nueva Membresía SaaS"
      description="Vincula o actualiza el plan comercial y la vigencia para un taller existente en la plataforma."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" disabled={busy} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="subscription-assign-form"
            disabled={busy || !organizationId || !planId}
            className="bg-brand-forest hover:bg-brand-forest/90"
          >
            Asignar Membresía
          </Button>
        </div>
      }
    >
      <form
        id="subscription-assign-form"
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4 text-xs"
      >
        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
            {error}
          </div>
        )}

        <div>
          <label className="block font-medium text-foreground">
            Organización / Taller Destino *
          </label>
          <SmartSelect
            value={organizationId}
            onChange={setOrganizationId}
            options={organizationOptions}
            placeholder="Selecciona el taller..."
            className="mt-1.5"
            aria-label="Seleccionar taller"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block font-medium text-foreground">
              Plan comercial *
            </label>
            <SmartSelect
              value={planId}
              onChange={setPlanId}
              options={planOptions}
              placeholder="Selecciona un plan..."
              className="mt-1.5"
              aria-label="Seleccionar plan comercial"
            />
          </div>

          <div>
            <label className="block font-medium text-foreground">
              Ciclo de facturación *
            </label>
            <SmartSelect
              value={billingCycle}
              onChange={(val) => handleCycleChange(val as BillingCycle)}
              options={billingCycleOptions}
              className="mt-1.5"
              aria-label="Ciclo de facturación"
            />
          </div>
        </div>

        {selectedPlan && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-xs text-emerald-950">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-900">
              <Crown className="size-4 text-brand-forest" />
              <span>
                {selectedPlan.name} · Tarifa:{' '}
                {billingCycle === 'ANNUAL'
                  ? `S/ ${selectedPlan.priceYearly} al año`
                  : `S/ ${selectedPlan.priceMonthly} al mes`}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-emerald-800">
              Límites: hasta {selectedPlan.maxMembers} miembros,{' '}
              {selectedPlan.maxTechnicians} técnicos y{' '}
              {selectedPlan.maxProducts} productos.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="block font-medium text-foreground">
              Estado de la membresía *
            </label>
            <SmartSelect
              value={status}
              onChange={(val) => setStatus(val as SubscriptionStatus)}
              options={statusOptions}
              className="mt-1.5"
              aria-label="Estado de membresía"
            />
          </div>

          <div>
            <label className="block font-medium text-foreground">
              Fecha de inicio *
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <label className="block font-medium text-foreground">
              Fecha de renovación / corte
            </label>
            <Input
              type="date"
              value={renewalDate}
              onChange={(e) => setRenewalDate(e.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>

        <div>
          <label className="block font-medium text-foreground">
            Notas de emisión o acuerdo comercial
          </label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej. Membresía anual pagada por transferencia. Válida hasta 2027."
            maxLength={500}
            className="mt-1.5"
          />
        </div>
      </form>
    </Modal>
  )
}
