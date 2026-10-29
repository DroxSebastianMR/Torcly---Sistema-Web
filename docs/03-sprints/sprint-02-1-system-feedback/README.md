# Sprint 02.1 - Estados del sistema y recuperación UX

Rama: `feature/sprint-02-1-system-feedback`
Base: Sprint 02 aprobado (`16dd3ef`)
Tipo: sprint transversal de calidad UX (no agrega historias nuevas)

## Objetivo

Reemplazar las pantallas técnicas del Sprint 01/02 (bloques de error en línea,
`window.confirm`, estados genéricos) por un sistema reutilizable y accesible de
retroalimentación visual: pantallas de estado a pantalla completa, estados de
error/vacío en línea y diálogos de confirmación con recuperación clara, sin
tocar la lógica de negocio validada en Sprint 02.

## Entregables

- `lib/feedback`: tipos, presets semánticos y mapeo de errores HTTP/API a un
  único `FeedbackKind` (`connection`, `session-expired`, `permission-denied`,
  `not-found`, `unexpected`).
- `components/ui/system-feedback-screen`: pantalla de sistema accesible
  (`role="alert"`, encabezado H1, bloque de acciones) usada por los guards y la
  ruta de error.
- `components/ui/error-state` y `empty-state`: bloques en línea para tablas y
  páginas de listado.
- `Modal` extendido (estado `busy`, trampa de foco, foco inicial configurable,
  rótulo de cierre y `aria-busy`) y nuevo `ConfirmationDialog`.
- Integraciones: `ProtectedRoute`, `PermissionRoute`, `RouteError`, página de
  usuarios (confirma desactivar/reactivar sin `window.confirm`) y estados en
  usuarios/productos.

## Decisiones del sprint

1. **Sin rojos de error.** Torcly no tiene token destructivo; la variante
   `danger` del diálogo usa ámbar (advertencia) y `success` esmeralda, ambos
   compatibles con la paleta `brand-forest`/`primary`.
2. **El diálogo informa fallos y permanece abierto.** `onConfirm` debe
   resolver cuando todo salió bien y rechazar para mantener el diálogo abierto;
   el estado `pending` bloquea Escape, el clic externo y el doble envío.
3. **Un solo artefacto de copia.** Los textos de cada estado viven en
   `feedback.presets.ts`; las pantallas derivan de un único `kind`.
4. **Jerarquías explícitas.** La pantalla de sistema usa H1; los estados en
   línea usan H2 para no romper los resúmenes de página.

## Fuera de alcance

Sin cambios en API, esquema ni reglas de negocio. El flujo de activar o
desactivar productos utiliza ahora `ConfirmationDialog`, sin diálogos nativos
del navegador.

## Verificación

- `pnpm test` — 84 pruebas en `apps/web` en verde (20 archivos).
- `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm format:check`,
  `git diff --check`.
- Verificación funcional manual en navegador (login, diálogos danger/success,
  página 404, recuperación con API caída y estado vacío real de productos).

## Controles reutilizables

- `SmartSelect`: úsalo con `{ value, label }[]`; siempre conserva el selector
  visual Torcly y, desde 11 opciones, añade búsqueda integrada.
- `SmartSelect` también permite `forceSearch` y `allowCustomValue` para una
  búsqueda libre con sugerencias, como los filtros de Usuarios y Productos.
- `DatePicker`: valor controlado `YYYY-MM-DD`; dispone de límites `min` y
  `max` opcionales.
- `TimePicker`: valor controlado `HH:mm`; el intervalo predeterminado es de
  30 minutos y puede configurarse con `interval`.
- `MultiSelect`: selección múltiple con búsqueda, borrador y aplicación
  explícita; úsalo solo con contratos que acepten múltiples valores.
- `DateRangePicker`: rango `{ from, to }` con selección visual y periodos
  rápidos de 7, 14 y 31 días, además del mes actual.

La política obligatoria de importación para todos los módulos está en
`docs/02-arquitectura/frontend.md`.
