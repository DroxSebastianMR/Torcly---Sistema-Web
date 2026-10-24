import { useState } from 'react'
import { Check, Shield, User } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useProfileMutations } from '../hooks/use-profile'
import type { ProfileData } from '../types/profile.types'

interface ProfileInfoFormProps {
  profile: ProfileData
}

export function ProfileInfoForm({ profile }: ProfileInfoFormProps) {
  const [displayName, setDisplayName] = useState(profile.displayName)
  const [error, setError] = useState<string | null>(null)
  const mutations = useProfileMutations()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = displayName.trim()
    if (trimmed.length < 2) {
      setError('El nombre debe tener al menos 2 caracteres.')
      return
    }
    if (trimmed.length > 120) {
      setError('El nombre no puede exceder 120 caracteres.')
      return
    }
    setError(null)

    try {
      await mutations.updateProfile.mutateAsync({
        displayName: trimmed,
      })
      toast.success('Perfil actualizado correctamente.')
    } catch {
      toast.error('No se pudo actualizar el perfil. Intenta de nuevo.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-semibold">Información personal</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Actualiza tu nombre visible en la plataforma.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <label
              htmlFor="profile-display-name"
              className="text-xs font-semibold text-foreground"
            >
              Nombre visible
            </label>
            <Input
              id="profile-display-name"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value)
                if (error) setError(null)
              }}
              placeholder="Tu nombre completo o de atención"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'display-name-error' : undefined}
            />
            {error && (
              <p
                id="display-name-error"
                className="text-xs text-red-500 font-medium"
              >
                {error}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="profile-username"
              className="text-xs font-semibold text-muted-foreground"
            >
              Nombre de usuario
            </label>
            <Input
              id="profile-username"
              value={profile.username}
              disabled
              className="bg-muted/50 text-muted-foreground cursor-not-allowed"
            />
            <p className="text-[11px] text-muted-foreground">
              Identificador único de inicio de sesión.
            </p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="profile-email"
              className="text-xs font-semibold text-muted-foreground"
            >
              Correo electrónico
            </label>
            <Input
              id="profile-email"
              value={profile.email}
              disabled
              className="bg-muted/50 text-muted-foreground cursor-not-allowed"
            />
            <p className="text-[11px] text-muted-foreground">
              Utilizado para recuperación de cuenta.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={
              mutations.updateProfile.isPending ||
              displayName.trim() === profile.displayName
            }
            className="h-9 px-4 text-xs"
          >
            {mutations.updateProfile.isPending
              ? 'Guardando…'
              : 'Guardar cambios'}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-primary" />
          <h2 className="text-base font-semibold">
            Roles y permisos asignados
          </h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Los permisos de tu cuenta son administrados por el equipo de seguridad
          o administrador.
        </p>

        <div className="space-y-3 pt-1">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Roles activos
            </span>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {profile.roles.map((role) => (
                <span
                  key={role.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                >
                  <User size={12} />
                  {role.name} ({role.code})
                </span>
              ))}
              {!profile.roles.length && (
                <span className="text-xs text-muted-foreground">
                  Sin roles asignados
                </span>
              )}
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Permisos habilitados ({profile.permissions.length})
            </span>
            <div className="mt-2 flex flex-wrap gap-1.5 max-h-36 overflow-y-auto rounded-lg border bg-muted/20 p-2.5">
              {profile.permissions.map((perm) => (
                <span
                  key={perm}
                  className="inline-flex items-center gap-1 rounded bg-background px-2 py-0.5 font-mono text-[11px] border text-muted-foreground"
                >
                  <Check size={10} className="text-emerald-500" />
                  {perm}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
