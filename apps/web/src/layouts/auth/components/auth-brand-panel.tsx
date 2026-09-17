import { TorclyLogo } from '@/components/brand/torcly-logo'

export function AuthBrandPanel() {
  return (
    <aside
      aria-label="Torcly, gestión empresarial"
      className="relative isolate hidden overflow-hidden bg-brand-forest text-white lg:flex lg:flex-col"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_90%_30%,rgba(0,212,146,0.12),transparent_65%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-56 -bottom-72 -z-10 size-[650px] rounded-full border border-white/[0.06] before:absolute before:inset-16 before:rounded-full before:border before:border-white/[0.06] after:absolute after:inset-32 after:rounded-full after:border after:border-white/[0.06]"
      />

      <div className="mx-auto flex min-h-svh w-full max-w-[800px] flex-col px-8 py-7 xl:px-10 2xl:px-16 2xl:py-12">
        <header className="flex items-center justify-between gap-5">
          <TorclyLogo variant="inverse" className="text-3xl 2xl:text-4xl" />
          <span className="border-l border-white/15 pl-5 text-[10px] leading-4 font-medium tracking-[0.16em] text-white/65 uppercase">
            Plataforma de
            <br />
            gestión empresarial
          </span>
        </header>

        <div className="flex flex-1 flex-col justify-center py-6 2xl:py-10">
          <p className="mb-5 flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] text-brand-accent uppercase">
            <span aria-hidden="true" className="h-px w-7 bg-brand-accent" />
            Control de tu operación
          </p>
          <h2 className="max-w-xl text-[clamp(2rem,2.8vw,3.75rem)] leading-[1.12] font-semibold tracking-[-0.035em]">
            Tu negocio,
            <br />
            <span className="text-white/65">conectado en</span>
            <br />
            un solo lugar.
          </h2>
          <p className="mt-5 max-w-[360px] text-sm leading-6 2xl:max-w-[390px] 2xl:leading-7 text-white/70">
            Centraliza la gestión comercial y mantén una visión clara de tus
            productos, ventas e inventario.
          </p>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-white/10 pt-5 text-[11px] text-white/60">
          <span>Torcly / Gestión comercial</span>
          <span className="text-white/45">
            Organización. Control. Visibilidad.
          </span>
        </footer>
      </div>
    </aside>
  )
}
