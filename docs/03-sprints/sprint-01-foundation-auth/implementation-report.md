# Informe de implementación - Sprint 01

Fecha técnica: 24/09/2026.
Estado: listo para prueba y aprobación del usuario.

## Resultado

- Modelos Prisma para usuarios, roles, permisos, sesiones y auditoría.
- Migración `20260924170000_add_auth_foundation` aplicada sin alterar productos.
- Seed idempotente de administrador, rol y permisos.
- Contraseñas con `scrypt`, salt aleatorio y comparación constante.
- Tokens opacos; solo su huella SHA-256 se persiste.
- Cookie HttpOnly, `SameSite=Lax`, `Secure` en producción y vigencia deslizante.
- Login por usuario o correo, `me`, logout y permisos de servidor.
- Bloqueo de 15 minutos tras cinco fallos e inactividad de 30 minutos.
- Auditoría de accesos, fallos, bloqueo, expiración, logout y denegaciones.
- Productos protegidos con `products:read` y `products:write`.
- Frontend sin bypass demo ni tokens en almacenamiento web.
- Pantalla de carga reutilizable para validación de sesión y futuras cargas a pantalla completa.

## Evidencia automática

- API: 23 pruebas con PostgreSQL, incluidas las pruebas integradas y la auditoría de eventos.
- Web: 35 pruebas, incluidas validación, error, redirección, caché de sesión y pantalla de carga.
- Prisma schema y tres migraciones válidas.
- Las tres migraciones se ejecutaron desde un esquema PostgreSQL vacío y el esquema temporal se eliminó después de la prueba.
- `typecheck`, `lint`, `build` y formato forman parte del cierre técnico.
- El test de integración crea datos aislados y los elimina al finalizar.

## Evidencia de navegador

Se verificó mediante navegador real:

1. acceso por correo;
2. redirección al dashboard;
3. recarga conservando la sesión;
4. consulta del catálogo protegido;
5. logout;
6. historial incapaz de recuperar la ruta protegida;
7. ausencia de tokens en `localStorage` y `sessionStorage`.
8. pantalla visual de verificación de sesión durante una respuesta demorada.

Captura: [catálogo autenticado](../../../output/playwright/sprint-01-authenticated-products.png).

Captura: [pantalla reutilizable de carga](../../../output/playwright/sprint-01-loading-screen.png).

## Preparación de la cuenta de prueba del usuario

Estado: cuenta creada mediante el seed y flujo de sesión verificado el 24/09/2026.

Las credenciales permanecen únicamente en `apps/api/.env`:

```env
SEED_ADMIN_EMAIL=
SEED_ADMIN_USERNAME=
SEED_ADMIN_NAME=
SEED_ADMIN_PASSWORD=
```

La contraseña debe tener al menos 12 caracteres. Si se modifican los valores, ejecutar nuevamente:

```bash
pnpm db:seed
```

El comando es idempotente: repetirlo actualiza la cuenta y no duplica relaciones.

Durante la verificación desde vacío se corrigió el orden histórico de la migración de restricciones de productos. El historial de `public` se actualizó solo en metadatos y permanece alineado, sin modificar datos de negocio.

## Pendiente de aprobación

La implementación no incrementa todavía el porcentaje oficial. HU-01 y HU-02 pasarán a aprobadas únicamente después de la prueba manual del usuario.
