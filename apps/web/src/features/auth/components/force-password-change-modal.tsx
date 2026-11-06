import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, Lock, LogOut, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useAuth } from '../hooks/auth-context'
import type { User } from '../types/auth.types'
import { profileService } from '@/features/profile/services/profile.service'

export function ForcePasswordChangeModal() {
  const { user, logout } = useAuth()
  const queryClient = useQueryClient()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!user?.mustChangePassword) {
    return null
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!currentPassword) {
      nextErrors.currentPassword = 'Ingresa la contraseña temporal recibida.'
    }
    if (!newPassword) {
      nextErrors.newPassword = 'Ingresa tu nueva contraseña personal.'
    } else if (newPassword.length < 8) {
      nextErrors.newPassword = 'La contraseña debe tener al menos 8 caracteres.'
    }
    if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = 'Las contraseñas no coinciden.'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      await profileService.changePassword({
        currentPassword,
        newPassword,
      })
      toast.success('Contraseña actualizada con éxito.')
      queryClient.setQueryData<User | null>(['auth', 'session'], (prev) =>
        prev ? { ...prev, mustChangePassword: false } : null,
      )
      await queryClient.invalidateQueries({ queryKey: ['auth', 'session'] })
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
        form: 'La contraseña temporal ingresada no es correcta o expiró.',
      })
      toast.error('La contraseña temporal no es correcta.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <Modal
      open
      preventClose
      title="Actualización obligatoria de contraseña"
      description="Has ingresado con una contraseña temporal generada por un administrador. Por seguridad, debes definir tu nueva contraseña personal antes de continuar."
      className="max-w-lg"
      visual={
        <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
          <ShieldAlert size={26} />
        </div>
      }
      footer={
        <div className="flex flex-col-reverse items-stretch justify-between gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="ghost"
            disabled={submitting || loggingOut}
            onClick={() => void handleLogout()}
            className="text-muted-foreground hover:text-destructive"
          >
            <LogOut size={15} />
            <span>{loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}</span>
          </Button>
          <Button
            type="submit"
            form="force-password-change-form"
            disabled={submitting || loggingOut}
          >
            <Lock size={15} />
            <span>
              {submitting
                ? 'Guardando contraseña…'
                : 'Guardar nueva contraseña'}
            </span>
          </Button>
        </div>
      }
      onClose={() => {}}
    >
      <form
        id="force-password-change-form"
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4"
        noValidate
      >
        {errors.form && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
            {errors.form}
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-foreground">
            Contraseña temporal actual *
          </label>
          <div className="relative mt-1.5">
            <Input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value)
                if (errors.currentPassword) {
                  setErrors((prev) => ({ ...prev, currentPassword: '' }))
                }
              }}
              placeholder="Pega aquí la clave temporal recibida"
              className="pr-10"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showCurrent ? 'Ocultar' : 'Mostrar'}
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="mt-1 text-xs text-destructive">
              {errors.currentPassword}
            </p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground">
            Nueva contraseña personal *
          </label>
          <div className="relative mt-1.5">
            <Input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value)
                if (errors.newPassword) {
                  setErrors((prev) => ({ ...prev, newPassword: '' }))
                }
              }}
              placeholder="Mínimo 8 caracteres"
              className="pr-10"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showNew ? 'Ocultar' : 'Mostrar'}
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="mt-1 text-xs text-destructive">
              {errors.newPassword}
            </p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground">
            Confirmar nueva contraseña *
          </label>
          <div className="mt-1.5">
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (errors.confirmPassword) {
                  setErrors((prev) => ({ ...prev, confirmPassword: '' }))
                }
              }}
              placeholder="Vuelve a escribir tu nueva contraseña"
              autoComplete="new-password"
              required
            />
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-destructive">
              {errors.confirmPassword}
            </p>
          )}
        </div>
      </form>
    </Modal>
  )
}
