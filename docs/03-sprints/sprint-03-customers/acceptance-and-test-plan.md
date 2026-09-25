# Aceptación y pruebas - Sprint 03

- DNI/RUC inválido, duplicado o incompleto se rechaza de forma clara.
- Persona natural y jurídica muestran solo campos aplicables.
- Las tres búsquedas devuelven coincidencias y estado vacío correcto; un DNI o
  RUC completo identifica únicamente el documento exacto.
- Actualizar vuelve a aplicar todas las reglas.
- Solo perfiles autorizados consultan o modifican datos personales.
- La ficha no fabrica vehículos ni historial ausentes.
- Pruebas de API, formularios, permisos y flujo completo pasan.
- Test, typecheck, lint y build pasan.

## Evidencia automatizada (antes de la prueba manual)

- API: `customers.schemas.test.ts` (contratos DNI/RUC/teléfono/email),
  `customers.service.test.ts` (normalización por tipo, duplicado P2002→409, 404) y `customers.integration.test.ts` (con `DATABASE_TESTS=true`):
  permisos, creación, duplicado, búsquedas, auditoría. Los tests de
  integración se omiten si no hay `DATABASE_TESTS=true`.
- Web: `forms/customers.schema.test.ts`, `services/customers.service.test.ts`,
  `components/customer-form-modal.test.tsx` (validar, natural, jurídica,
  edición) y tests de página/ficha (carga, error, vacío, permisos, secciones).
- Validación del documento también en el servidor (regla de autoridad).

## Prueba manual

1. Aplicar migraciones: `pnpm --filter @torcly/api db:migrate:deploy`, re-embe
   el seed (`pnpm --filter @torcly/api db:seed`) para disponer de
   `customers:read`/`customers:write` y usar la cuenta admin.
2. Crear persona natural (DNI 8 dígitos) y jurídica (RUC 11 dígitos);
   intentar DNI inválido y RUC duplicado y verificar mensajes claros.
3. Buscar por documento, por nombre/razón social y por teléfono; confirmar
   que el DNI/RUC completo no sugiere ni lista otro documento que solo lo
   contiene, y validar vacío con búsqueda inexistente.
4. Editar un cliente (nombres/teléfono/correo) y verificar que la ficha se
   actualiza; confirmar que el tipo no se puede cambiar al editar.
5. Consultar la ficha: datos de contacto y secciones Vehículos/Historial
   vacías (sin datos inventados).
6. Con un perfil sin `customers:read`/`customers:write` verificar que no
   aparecen el listado ni los botones de modificación.
7. Abrir el selector de tipo sobre la tabla y el selector de rol dentro del
   modal de usuarios: ambos deben verse completos sobre el contenido, sin
   recorte ni barra visual de scroll en el modal.
