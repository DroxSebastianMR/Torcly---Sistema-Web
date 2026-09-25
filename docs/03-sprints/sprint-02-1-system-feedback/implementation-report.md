# Implementación - Sprint 02.1

Fecha: 2026-09-24
Rama: `feature/sprint-02-1-system-feedback`
Base: `16dd3ef` (Sprint 02 aprobado)

## Alcance implementado (solo `apps/web`)

### Biblioteca `lib/feedback`

- `feedback.types.ts` — `FeedbackKind`, `FeedbackPreset` y `FeedbackAction`.
- `feedback.presets.ts` — cinco presets (connection, session-expired,
  permission-denied, not-found, unexpected) con copia, íconos, variante visual
  y acciones sugeridas; `getFeedbackPreset` centraliza los textos.
- `feedback-from-error.ts` / `.test.ts` — `getFeedbackKindFromError`: sin
  respuesta HTTP → conexión, 401 → sesión vencida, 403 → permiso denegado,
  404 → no encontrado, resto → inesperado.

### Componentes `components/ui`

- `system-feedback-screen.tsx` — pantalla a pantalla completa para estados de
  sistema: `role="alert"`, encabezado H1, ícono circular con placa de color,
  descripción y bloque de acciones (primaria/secundaria) con estado `busy`
  (deshabilita y muestra `LoaderCircle`). Estética hereda de `LoadingScreen`
  (blobs de marca, `min-h-svh`).
- `error-state.tsx` — bloque en línea (`min-h-72`) con `role="alert"`, ícono
  configurable y acción de reintento opcional.
- `empty-state.tsx` — bloque en línea para listados vacíos (ícono, H2,
  descripción y acción opcional).
- `modal.tsx` — extendido sin romper a `UserFormModal`/`UserRoleModal`:
  prop `busy` (bloquea Escape/cierre/overscroll y expone `aria-busy`), prop
  `initialFocusRef`, trampa de foco Tab/Shift+Tab, `closeButtonLabel` y
  retorno de foco al abridor. Todos los modales comparten ahora una
  composición visual: cierre superior, cabecera limpia y pie de acciones
  diferenciado.
- `confirmation-dialog.types.ts` + `confirmation-dialog.tsx` — diálogo de
  confirmación con variantes `danger` (ámbar), `success` (esmeralda) e `info`
  (primario). `pending` controlado o derivado de la promesa de `onConfirm`;
  foco inicial en el botón de confirmar; sin doble envío; permanece abierto si
  la acción rechaza (documentado en tipos y README del sprint).
- `smart-select.tsx` — selector controlado visual de Torcly; añade búsqueda
  desde la opción once. También admite búsqueda libre con sugerencias, usada en los filtros de
  Usuarios y Productos.
- `date-picker.tsx` y `time-picker.tsx` — controles controlados, sin
  dependencias externas, para fecha ISO (`YYYY-MM-DD`) y hora de 24 horas
  (`HH:mm`). Admiten `name`, límite de fecha e intervalo de minutos.
- `multi-select.tsx` y `date-range-picker.tsx` — multiselección con aplicación
  explícita y rango de fechas con periodos rápidos; ambos quedan disponibles
  para módulos cuyos contratos de API soporten esos filtros.

### Integraciones

- `auth-context` / `auth-provider` — nueva propiedad `errorDetail?: unknown`
  con el error real de la verificación de sesión.
- `protected-route.tsx` — sigue usando `LoadingScreen` durante la verificación,
  y ante error renderiza `SystemFeedbackScreen` con el `kind` derivado de
  `getFeedbackKindFromError(errorDetail)` y «Reintentar» (retry). Redirige a
  login sin sesión.
- `permission-route.tsx` — sin permiso (o sin sesión) muestra
  `SystemFeedbackScreen` tipo `permission-denied` con «Volver al inicio».
- `app-router.tsx` — `RouteError` ahora distingue 404 (página no encontrada con
  «Volver al inicio») de errores internos («Reintentar» recarga + «Volver al
  inicio»); `RouteError` se exporta por nombre para pruebas.
- `users-page.tsx` — `window.confirm` reemplazado por `ConfirmationDialog`
  (danger al desactivar, success al reactivar, `pending` ligado a la mutación);
  el estado de error en línea usa `ErrorState` con reintento.
- `users-table.tsx` / `products-table.tsx` — estado vacío común con
  `EmptyState`.
- `products-page.tsx` — estado de error con `ErrorState` y `window.confirm`
  reemplazado por `ConfirmationDialog` para activar/desactivar productos.
- `users-toolbar.tsx` / `products-toolbar.tsx` — los campos de búsqueda son
  comboboxes reutilizables y los botones de filtros abren modales con borrador,
  aplicar y cancelar; ya no son controles decorativos.
- Formularios de Usuarios y Productos — roles, categoría, marca y unidad
  importan `SmartSelect`; la regla de no crear `<select>` en módulos quedó
  registrada en la guía de frontend.

## Decisiones tomadas

1. Sin token destructivo en Torcly → variante `danger` ámbar (no rojo).
2. `onConfirm` resuelve en éxito y rechaza en fallo para mantener el diálogo.
3. Copia centralizada en `feedback.presets.ts`.
4. `SystemFeedbackScreen` con H1; estados en línea con H2.
5. El mapeo de errores vive en una función pura testeada (`feedback-from-error`).

## Detalles técnicos relevantes

- Íconos `lucide-react` verificados disponibles (`TriangleAlert`, `CircleCheck`,
  `CircleAlert`, `ShieldX`, `WifiOff`, `SearchX`, `Inbox`, `LoaderCircle`,
  `LogIn`, `ArrowLeft`, `House`, `PackageSearch`, `Compass`, `Info`,
  `RotateCw`, `X`).
- Se respetaron `tsconfig` estricto (`verbatimModuleSyntax`, `import type`,
  sin no-usados) y ESLint (`react-hooks`, `react-refresh/only-export-components`).
- Sin cambios en `apps/api` ni en migraciones.

## Resultado de pruebas

- `apps/web` — 20 archivos / 84 pruebas en verde, incluidas 9 de
  `confirmation-dialog`, 9 de `system-feedback-screen`, 2 de `error-state`,
  2 de `empty-state`, 2 de `feedback-from-error` (nuevas) y guards/router.
  Nota: los matchers de `@testing-library/jest-dom` no están registrados en
  este entorno; los tests usan aserciones de DOM nativas.
- `pnpm typecheck`, `pnpm lint`, `pnpm build` OK en `apps/web`.
- `pnpm format:check` (root) y `git diff --check` OK.

## Verificación funcional manual

Ejecutada el 2026-09-24 contra API (`127.0.0.1:3000`) y frontend dev (`5173`):

- Login con el administrador y navegación al dashboard.
- Usuarios: «Desactivar Jose» → diálogo danger (botón `bg-amber-600`, placa
  `bg-amber-100` ámbar, foco inicial en confirmar); cierre con Escape; flujo
  completo desactivar (toast + fila «Inactivo») y activar (diálogo success
  `bg-emerald-600`, toast, estado restaurado a «Activo»).
- Ruta inexistente: pantalla «Página no encontrada» (H1, alerta) y «Volver al
  inicio» → dashboard.
- API detenida: ruta protegida muestra la pantalla de recuperación con
  «Reintentar» (el proxy de Vite transforma la caída en 500 → tipo
  «inesperado»); al reiniciar la API y pulsar «Reintentar» carga el módulo.
- Productos: estado vacío real «No se encontraron productos» (EmptyState).
- Sin errores de consola relevantes.

Nota de entorno: el API de Torcly estuvo detenida porque el dev server de otro
proyecto ocupaba el puerto 3000; se liberó temporalmente para la prueba y se
restauró al finalizar (el servidor original volvió a 3000).
