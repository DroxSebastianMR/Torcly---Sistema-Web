# Fase 2 — Multitenencia funcional

## Objetivo

Transformar la fundación de organizaciones en aislamiento real de datos para
que una solicitud autenticada sólo pueda leer y modificar registros de su
organización activa.

## Orden de implementación

| Lote                     | Entidades raíz                                                                    | Dependencias que se validan                         | Resultado                                 |
| ------------------------ | --------------------------------------------------------------------------------- | --------------------------------------------------- | ----------------------------------------- |
| 2.1 Catálogos y personas | clientes, vehículos, categorías, marcas, unidades, productos, servicios, técnicos | inventario y órdenes                                | Catálogos independientes por taller.      |
| 2.2 Operación            | inventario, citas, órdenes y sus líneas/actividades/consumos                      | clientes, vehículos, productos, servicios, técnicos | Atención y taller aislados.               |
| 2.3 Comercio             | ventas, líneas, pagos y cajas                                                     | órdenes, productos, servicios, clientes             | Cobros sin cruces entre talleres.         |
| 2.4 Auxiliares           | IA, notificaciones, auditoría, proveedores, compras y reabastecimiento            | identidad y entidades raíz                          | Historiales y datos secundarios aislados. |
| 2.5 Plataforma           | organizaciones, membresías, analítica agregada y soporte                          | todos los lotes                                     | Consola `/plataforma` protegida.          |

Cada lote se completa con migración nullable, backfill comprobable, filtros en
repositorio, validación de referencias cruzadas y pruebas A/B. Sólo después se
vuelve obligatorio `organization_id` y se cambian los únicos globales por
índices compuestos.

## Contrato de seguridad

- El `organizationId` se obtiene con `requireOrganizationContext(request.user)`.
- Los controladores nunca aceptan el tenant desde `params`, `query` o `body`.
- Buscar un UUID ajeno responde como no encontrado, sin confirmar su existencia.
- Crear una relación exige que todos sus registros pertenezcan a la misma
  organización.
- Las operaciones transaccionales propagan el mismo tenant a cada consulta.

## Roles aprobados

- **Administrador de plataforma Torcly**: flag global `isPlatformAdmin`, sin
  permisos operativos implícitos.
- **Dueño del taller**: nombre visible del rol operativo actual
  `administrator`; administra sólo su organización.
- **Roles de colaboradores**: se asignan mediante
  `OrganizationMembership`, nunca directamente a la identidad global.

## Estado

Implementado en código y listo para validación controlada. La consola
`/plataforma` administra organizaciones y membresías; desactivar una de ellas
revoca las sesiones afectadas. Esta fase no autoriza aún una migración de
producción ni el backfill. Se requiere respaldo, preflight y aprobación
explícita antes de aplicar cualquier migración.

La compilación de producción de API y web, el lint, la validación de Prisma y
las suites unitarias están en verde. Los fixtures heredados ya proporcionan un
`organizationId` explícito; el typecheck completo confirma el contrato
estricto. Antes del cierre formal sólo restan las integraciones con PostgreSQL,
el backfill controlado y la aceptación manual A/B. No se hará opcional el
tenant en los contratos de producción para ocultar esa deuda.
