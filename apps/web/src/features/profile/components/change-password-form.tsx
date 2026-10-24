import { useState } from 'react'
import { Eye, EyeOff, KeyRound, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useProfileMutations } from '../hooks/use-profile'

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const mutations = useProfileMutations()

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!currentPassword) {
      newErrors.currentPassword = 'Ingresa tu contraseña actual.'
    }
    if (!newPassword) {
      newErrors.newPassword = 'Ingresa una nueva contraseña.'
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'La contraseña debe tener al menos 8 caracteres.'
    }
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden.'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      await mutations.changePassword.mutateAsync({
        currentPassword,
        newPassword,
      })
      toast.success('Contraseña cambiada exitosamente.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setErrors({})
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const resp = (err as { response?: { data?: { message?: string } } })
          .response
        if (resp?.data?.message) {
          setErrors({ form: resp.data.message })
          toast.error(resp.data.message)
          return
        }
      }
      setErrors({
        form: 'La contraseña actual no es correcta o ocurrió un error.',
      })
      toast.error('La contraseña actual no es correcta.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <KeyRound size={18} className="text-primary" />
            <h2 className="text-base font-semibold">Seguridad de la cuenta</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cambia tu contraseña periódicamente para proteger tu acceso.
          </p>
        </div>

        {errors.form && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {errors.form}
          </div>
        )}

        <div className="space-y-4 max-w-md">
          {/* Contraseña actual */}
          <div className="space-y-1.5">
            <label
              htmlFor="current-password"
              className="text-xs font-semibold text-foreground"
            >
              Contraseña actual
            </label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value)
                  if (errors.currentPassword || errors.form) {
                    setErrors((prev) => {
                      const next = { ...prev }
                      delete next.currentPassword
                      delete next.form
                      return next
                    })
                  }
                }}
                placeholder="••••••••"
                className="pr-10"
                aria-invalid={Boolean(errors.currentPassword)}
                aria-describedby={
                  errors.currentPassword ? 'curr-pwd-error' : undefined
                }
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={
                  showCurrent ? 'Ocultar contraseña' : 'Ver contraseña'
                }
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.currentPassword && (
              <p
                id="curr-pwd-error"
                className="text-xs text-red-500 font-medium"
              >
                {errors.currentPassword}
              </p>
            )}
          </div>

          {/* Nueva contraseña */}
          <div className="space-y-1.5">
            <label
              htmlFor="new-password"
              className="text-xs font-semibold text-foreground"
            >
              Nueva contraseña
            </label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  if (errors.newPassword) {
                    setErrors((prev) => {
                      const next = { ...prev }
                      delete next.newPassword
                      return next
                    })
                  }
                }}
                placeholder="Mínimo 8 caracteres"
                className="pr-10"
                aria-invalid={Boolean(errors.newPassword)}
                aria-describedby={
                  errors.newPassword ? 'new-pwd-error' : undefined
                }
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showNew ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.newPassword && (
              <p
                id="new-pwd-error"
                className="text-xs text-red-500 font-medium"
              >
                {errors.newPassword}
              </p>
            )}
          </div>

          {/* Confirmar nueva contraseña */}
          <div className="space-y-1.5">
            <label
              htmlFor="confirm-password"
              className="text-xs font-semibold text-foreground"
            >
              Confirmar nueva contraseña
            </label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (errors.confirmPassword) {
                  setErrors((prev) => {
                    const next = { ...prev }
                    delete next.confirmPassword
                    return next
                  })
                }
              }}
              placeholder="Repite la nueva contraseña"
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={
                errors.confirmPassword ? 'conf-pwd-error' : undefined
              }
            />
            {errors.confirmPassword && (
              <p
                id="conf-pwd-error"
                className="text-xs text-red-500 font-medium"
              >
                {errors.confirmPassword}
              </p>
            )}
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={
              mutations.changePassword.isPending ||
              !currentPassword ||
              !newPassword
            }
            className="h-9 px-4 text-xs"
          >
            <Lock size={14} className="mr-1.5" />
            {mutations.changePassword.isPending
              ? 'Actualizando contraseña…'
              : 'Actualizar contraseña'}
          </Button>
        </div>
      </div>
    </form>
  )
}
