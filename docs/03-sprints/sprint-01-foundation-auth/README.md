# Sprint 01 - Fundaciones y autenticación

Rama: `feature/sprint-01-foundation-auth`
Historias: HU-01, HU-02
Avance acumulado al aprobar: 2/92 = 2,17%

## Objetivo

Convertir el acceso visual existente en un flujo real y seguro, y dejar una base de datos reproducible para los módulos posteriores.

Estado técnico: `Listo para prueba del usuario`.

## Entregables

- PostgreSQL/Prisma, esquema inicial, migración y seed de desarrollo.
- Autenticación por `identifier` y contraseña con hash seguro.
- Sesión persistente mediante cookie HttpOnly, `me` y logout.
- bloqueo de 15 minutos tras cinco intentos fallidos e inactividad de 30 minutos;
- autorización base de servidor y auditoría mínima;
- UI de login integrada, sin depender del modo demo;
- pruebas de autenticación, sesión, bloqueo y permisos;
- README de `auth` en frontend y API.

## Fuera de alcance

Administración completa de usuarios, recuperación por correo real y módulos comerciales.

## Dependencias y decisiones

Requiere conexión aprobada de PostgreSQL. La recuperación puede conservar su contrato, pero no cuenta como terminada en este sprint si no existe proveedor de correo.

## Evidencia

Consultar el [informe de implementación](implementation-report.md) y el [plan de aceptación](acceptance-and-test-plan.md).
