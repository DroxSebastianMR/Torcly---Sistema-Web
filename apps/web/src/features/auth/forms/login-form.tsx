import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  UserRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/router/constants/paths'
import { Button } from '@/components/ui/button'
import { AuthInput } from '@/features/auth/components/auth-input'
import { useLoginForm } from '@/features/auth/hooks/use-login-form'

export function LoginForm() {
  const {
    register,
    onSubmit,
    errors,
    isSubmitting,
    showPassword,
    togglePassword,
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
      <div className="flex justify-end">
        <Link
          className="rounded-sm text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          to={paths.forgotPassword}
        >
          ¿Olvidaste tu contraseña?
        </Link>
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
    </form>
  )
}
