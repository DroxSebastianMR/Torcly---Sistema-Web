import { LoginForm } from '@/features/auth/forms/login-form'

export function LoginPage() {
  return (
    <section aria-labelledby="login-title">
      <header className="mb-8">
        <p className="mb-5 flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          <span aria-hidden="true" className="h-px w-6 bg-primary" />
          Acceso a la plataforma
        </p>
        <h1
          id="login-title"
          className="font-heading text-[clamp(2rem,2.8vw,2.7rem)] leading-none font-semibold tracking-[-0.045em] text-brand-forest"
        >
          Bienvenido a Torcly
        </h1>
        <p className="mt-5 text-[15px] leading-6 text-muted-foreground">
          Ingresa tus credenciales para acceder a tu taller.
        </p>
      </header>
      <LoginForm />
      <footer className="mt-7 border-t pt-6">
        <p className="text-xs leading-5 text-muted-foreground">
          ¿Necesitas ayuda? Contacta al administrador de tu empresa.
        </p>
      </footer>
    </section>
  )
}
