import { useState } from 'react'
import { Bell, Info } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useProfileMutations } from '../hooks/use-profile'
import type {
  NotificationPreferences,
  ProfileData,
} from '../types/profile.types'

interface NotificationPreferencesFormProps {
  profile: ProfileData
}

interface PreferenceOption {
  key: keyof NotificationPreferences
  title: string
  description: string
}

const PREFERENCE_OPTIONS: PreferenceOption[] = [
  {
    key: 'stockLow',
    title: 'Alertas de stock bajo',
    description:
      'Avisos cuando un producto llega o cae por debajo de su stock mínimo.',
  },
  {
    key: 'purchaseReceived',
    title: 'Compras de proveedores recibidas',
    description:
      'Confirmación cuando el ingreso de mercadería a almacén es registrado.',
  },
  {
    key: 'appointmentUpdates',
    title: 'Citas y reprogramaciones',
    description:
      'Notificaciones sobre citas asignadas o cambios de horario para atención.',
  },
  {
    key: 'workOrderReady',
    title: 'Órdenes de trabajo listas para entrega',
    description:
      'Avisos cuando el vehículo finaliza servicio y está preparado para el cliente.',
  },
  {
    key: 'paymentCompensated',
    title: 'Pagos y compensaciones',
    description:
      'Registros de notas de crédito o compensaciones aplicadas en caja.',
  },
]

export function NotificationPreferencesForm({
  profile,
}: NotificationPreferencesFormProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    profile.notificationPreferences,
  )
  const mutations = useProfileMutations()

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const hasChanges = Object.keys(preferences).some(
    (k) =>
      preferences[k as keyof NotificationPreferences] !==
      profile.notificationPreferences[k as keyof NotificationPreferences],
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await mutations.updateProfile.mutateAsync({
        displayName: profile.displayName,
        notificationPreferences: preferences,
      })
      toast.success('Preferencias de notificación guardadas.')
    } catch {
      toast.error('No se pudieron guardar las preferencias.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-primary" />
            <h2 className="text-base font-semibold">
              Preferencias de notificaciones en la aplicación
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configura los avisos operativos que deseas recibir en tu panel.
          </p>
        </div>

        {/* Informational banner */}
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3.5 text-xs text-amber-900">
          <Info size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <span className="font-semibold">
              Avisos en la aplicación activos.
            </span>{' '}
            Los envíos por correo electrónico, WhatsApp o notificaciones push
            externas están desactivados en este sprint.
          </div>
        </div>

        <div className="divide-y rounded-lg border">
          {PREFERENCE_OPTIONS.map((opt) => {
            const enabled = preferences[opt.key]
            return (
              <div
                key={opt.key}
                className="flex items-center justify-between p-4 gap-4 hover:bg-muted/20 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor={`pref-${opt.key}`}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {opt.title}
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {opt.description}
                  </p>
                </div>
                <button
                  type="button"
                  id={`pref-${opt.key}`}
                  role="switch"
                  aria-checked={enabled}
                  onClick={() => handleToggle(opt.key)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-primary ${
                    enabled ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )
          })}
        </div>

        <div>
          <Button
            type="submit"
            disabled={mutations.updateProfile.isPending || !hasChanges}
            className="h-9 px-4 text-xs"
          >
            {mutations.updateProfile.isPending
              ? 'Guardando…'
              : 'Guardar preferencias'}
          </Button>
        </div>
      </div>
    </form>
  )
}
