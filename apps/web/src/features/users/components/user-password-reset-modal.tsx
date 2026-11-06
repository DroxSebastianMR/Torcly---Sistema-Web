import { useState } from 'react'
import { Check, Copy, KeyRound, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { useUserMutations } from '../hooks/use-users'
import type { User } from '../types/users.types'
import { getUsersErrorMessage } from '../utils/user-formatters'

interface UserPasswordResetModalProps {
  open: boolean
  user: User | null
  onClose: () => void
}

export function UserPasswordResetModal({
  open,
  user,
  onClose,
}: UserPasswordResetModalProps) {
  const mutations = useUserMutations()
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(
    null,
  )
  const [copied, setCopied] = useState(false)

  if (!user) return null

  const handleClose = () => {
    setTemporaryPassword(null)
    setCopied(false)
    onClose()
  }

  const handleGenerate = async () => {
    try {
      const response = await mutations.resetPassword.mutateAsync(user.id)
      setTemporaryPassword(response.data.temporaryPassword)
      toast.success('Contraseña temporal generada con éxito.')
    } catch (error) {
      toast.error(getUsersErrorMessage(error))
    }
  }

  const handleCopy = async () => {
    if (!temporaryPassword) return
    try {
      await navigator.clipboard.writeText(temporaryPassword)
      setCopied(true)
      toast.success('Contraseña copiada al portapapeles.')
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error(
        'No se pudo copiar automáticamente. Por favor selecciónala y cópiala manualmente.',
      )
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Restablecer contraseña"
      description={`Genera una contraseña temporal para que ${user.displayName} recupere el acceso a su cuenta.`}
      className="max-w-md"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={handleClose}>
            {temporaryPassword ? 'Entendido / Cerrar' : 'Cancelar'}
          </Button>
          {!temporaryPassword && (
            <Button
              type="button"
              disabled={mutations.resetPassword.isPending}
              onClick={() => void handleGenerate()}
            >
              <KeyRound aria-hidden size={16} />
              {mutations.resetPassword.isPending
                ? 'Generando…'
                : 'Generar contraseña temporal'}
            </Button>
          )}
        </div>
      }
    >
      <div className="mb-4 rounded-xl bg-muted/70 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Usuario a restablecer
        </p>
        <p className="mt-1 font-semibold text-brand-forest">
          {user.displayName}
        </p>
        <p className="text-xs text-muted-foreground">
          @{user.username} · {user.email}
        </p>
      </div>

      {!temporaryPassword ? (
        <div className="space-y-3 rounded-xl border border-amber-200/60 bg-amber-50/50 p-4 text-xs leading-relaxed text-amber-900">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldAlert size={16} className="text-amber-600" />
            <span>Consecuencias de esta acción:</span>
          </div>
          <ul className="list-inside list-disc space-y-1 text-muted-foreground">
            <li>Se cerrarán todas las sesiones activas del usuario.</li>
            <li>Se generará una contraseña temporal de un solo uso.</li>
            <li>
              Al iniciar sesión con esta clave, el sistema le{' '}
              <strong className="text-foreground">
                exigirá definir una nueva contraseña personal
              </strong>{' '}
              de inmediato.
            </li>
          </ul>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Contraseña temporal generada
            </p>
            <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-emerald-300 bg-white p-2.5">
              <code className="select-all font-mono text-base font-bold tracking-wider text-brand-forest">
                {temporaryPassword}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleCopy()}
                className="shrink-0 gap-1.5"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-emerald-600" />
                    <span>Copiada</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copiar</span>
                  </>
                )}
              </Button>
            </div>
            <p className="mt-3 text-xs leading-5 text-emerald-900">
              Comparte esta clave con el usuario por un canal seguro (WhatsApp,
              llamada o en persona). Por seguridad,{' '}
              <strong>no volverá a mostrarse</strong> una vez cerrada esta
              ventana.
            </p>
          </div>
        </div>
      )}
    </Modal>
  )
}
