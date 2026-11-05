# Torcly v1.1.1 — Multitenencia funcional y plataforma SaaS

Fecha de publicación: 5 de noviembre de 2026.

Esta versión transforma Torcly en una plataforma SaaS multitenant. Una única instancia y base de datos puede atender a múltiples talleres independientes con aislamiento estricto de datos, permisos y catálogos, sin cruces de información ni acceso no autorizado entre organizaciones.

## Cambios destacados de v1.1.1

- **Aislamiento operativo completo (Multitenancy)**:
  - Cada entidad operativa (`clientes`, `vehículos`, `productos`, `servicios`, `técnicos`, `inventario`, `citas`, `órdenes de trabajo`, `ventas`, `pagos`, `cajas`, `compras`, `proveedores`, `reabastecimiento`, `conversaciones IA`, `notificaciones` y `auditoría`) incorpora `organization_id` obligatorio.
  - Toda consulta y mutación en la API obtiene la organización exclusivamente desde la membresía activa de la sesión, nunca desde parámetros o cabeceras del cliente.
  - Los códigos comerciales (placas, códigos de producto, documentos de clientes) ahora son únicos por organización mediante índices compuestos; dos talleres pueden registrar la misma placa o código sin colisión.

- **Consola de plataforma SaaS (`/plataforma`)**:
  - Cuenta global de administrador de plataforma (`isPlatformAdmin`) separada de la operación de los talleres.
  - Panel centralizado para listar, buscar, registrar, activar y desactivar organizaciones.
  - Gestión de membresías de cada taller (alta de miembros, cambio de roles, activación y desactivación).
  - Al desactivar un taller o una membresía, sus sesiones se revocan de inmediato tanto en base de datos como en memoria.
  - La cuenta de plataforma no tiene acceso a datos operativos de ningún taller sin un flujo explícito y auditado.

- **Diseño unificado y validaciones en la interfaz**:
  - Diálogos de creación y edición de organizaciones adaptados al estándar visual de Torcly (`<Field>` con validaciones reactivas Zod y mensajes de error en rojo).
  - Supresión de validaciones nativas de navegador (`noValidate`) y eliminación de líneas divisoras residuales en secciones.
  - Habilitada la edición del nombre y correo del responsable desde la consola de plataforma.
  - El sidebar identifica la versión desplegada como `v1.1.1`.

## Módulos y estado de seguridad

| Módulo / Capacidad    | Comportamiento en v1.1.1                                                                                              |
| --------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Autenticación         | Vincula la sesión a la organización activa del usuario. Bloquea el inicio de sesión si la organización está inactiva. |
| Consola de plataforma | Exclusiva para cuentas con `isPlatformAdmin = true`. Protegida en frontend y validada en cada endpoint backend.       |
| Operación de taller   | Clientes, vehículos, órdenes, ventas, citas e inventario restringidos estrictamente al `organization_id` autenticado. |
| Referencias cruzadas  | Buscar o asociar un UUID perteneciente a otro taller devuelve `404 Not Found` sin confirmar su existencia.            |

## Verificación de calidad previa a release

- API: `prisma validate`, typecheck y lint en verde; **439 pruebas unitarias aprobadas**.
- Web: typecheck, lint, build de producción y **428 pruebas en 88 suites aprobadas**.
- Formato: `pnpm format:check` y `git diff --check` al 100% limpios.
- Prueba de aislamiento manual A/B ejecutada y documentada con éxito en PostgreSQL.
- Base de datos depurada: eliminados roles y usuarios residuales de pruebas.

## Migración a producción

Para aplicar esta versión a la base de datos de producción:

1. Realizar respaldo preventivo (`pg_dump`).
2. Ejecutar auditoría previa con `pnpm --filter @torcly/api audit:production`.
3. Aplicar migraciones con `pnpm --filter @torcly/api exec prisma migrate deploy`.
4. Ejecutar la semilla mínima o crear la cuenta de plataforma con `SEED_PLATFORM_ADMIN_*`.
