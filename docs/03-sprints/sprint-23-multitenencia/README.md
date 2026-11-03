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

En implementación. La migración de fundación se creó pero **no está aplicada**.
La consola interna ya cuenta con una ruta de acceso protegida
(`GET /api/v1/platform/access`); aún no expone datos de organizaciones ni
reemplaza el panel operativo. No se deben ejecutar migraciones ni seed en
producción sin respaldo, preflight y autorización explícita.

## Documentos de control

- [Arquitectura multitenant](../../02-arquitectura/multitenencia-organizaciones.md)
- [Administración de plataforma](../../02-arquitectura/administracion-plataforma.md)
- [Plan de fase 2](phase-2-implementation-plan.md)
- [Plan de aceptación](acceptance-and-test-plan.md)
- [Runbook de migración](migration-runbook.md)
- [Acta de aprobación](approval.md)
