import {
  ArrowRight,
  CircleHelp,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  UserRound,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { AuthInput } from '@/features/auth/components/auth-input'
import { useLoginForm } from '@/features/auth/hooks/use-login-form'

export function LoginForm() {
  const [accessHelpOpen, setAccessHelpOpen] = useState(false)
  const {
    register,
    onSubmit,
    errors,
    isSubmitting,
    showPassword,
    togglePassword,
    rememberIdentifier,
    setRememberIdentifier,
  } = useLoginForm()

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-busy={isSubmitting}
      className="space-y-5 2xl:space-y-6"
    >
      <AuthInput
        id="identifier"
        label="Usuario o correo electrónico"
        type="text"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="usuario o nombre@empresa.com"
        icon={UserRound}
        readOnly={isSubmitting}
        error={errors.identifier?.message}
        {...register('identifier')}
      />
      <AuthInput
        id="password"
        label="Contraseña"
        type={showPassword ? 'text' : 'password'}
        autoComplete="current-password"
        placeholder="Ingresa tu contraseña"
        icon={LockKeyhole}
        readOnly={isSubmitting}
        error={errors.password?.message}
        {...register('password')}
        endAdornment={
          <button
            type="button"
            onClick={togglePassword}
            aria-label={
              showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
            }
            aria-pressed={showPassword}
            aria-controls="password"
            className="flex size-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
          >
            {showPassword ? (
              <EyeOff aria-hidden="true" size={18} />
            ) : (
              <Eye aria-hidden="true" size={18} />
            )}
          </button>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground">
          <input
            type="checkbox"
            checked={rememberIdentifier}
            disabled={isSubmitting}
            onChange={(event) => setRememberIdentifier(event.target.checked)}
            className="size-4 cursor-pointer accent-primary disabled:cursor-not-allowed"
          />
          Recordar usuario
        </label>
        <button
          type="button"
          onClick={() => setAccessHelpOpen(true)}
          className="rounded-sm text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>
      <Button
        disabled={isSubmitting}
        className="h-12 w-full 2xl:h-13 rounded-xl text-sm shadow-sm"
        type="submit"
      >
        {isSubmitting ? (
          <LoaderCircle
            aria-hidden="true"
            className="size-4 motion-safe:animate-spin"
          />
        ) : null}
        {isSubmitting ? 'Iniciando sesión…' : 'Iniciar sesión'}
        {!isSubmitting && (
          <ArrowRight aria-hidden="true" className="ml-2 size-4" />
        )}
      </Button>
      <Modal
        open={accessHelpOpen}
        onClose={() => setAccessHelpOpen(false)}
        title="Recuperación de acceso"
        description="La recuperación por correo no está habilitada en esta versión."
        className="max-w-md"
        visual={
          <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
            <CircleHelp aria-hidden className="size-6" />
          </span>
        }
      >
        <p className="text-sm leading-6 text-muted-foreground">
          Contacta al propietario del taller o al equipo responsable de Torcly
          para que gestionen el restablecimiento de tu contraseña.
        </p>
      </Modal>
    </form>
  )
}
