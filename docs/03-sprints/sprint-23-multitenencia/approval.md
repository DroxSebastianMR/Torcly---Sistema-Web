# Acta de aprobación — Sprint 23

## Estado

En implementación. La base estructural está lista para revisión técnica, pero
el aislamiento de todas las entidades operativas todavía requiere las fases de
backfill, repositorios por organización y pruebas cruzadas.

## Criterios pendientes

- [ ] La migración de fundación se aplicó con respaldo verificable.
- [ ] Los datos existentes fueron asociados a una organización de transición.
- [ ] Cada consulta y mutación operativa exige `organizationId` del servidor.
- [ ] Las pruebas A/B de aislamiento pasan con PostgreSQL real.
- [ ] La consola del administrador de plataforma registra soporte auditado.
- [ ] Usuario aprobó explícitamente el flujo multitenant.

## Decisión de seguridad

No se debe declarar cerrado ni aplicar la migración en producción mientras una
entidad operativa pueda leerse o escribirse sin el contexto de organización.
