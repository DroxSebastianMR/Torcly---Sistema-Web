# Sprint 23 — Multitenencia por organización

## Resultado esperado

Una instancia de Torcly podrá atender varios talleres sin que sus datos,
permisos, códigos, reportes ni actividad se crucen.

## Entregables

1. Fundación: organizaciones, membresías, administrador de plataforma y
   organización activa por sesión.
2. Migración/backfill seguro de la instalación existente.
3. `organization_id` obligatorio en toda entidad operativa y sus índices
   compuestos.
4. Contexto de tenant obligatorio en API, repositorios y auditoría.
5. Selector o consola exclusiva para el administrador de plataforma.
6. Pruebas automatizadas que impidan lecturas y referencias cruzadas.

## Fuera de alcance

- Copiar datos entre talleres.
- Dar acceso global a un administrador regular de taller.
- Usar un header o parámetro del navegador como autorización de tenant.

## Estado

**Listo para prueba manual controlada.** La migración de fundación fue aplicada
en desarrollo por el usuario. La cuenta de plataforma entra a una consola exclusiva (`/plataforma`)
y no recibe permisos ni navegación operativa de un taller. Las entidades
operativas ya incorporan su `organization_id`; las consultas y mutaciones lo
resuelven desde la membresía activa de la sesión, nunca desde un valor enviado
por el navegador.

La consola ya permite listar, buscar, registrar, activar y desactivar
organizaciones; además permite registrar miembros del taller, cambiar su rol y
activar o desactivar su membresía. Al desactivar un taller o miembro se revocan
sus sesiones de base de datos y las entradas de sesión en memoria. Sus rutas
están protegidas por autenticación y por la marca de administrador de
plataforma; un administrador regular de taller no puede utilizarlas.

Pendiente de aceptación: aplicar las migraciones restantes únicamente en el
entorno autorizado, ejecutar las pruebas cruzadas A/B con PostgreSQL y revisar
el backfill de instalaciones existentes. No se deben ejecutar migraciones ni
seed en producción sin respaldo, preflight y autorización explícita.

## Verificación técnica actual

- API: `prisma validate`, typecheck y lint correctos; **438 pruebas aprobadas**
  y **111 integraciones omitidas** al no activar `DATABASE_TESTS`.
- Web: typecheck, lint, build y **428 pruebas en 88 archivos** correctos.
- `pnpm format:check` y `git diff --check` correctos.
- Los fixtures heredados ya declaran una organización explícita; los contratos
  de producción no hacen opcional `organizationId`.

## Documentos de control

- [Arquitectura multitenant](../../02-arquitectura/multitenencia-organizaciones.md)
- [Administración de plataforma](../../02-arquitectura/administracion-plataforma.md)
- [Plan de fase 2](phase-2-implementation-plan.md)
- [Plan de aceptación](acceptance-and-test-plan.md)
- [Runbook de migración](migration-runbook.md)
- [Acta de aprobación](approval.md)
