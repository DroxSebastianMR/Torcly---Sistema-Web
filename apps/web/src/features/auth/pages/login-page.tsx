import { LoginForm } from '@/features/auth/forms/login-form'

export function LoginPage() {
  return (
    <section aria-labelledby="login-title">
      <header className="mb-7 2xl:mb-9">
        <p className="mb-4 flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          <span aria-hidden="true" className="h-px w-6 bg-primary" />
          Acceso a la plataforma
        </p>
        <h1
          id="login-title"
          className="text-[clamp(1.75rem,2.2vw,2.25rem)] leading-tight font-semibold tracking-[-0.035em] text-brand-forest"
        >
          Bienvenido a Torcly
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Ingresa tus credenciales para acceder al espacio de trabajo de tu
          empresa.
        </p>
      </header>
      <LoginForm />
      <footer className="mt-6 border-t pt-5 2xl:mt-8 2xl:pt-6">
        <p className="text-xs leading-5 text-muted-foreground">
          ¿Necesitas una cuenta? Contacta al administrador de tu empresa.
        </p>
      </footer>
    </section>
  )
}
