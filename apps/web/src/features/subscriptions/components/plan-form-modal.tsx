import { useState } from 'react'
import { Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import type {
  CreatePlanInput,
  Plan,
  UpdatePlanInput,
} from '../types/subscriptions.types'

interface PlanFormModalProps {
  open: boolean
  plan: Plan | null
  busy: boolean
  onClose: () => void
  onSubmitCreate: (input: CreatePlanInput) => Promise<void>
  onSubmitUpdate: (planId: string, input: UpdatePlanInput) => Promise<void>
}

export function PlanFormModal({
  open,
  plan,
  busy,
  onClose,
  onSubmitCreate,
  onSubmitUpdate,
}: PlanFormModalProps) {
  if (!open) return null

  return (
    <PlanForm
      key={plan?.id ?? 'new-plan'}
      plan={plan}
      busy={busy}
      onClose={onClose}
      onSubmitCreate={onSubmitCreate}
      onSubmitUpdate={onSubmitUpdate}
    />
  )
}

function PlanForm({
  plan,
  busy,
  onClose,
  onSubmitCreate,
  onSubmitUpdate,
}: {
  plan: Plan | null
  busy: boolean
  onClose: () => void
  onSubmitCreate: (input: CreatePlanInput) => Promise<void>
  onSubmitUpdate: (planId: string, input: UpdatePlanInput) => Promise<void>
}) {
  const isEditing = Boolean(plan)

  const [code, setCode] = useState(plan?.code ?? '')
  const [name, setName] = useState(plan?.name ?? '')
  const [description, setDescription] = useState(plan?.description ?? '')
  const [priceMonthly, setPriceMonthly] = useState(
    plan?.priceMonthly !== undefined ? String(plan.priceMonthly) : '99',
  )
  const [priceYearly, setPriceYearly] = useState(
    plan?.priceYearly !== undefined ? String(plan.priceYearly) : '990',
  )
  const [maxMembers, setMaxMembers] = useState(
    plan?.maxMembers !== undefined ? String(plan.maxMembers) : '5',
  )
  const [maxTechnicians, setMaxTechnicians] = useState(
    plan?.maxTechnicians !== undefined ? String(plan.maxTechnicians) : '10',
  )
  const [maxProducts, setMaxProducts] = useState(
    plan?.maxProducts !== undefined ? String(plan.maxProducts) : '1000',
  )
  const [featuresText, setFeaturesText] = useState(
    plan?.features ? plan.features.join('\n') : '',
  )
  const [active, setActive] = useState(plan?.active ?? true)
  const [isPublic, setIsPublic] = useState(plan?.isPublic ?? true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!name.trim() || name.trim().length < 3) {
      errs.name = 'El nombre del plan debe tener al menos 3 caracteres.'
    }
    if (!isEditing) {
      if (!code.trim() || !/^[A-Z0-9_-]+$/.test(code.trim().toUpperCase())) {
        errs.code =
          'Usa solo mayúsculas, números o guiones (ej. STARTER, PRO, ENTERPRISE).'
      }
    }
    if (Number(priceMonthly) < 0 || isNaN(Number(priceMonthly))) {
      errs.priceMonthly = 'El precio mensual no puede ser negativo.'
    }
    if (Number(priceYearly) < 0 || isNaN(Number(priceYearly))) {
      errs.priceYearly = 'El precio anual no puede ser negativo.'
    }
    if (Number(maxMembers) < 1 || isNaN(Number(maxMembers))) {
      errs.maxMembers = 'Debe permitir al menos 1 miembro.'
    }
    if (Number(maxTechnicians) < 1 || isNaN(Number(maxTechnicians))) {
      errs.maxTechnicians = 'Debe permitir al menos 1 mecánico o técnico.'
    }
    if (Number(maxProducts) < 1 || isNaN(Number(maxProducts))) {
      errs.maxProducts = 'Debe permitir al menos 1 producto en catálogo.'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) return

    const parsedFeatures = featuresText
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean)

    if (isEditing && plan) {
      await onSubmitUpdate(plan.id, {
        name: name.trim(),
        description: description.trim() || null,
        priceMonthly: Number(priceMonthly),
        priceYearly: Number(priceYearly),
        maxMembers: Number(maxMembers),
        maxTechnicians: Number(maxTechnicians),
        maxProducts: Number(maxProducts),
        features: parsedFeatures,
        active,
        isPublic,
      })
    } else {
      await onSubmitCreate({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim() || null,
        priceMonthly: Number(priceMonthly),
        priceYearly: Number(priceYearly),
        currency: 'PEN',
        maxMembers: Number(maxMembers),
        maxTechnicians: Number(maxTechnicians),
        maxProducts: Number(maxProducts),
        features: parsedFeatures,
        active,
        isPublic,
      })
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      busy={busy}
      visual={
        <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <Layers aria-hidden className="size-6" />
        </span>
      }
      title={
        isEditing ? `Editar plan: ${plan?.name}` : 'Crear nuevo plan comercial'
      }
      description="Define las cuotas operativas de miembros, técnicos, catálogo y tarifas comerciales para este plan."
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
          <Button type="submit" form="plan-form" disabled={busy}>
            {busy ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear plan'}
          </Button>
        </div>
      }
    >
      <form
        id="plan-form"
        onSubmit={(e) => void handleSubmit(e)}
        noValidate
        className="space-y-5"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Código comercial (ID)"
            error={errors.code}
            hint={
              isEditing
                ? 'No editable una vez creado'
                : 'Ej. STARTER, PRO, ENTERPRISE'
            }
            required
          >
            <Input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase())
                setErrors((prev) => ({ ...prev, code: '' }))
              }}
              disabled={isEditing}
              invalid={Boolean(errors.code)}
              placeholder="Ej. STARTER, PRO, ENTERPRISE"
              className="font-mono"
            />
          </Field>

          <Field
            label="Nombre visible del plan"
            error={errors.name}
            required
            hint="Nombre con el que se mostrará en los talleres"
          >
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setErrors((prev) => ({ ...prev, name: '' }))
              }}
              invalid={Boolean(errors.name)}
              placeholder="Ej. Plan Profesional"
            />
          </Field>
        </div>

        <Field
          label="Descripción comercial"
          hint="Breve resumen del tipo de taller al que va dirigido"
        >
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Orientado a talleres medianos con recepción y equipo técnico"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Precio mensual (S/)"
            error={errors.priceMonthly}
            required
            hint="Tarifa por mes de servicio"
          >
            <Input
              type="number"
              step="0.01"
              min="0"
              value={priceMonthly}
              onChange={(e) => {
                setPriceMonthly(e.target.value)
                setErrors((prev) => ({ ...prev, priceMonthly: '' }))
              }}
              invalid={Boolean(errors.priceMonthly)}
            />
          </Field>

          <Field
            label="Precio anual (S/)"
            error={errors.priceYearly}
            required
            hint="Tarifa con descuento anual"
          >
            <Input
              type="number"
              step="0.01"
              min="0"
              value={priceYearly}
              onChange={(e) => {
                setPriceYearly(e.target.value)
                setErrors((prev) => ({ ...prev, priceYearly: '' }))
              }}
              invalid={Boolean(errors.priceYearly)}
            />
          </Field>
        </div>

        <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              Cuotas máximas del servidor
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field
              label="Max miembros"
              error={errors.maxMembers}
              required
              hint="Usuarios en taller"
            >
              <Input
                type="number"
                min="1"
                value={maxMembers}
                onChange={(e) => {
                  setMaxMembers(e.target.value)
                  setErrors((prev) => ({ ...prev, maxMembers: '' }))
                }}
                invalid={Boolean(errors.maxMembers)}
              />
            </Field>

            <Field
              label="Max mecánicos / técnicos"
              error={errors.maxTechnicians}
              required
              hint="Mecánicos activos"
            >
              <Input
                type="number"
                min="1"
                value={maxTechnicians}
                onChange={(e) => {
                  setMaxTechnicians(e.target.value)
                  setErrors((prev) => ({ ...prev, maxTechnicians: '' }))
                }}
                invalid={Boolean(errors.maxTechnicians)}
              />
            </Field>

            <Field
              label="Max productos"
              error={errors.maxProducts}
              required
              hint="Artículos catálogo"
            >
              <Input
                type="number"
                min="1"
                value={maxProducts}
                onChange={(e) => {
                  setMaxProducts(e.target.value)
                  setErrors((prev) => ({ ...prev, maxProducts: '' }))
                }}
                invalid={Boolean(errors.maxProducts)}
              />
            </Field>
          </div>
        </div>

        <Field
          label="Beneficios y funcionalidades incluidas"
          hint="Ingresa un beneficio por cada línea"
        >
          <textarea
            value={featuresText}
            onChange={(e) => setFeaturesText(e.target.value)}
            rows={3}
            placeholder="Hasta 10 miembros en taller&#10;Asistente IA conversacional&#10;Múltiples sesiones de caja"
            className="flex w-full rounded-[10px] border border-input bg-card px-3 py-2.5 text-sm transition-[border-color,background-color] duration-150 ease-out hover:bg-background focus:border-primary/70 focus:outline-none"
          />
        </Field>

        <div className="flex flex-wrap items-center gap-6 pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-foreground">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="size-4 rounded border-border text-primary accent-primary focus:ring-primary"
            />
            <span>Plan activo para asignación</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-foreground">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="size-4 rounded border-border text-primary accent-primary focus:ring-primary"
            />
            <span>Visible públicamente</span>
          </label>
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
