import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/router/constants/paths'
import { RecoveryForm } from '@/features/auth/forms/recovery-form'

export function ForgotPasswordPage() {
  return (
    <section aria-labelledby="recovery-title">
      <header className="mb-7 2xl:mb-9">
        <p className="mb-4 flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          <span aria-hidden="true" className="h-px w-6 bg-primary" />
          Recuperación de acceso
        </p>
        <h1
          id="recovery-title"
          className="text-[clamp(1.75rem,2.2vw,2.25rem)] leading-tight font-semibold tracking-[-0.035em] text-brand-forest"
        >
          ¿Olvidaste tu contraseña?
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Ingresa tu usuario, correo personal o correo empresarial asociado a tu
          cuenta.
        </p>
      </header>
      <RecoveryForm />
      <footer className="mt-6 border-t pt-5 2xl:mt-8 2xl:pt-6">
        <Link
          to={paths.login}
          className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Volver al inicio de sesión
        </Link>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Si ya no tienes acceso al correo registrado, contacta al administrador
          de tu empresa.
        </p>
      </footer>
    </section>
  )
}
