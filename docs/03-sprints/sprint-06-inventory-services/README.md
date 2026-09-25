# Sprint 06 - Inventario y servicios

Rama: `feature/sprint-06-inventory-services`
Base: Sprint 05 aprobado
Historias: HU-19 a HU-24, HU-58 a HU-62
Avance acumulado al aprobar: 29/92 = 31,52%

## Objetivo

Cerrar el tramo 30-35% con inventario trazable y un catálogo de servicios reutilizable por citas, taller y ventas.

## Entregables

- stock derivado de movimientos confirmados, nunca editable directamente;
- stock inicial, entradas y salidas con cantidades válidas;
- transacción que impide stock negativo y duplicidad;
- stock mínimo, alertas e historial con fecha/usuario/origen;
- ajustes de inventario con signo explícito (ingreso/egreso);
- servicios con código único, descripción, precio y estado;
- búsqueda, actualización y desactivación sin alterar históricos;
- selector que expone solo servicios activos;
- permisos reales de servidor, auditoría, pruebas de integración y regresión;
- README de `inventory` y `services` en frontend y API.

## Fuera de alcance

Compras automáticas, ventas, citas, consumo por orden de trabajo, BI e IA. Se dejan contratos preparados, no simulaciones.

## Implementación

### API

- Modelo Prisma `Service` y 8 eventos de auditoría nuevos (`SERVICE_CREATED`, `SERVICE_UPDATED`, `SERVICE_DEACTIVATED`, `SERVICE_ACTIVATED`, `INVENTORY_STOCK_INITIALIZED`, `INVENTORY_ENTRY_REGISTERED`, `INVENTORY_EXIT_REGISTERED`, `INVENTORY_ADJUSTMENT_REGISTERED`), en las migraciones manuales `20260927120000_add_services_catalog` y `20260927130000_add_inventory_service_audit_events` (sin aplicar a la BD de desarrollo).
- Módulo `apps/api/src/modules/inventory`: `GET /inventory/existencia` y `GET /inventory/historial` (producto, tipo, periodo, paginación), `POST /inventory/stock-inicial|entradas|salidas|ajustes`, permisos de servidor `inventory:read` / `inventory:write`.
  - Concurrencia e idempotencia: dentro de la transacción, `pg_advisory_xact_lock` por producto; `idempotencyKey` único con replay (reintento devuelve el movimiento existente; clave distinta en conflicto responde 409 `INVENTORY_IDEMPOTENCY_CONFLICT`).
  - Reglas estrictas (`.strict()` en los esquemas exportados): cantidades positivas, stock inicial único por producto, salida/egreso que no superen el stock disponible, producto activo existente; respuesta 404/409 con códigos de dominio (`INSUFFICIENT_STOCK`, `PRODUCT_INACTIVE`, `NOT_FOUND`, etc.).
  - Cada movimiento persiste `performedById`, fecha, notas y referencia opcional (compra/venta/orden), con `stockAfter` en la auditoría transaccional.
- Módulo `apps/api/src/modules/services`: `GET /services`, `GET /services/options` (solo activos) y `GET /services/:id` con `services:read`; `POST /services`, `PUT /services/:id` y `PATCH /services/:id/status` con `services:write`. Código único normalizado a mayúsculas, precio no negativo, desactivación sin borrado y auditoría de todo el ciclo de vida.
- `ExistenceItem` expone `active` para que la web ofrezca solo productos activos al registrar movimientos.

### Web

- Ruta `/inventario` con permiso `inventory:read`; página con pestañas «Existencias» (resumen, búsqueda, alertas de stock bajo) y «Historial» (filtros por producto, tipo y periodo).
- Acciones de registro de stock inicial/entrada/salida/ajuste gated por `inventory:write`: modal con producto activo (vía existencias de `pageSize=100`), cantidad, signo para ajustes, guarda client-side contra stock insuficiente y genera `idempotencyKey` por intento.
- Ruta `/servicios` con permiso `services:read`; catálogo con búsqueda, filtro por estado y paginación; registro/edición y activar/desactivar gated por `services:write` con diálogo de confirmación.
- Ítem «Servicios» añadido al menú con icono `Wrench` y permiso `services:read`.

## Verificación

- API: `prisma validate`, `tsc -b`, `eslint`, `vitest` — 95 unitarias/schemas + 13 de integración (activables con `DATABASE_TESTS=true`), `format:check`, build.
- Web: `tsc -b`, `eslint`, `vitest` — 39 pruebas nuevas de las features (201 total), `format:check`. Build verificado.
