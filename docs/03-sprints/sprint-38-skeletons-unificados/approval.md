# Acta de verificación

## Evidencia automática

- `pnpm --filter @torcly/web typecheck`: aprobado.
- `pnpm --filter @torcly/web lint`: aprobado.
- `pnpm --filter @torcly/web test -- preventive-maintenance-page.test.tsx platform-subscriptions-page.test.tsx dashboard-page.test.tsx`: aprobado, 3 archivos y 12 pruebas.

## Pendiente de aprobación funcional

Verificar visualmente los estados de carga de Cotizaciones, Mantenimiento Preventivo y Suscripciones antes de integrar la rama.
