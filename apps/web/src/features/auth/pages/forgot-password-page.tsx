import { ArrowLeft, CircleHelp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/router/constants/paths'

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
          Recuperación de acceso
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          La recuperación por correo no está habilitada en esta versión.
        </p>
      </header>
      <div className="rounded-xl border border-primary/15 bg-primary/[0.03] p-5">
        <CircleHelp aria-hidden className="size-6 text-primary" />
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Contacta al propietario del taller o al equipo responsable de Torcly
          para gestionar el restablecimiento de tu contraseña.
        </p>
      </div>
      <footer className="mt-6 border-t pt-5 2xl:mt-8 2xl:pt-6">
        <Link
          to={paths.login}
          className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Volver al inicio de sesión
        </Link>
      </footer>
    </section>
  )
}
