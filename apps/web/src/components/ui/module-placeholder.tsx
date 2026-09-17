import { Construction } from 'lucide-react'
export function ModulePlaceholder({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <section>
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Espacio de trabajo
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-muted-foreground">{description}</p>
      <div className="mt-8 rounded-xl border border-dashed bg-card p-10">
        <Construction className="mb-4 text-primary" />
        <h2 className="font-medium">Módulo preparado</h2>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          La estructura y la navegación están listas. Las operaciones y los
          datos se implementarán al conectar la API de Torcly.
        </p>
      </div>
    </section>
  )
}
