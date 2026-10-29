# QA-18 - Correcciones de formularios y feedback

Rama: `feature/qa-manual-corrections`  
Estado: Implementado; validación manual pendiente  
Origen: QA-03 y QA-04 de la prueba manual.

## Objetivo

Eliminar feedback visual desactualizado en Clientes y hacer explícito el código
404, sin modificar las validaciones del servidor ni confundir errores esperados
con fallos inesperados.

## Alcance

| ID    | Entrega                                                                |
| ----- | ---------------------------------------------------------------------- |
| QA-03 | Revalidación inmediata del RUC tras corregir un documento erróneo.     |
| QA-04 | Identificación visible y accesible de `Error 404` en ruta inexistente. |

## Límites

- DNI/RUC, duplicados y validaciones de API siguen vigentes.
- La página 404 conserva explicación amigable y retorno al inicio.
- Los errores inesperados conservan una pantalla distinta.

Usar [implementation-prompt.md](implementation-prompt.md) y
[acceptance-and-test-plan.md](acceptance-and-test-plan.md).

## Resultados

### QA-03 - Revalidación de RUC

- Causa raíz: el diálogo usaba la validación por defecto (`onSubmit`) y al
  alternar el tipo de documento ejecutaba `setValue('documentNumber', '', {
shouldValidate: true })`. Esa revalidación inmediata dejaba visible un error rojo
  obsoleto (`Ingresa el documento.`) que permanecía hasta el siguiente envío, de
  modo que corregir con un RUC válido no lo retiraba.
- Corrección: `useForm` pasa a `mode: 'onTouched'` y el cambio de tipo deja de
  forzar la validación del documento, conservando `clearErrors([...])` para
  limpiar los errores dependientes del tipo anterior.
- Archivos: `apps/web/src/features/customers/components/customer-form-modal.tsx`
  y `apps/web/src/features/customers/components/customer-form-modal.test.tsx`.
- Pruebas: `revalida el RUC al corregirlo después del primer error` (reproducía
  el defecto y ahora pasa) y `retira el error de RUC al corregirlo sin perder los
demás campos`. 6 pruebas del modal en verde.
- Límite respetado: la validación de DNI/RUC, razón social, teléfono y la
  validación de duplicados en API no se modificaron.

### QA-04 - Identificación de `Error 404`

- Se añadió `code?: string` a `FeedbackPreset` y `code: 'Error 404'` al preset
  `not-found`; `SystemFeedbackScreen` renderiza ese código como distintivo
  visible dentro del `role="alert"`, sin alterar título, descripción ni acciones.
- Archivos: `apps/web/src/lib/feedback/feedback.types.ts`,
  `apps/web/src/lib/feedback/feedback.presets.ts`,
  `apps/web/src/components/ui/system-feedback-screen.tsx`.
- Pruebas: `apps/web/src/components/ui/system-feedback-screen.test.tsx` (señal
  404 visible/accesible y su ausencia en `unexpected`) y
  `apps/web/src/app/router/app-router.test.tsx` (404 con `Error 404`, error
  interno sin él). La pantalla de error inesperado se mantiene diferenciada.
- El título amigable, la explicación y la acción de retorno al inicio se
  conservan.

### Verificación

- Web: typecheck, lint, test (375 aprobadas; `service-form-modal.test.tsx` y
  `appointment-form-modal.test.tsx` son flaky preexistentes y pasan en ejecución
  aislada) y build correctos.
- `pnpm format:check` y `git diff --check` correctos.
- Pendiente: validación manual en navegador con captura de QA-03 y QA-04.
