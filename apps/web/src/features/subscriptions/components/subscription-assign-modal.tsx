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
  const [errors, setErrors] = useState<Record<string, string>>({})

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
    const errs: Record<string, string> = {}
    if (!organizationId) {
      errs.organizationId = 'Selecciona la organización o taller.'
    }
    if (!planId) {
      errs.planId = 'Selecciona el plan comercial a asignar.'
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
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
      visual={
        <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <Crown aria-hidden className="size-6" />
        </span>
      }
      title="Asignar nueva membresía SaaS"
      description="Vincula o actualiza el plan comercial y la vigencia para un taller existente en la plataforma."
      className="max-w-3xl sm:max-w-3xl"
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
          <Button
            type="submit"
            form="subscription-assign-form"
            disabled={busy || !organizationId || !planId}
          >
            {busy ? 'Asignando…' : 'Asignar membresía'}
          </Button>
        </div>
      }
    >
      <form
        id="subscription-assign-form"
        onSubmit={(e) => void handleSubmit(e)}
        noValidate
        className="space-y-5"
      >
        <Field
          label="Organización o taller destino"
          error={errors.organizationId}
          required
        >
          <SmartSelect
            value={organizationId}
            onChange={(val) => {
              setOrganizationId(val)
              setErrors((prev) => ({ ...prev, organizationId: '' }))
            }}
            options={organizationOptions}
            placeholder="Selecciona el taller..."
            aria-label="Seleccionar taller"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Plan comercial" error={errors.planId} required>
            <SmartSelect
              value={planId}
              onChange={(val) => {
                setPlanId(val)
                setErrors((prev) => ({ ...prev, planId: '' }))
              }}
              options={planOptions}
              placeholder="Selecciona un plan..."
              aria-label="Seleccionar plan comercial"
            />
          </Field>

          <Field label="Ciclo de facturación" required>
            <SmartSelect
              value={billingCycle}
              onChange={(val) => handleCycleChange(val as BillingCycle)}
              options={billingCycleOptions}
              aria-label="Ciclo de facturación"
            />
          </Field>
        </div>

        {selectedPlan && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-xs text-emerald-950">
            <div className="flex items-center gap-2 font-semibold text-emerald-900 text-sm">
              <Crown className="size-4 text-primary" />
              <span>
                {selectedPlan.name} · Tarifa:{' '}
                {billingCycle === 'ANNUAL'
                  ? `S/ ${selectedPlan.priceYearly} al año`
                  : `S/ ${selectedPlan.priceMonthly} al mes`}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-emerald-800">
              Límites técnicos: hasta {selectedPlan.maxMembers} miembros,{' '}
              {selectedPlan.maxTechnicians} técnicos y{' '}
              {selectedPlan.maxProducts} productos en catálogo.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Estado inicial" required>
            <SmartSelect
              value={status}
              onChange={(val) => setStatus(val as SubscriptionStatus)}
              options={statusOptions}
              aria-label="Estado de membresía"
            />
          </Field>

          <Field
            label="Observaciones o notas comerciales"
            hint="Opcional. Queda en el historial."
          >
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Membresía anual pagada por transferencia."
              maxLength={500}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Fecha de inicio" required>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
            />
          </Field>

          <Field
            label="Fecha de corte / renovación"
            hint={
              billingCycle === 'ANNUAL'
                ? '+1 año automático'
                : '+30 días automático'
            }
          >
            <Input
              type="date"
              value={renewalDate}
              onChange={(e) => setRenewalDate(e.target.value)}
            />
          </Field>
        </div>
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
