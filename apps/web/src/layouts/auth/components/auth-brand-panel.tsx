import { ShieldCheck } from 'lucide-react'
import { TorclyLogo } from '@/components/brand/torcly-logo'

export function AuthBrandPanel() {
  return (
    <aside
      aria-label="Torcly, gestión para talleres mecánicos"
      className="relative isolate hidden overflow-hidden bg-[#032f29] text-white lg:flex lg:flex-col"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_85%_15%,rgb(0_196_135_/_42%),transparent_48%),linear-gradient(125deg,rgb(1_36_31_/_96%),rgb(2_62_53_/_88%))]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-52 -top-44 -z-10 size-[520px] rounded-full border border-brand-accent/65 bg-brand-accent/20"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-56 -bottom-72 -z-10 size-[650px] rounded-full border border-brand-accent/45 before:absolute before:inset-16 before:rounded-full before:border before:border-brand-accent/30 after:absolute after:inset-32 after:rounded-full after:border after:border-brand-accent/20"
      />

      <div className="mx-auto flex min-h-svh w-full max-w-[800px] flex-col px-10 py-12 xl:px-14 2xl:px-20 2xl:py-16">
        <header>
          <TorclyLogo variant="inverse" className="text-4xl" />
        </header>

        <div className="flex flex-1 flex-col justify-center py-10 2xl:py-14">
          <p className="mb-5 flex items-center gap-3 text-[11px] font-semibold tracking-[0.24em] text-brand-accent uppercase">
            <span aria-hidden="true" className="h-px w-7 bg-brand-accent" />
            Gestión para talleres mecánicos
          </p>
          <h2 className="max-w-xl font-heading text-[clamp(3rem,4.3vw,5.25rem)] leading-[.98] font-semibold tracking-[-0.05em]">
            Tu taller,
            <br />
            <span className="text-brand-accent">organizado y</span>
            <br />
            bajo control.
          </h2>
          <p className="mt-7 max-w-[440px] text-base leading-7 text-white/75 2xl:text-[17px]">
            Centraliza la gestión de clientes, vehículos, servicios, inventario
            y más, en un solo lugar.
          </p>
          <div className="mt-14 flex max-w-[370px] items-center gap-4 rounded-2xl border border-white/15 bg-black/10 px-5 py-4 backdrop-blur-sm">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-accent/15 text-brand-accent">
              <ShieldCheck aria-hidden size={24} />
            </span>
            <div>
              <p className="text-sm font-semibold">Acceso seguro</p>
              <p className="mt-1 text-xs leading-5 text-white/70">
                Torcly protege la información de tu taller.
              </p>
            </div>
          </div>
        </div>

        <footer className="text-[11px] text-white/45">
          Torcly / Gestión comercial
        </footer>
      </div>
    </aside>
  )
}
