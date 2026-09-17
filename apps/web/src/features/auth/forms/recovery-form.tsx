import { ArrowRight, LoaderCircle, MailCheck, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthInput } from '@/features/auth/components/auth-input'
import { useRecoveryForm } from '@/features/auth/hooks/use-recovery-form'

export function RecoveryForm() {
  const { register, onSubmit, errors, isSubmitting, isSent } = useRecoveryForm()

  if (isSent) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-xl border border-primary/15 bg-muted p-5"
      >
        <MailCheck
          aria-hidden="true"
          className="mb-4 size-7 text-primary"
          strokeWidth={1.5}
        />
        <h2 className="text-base font-semibold text-brand-forest">
          Revisa tu correo
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Si los datos corresponden a una cuenta, recibirás un enlace en el
          correo registrado para restablecer tu contraseña.
        </p>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Revisa también la carpeta de correo no deseado.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-busy={isSubmitting}
      className="space-y-5 2xl:space-y-6"
    >
      <div>
        <AuthInput
          id="recovery-identifier"
          label="Usuario o correo electrónico"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="Tu usuario o nombre@empresa.com"
          icon={UserRound}
          readOnly={isSubmitting}
          error={errors.identifier?.message}
          aria-describedby="recovery-help"
          {...register('identifier')}
        />
        <p
          id="recovery-help"
          className="mt-2 text-xs leading-5 text-muted-foreground"
        >
          Utiliza cualquiera de los datos asociados a tu cuenta.
        </p>
      </div>
      {errors.root?.server && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-5 text-red-700"
        >
          {errors.root.server.message}
        </p>
      )}
      <Button
        disabled={isSubmitting}
        className="h-12 w-full rounded-xl text-sm shadow-sm 2xl:h-13"
        type="submit"
      >
        {isSubmitting && (
          <LoaderCircle
            aria-hidden="true"
            className="size-4 motion-safe:animate-spin"
          />
        )}
        {isSubmitting ? 'Enviando solicitud…' : 'Enviar enlace de recuperación'}
        {!isSubmitting && (
          <ArrowRight aria-hidden="true" className="ml-2 size-4" />
        )}
      </Button>
    </form>
  )
}
