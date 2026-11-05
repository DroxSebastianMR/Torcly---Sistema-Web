# Acta de aprobación — Sprint 23

## Estado

**Aprobado por el usuario.** El aislamiento de datos opera en todas las entidades
operativas y la consola de plataforma permite administrar organizaciones,
responsables y membresías sin acceder a datos operativos. Las pruebas manuales
de aislamiento A/B y la depuración de roles y usuarios residuales concluyeron con éxito.

## Criterios pendientes

- [x] La migración de fundación se aplicó con respaldo verificable en entorno de desarrollo.
- [x] Los datos existentes fueron asociados a la organización de transición ("Taller de desarrollo").
- [x] Cada consulta y mutación operativa exige `organizationId` del servidor.
- [x] Los fixtures y pruebas heredadas están migrados al contrato de
      `organizationId` obligatorio y el typecheck completo de API y Web pasa.
- [x] Las pruebas manuales de aislamiento A/B pasan (consulta por UUID ajeno devuelve 404 sin exponer PII).
- [x] Consola de plataforma `/plataforma` funcional: administra organizaciones, membresías y edición de responsables.
- [x] Base de datos depurada: eliminados usuarios y roles temporales de pruebas, conservando usuarios reales y las 3 organizaciones aprobadas.
- [x] Usuario aprobó explícitamente el flujo multitenant tras prueba manual.

## Decisión de seguridad

No se debe declarar cerrado ni aplicar la migración en producción mientras una
entidad operativa pueda leerse o escribirse sin el contexto de organización.
