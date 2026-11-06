import { useState } from 'react'
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
      errs.name = 'El nombre debe tener al menos 3 caracteres.'
    }
    if (!isEditing) {
      if (!code.trim() || !/^[A-Z0-9_-]+$/.test(code.trim().toUpperCase())) {
        errs.code = 'Usa mayúsculas, números o guiones (ej. STARTER, PRO_PLUS).'
      }
    }
    if (Number(priceMonthly) < 0) {
      errs.priceMonthly = 'El precio mensual no puede ser negativo.'
    }
    if (Number(priceYearly) < 0) {
      errs.priceYearly = 'El precio anual no puede ser negativo.'
    }
    if (Number(maxMembers) < 1) {
      errs.maxMembers = 'Debe permitir al menos 1 miembro.'
    }
    if (Number(maxTechnicians) < 1) {
      errs.maxTechnicians = 'Debe permitir al menos 1 técnico.'
    }
    if (Number(maxProducts) < 1) {
      errs.maxProducts = 'Debe permitir al menos 1 producto.'
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
      title={
        isEditing ? `Editar Plan: ${plan?.name}` : 'Crear Nuevo Plan Comercial'
      }
      description="Define las cuotas de miembros, mecánicos, inventario y tarifas comerciales para este plan."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" disabled={busy} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="plan-form"
            disabled={busy}
            className="bg-brand-forest hover:bg-brand-forest/90"
          >
            {isEditing ? 'Guardar Cambios' : 'Crear Plan'}
          </Button>
        </div>
      }
    >
      <form
        id="plan-form"
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4 text-xs"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block font-medium text-foreground">
              Código comercial (ID) *
            </label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={isEditing}
              placeholder="Ej. STARTER, PRO, ENTERPRISE"
              className="mt-1.5 font-mono"
            />
            {errors.code && (
              <span className="mt-1 block text-[11px] text-destructive">
                {errors.code}
              </span>
            )}
          </div>

          <div>
            <label className="block font-medium text-foreground">
              Nombre visible del plan *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Plan Profesional"
              className="mt-1.5"
            />
            {errors.name && (
              <span className="mt-1 block text-[11px] text-destructive">
                {errors.name}
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="block font-medium text-foreground">
            Descripción comercial
          </label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breve resumen del tipo de taller al que va dirigido este plan"
            className="mt-1.5"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-foreground">
              Precio Mensual (S/) *
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={priceMonthly}
              onChange={(e) => setPriceMonthly(e.target.value)}
              className="mt-1.5"
            />
            {errors.priceMonthly && (
              <span className="mt-1 block text-[11px] text-destructive">
                {errors.priceMonthly}
              </span>
            )}
          </div>

          <div>
            <label className="block font-medium text-foreground">
              Precio Anual (S/) *
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={priceYearly}
              onChange={(e) => setPriceYearly(e.target.value)}
              className="mt-1.5"
            />
            {errors.priceYearly && (
              <span className="mt-1 block text-[11px] text-destructive">
                {errors.priceYearly}
              </span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-3">
          <span className="block font-semibold text-foreground">
            Cuotas Máximas del Servidor (Límites)
          </span>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground">
                Max Miembros *
              </label>
              <Input
                type="number"
                min="1"
                value={maxMembers}
                onChange={(e) => setMaxMembers(e.target.value)}
                className="mt-1"
              />
              {errors.maxMembers && (
                <span className="mt-1 block text-[10px] text-destructive">
                  {errors.maxMembers}
                </span>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-muted-foreground">
                Max Técnicos *
              </label>
              <Input
                type="number"
                min="1"
                value={maxTechnicians}
                onChange={(e) => setMaxTechnicians(e.target.value)}
                className="mt-1"
              />
              {errors.maxTechnicians && (
                <span className="mt-1 block text-[10px] text-destructive">
                  {errors.maxTechnicians}
                </span>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-muted-foreground">
                Max Productos *
              </label>
              <Input
                type="number"
                min="1"
                value={maxProducts}
                onChange={(e) => setMaxProducts(e.target.value)}
                className="mt-1"
              />
              {errors.maxProducts && (
                <span className="mt-1 block text-[10px] text-destructive">
                  {errors.maxProducts}
                </span>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block font-medium text-foreground">
            Beneficios y funcionalidades incluidas (un beneficio por línea)
          </label>
          <textarea
            value={featuresText}
            onChange={(e) => setFeaturesText(e.target.value)}
            rows={3}
            placeholder="Hasta 10 miembros en taller&#10;Asistente IA conversacional&#10;Múltiples sesiones de caja"
            className="mt-1.5 w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <div className="flex items-center gap-6 pt-1">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="size-4 rounded border-gray-300 text-brand-forest focus:ring-brand-forest"
            />
            Plan activo para asignación
          </label>

          <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="size-4 rounded border-gray-300 text-brand-forest focus:ring-brand-forest"
            />
            Visible públicamente
          </label>
        </div>
      </form>
    </Modal>
  )
}
