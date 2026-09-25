# Sprint 07 — Ventas

Rama: `feature/sprint-07-sales`
Base: Sprint 06 aprobado
Historias: HU-25 a HU-30
Avance acumulado al aprobar: 35/92 = 38,04%

## Estado

**Aprobado por el usuario.** Prueba manual completada y cierre autorizado; queda pendiente únicamente el push si se solicita.

## Objetivo

Permitir registrar y confirmar ventas de productos y servicios sin perder la trazabilidad de precios, cliente, existencias ni responsable de la operación.

## Historias incluidas

| Historia | Resultado esperado                                                 |
| -------- | ------------------------------------------------------------------ |
| HU-25    | Crear una venta y asociar un cliente de forma opcional.            |
| HU-26    | Agregar productos con cantidad válida y existencia suficiente.     |
| HU-27    | Agregar servicios activos a la venta.                              |
| HU-28    | Modificar o quitar líneas y recalcular los importes.               |
| HU-29    | Confirmar la venta y registrar la salida automática de inventario. |
| HU-30    | Consultar listado y detalle de ventas.                             |

## Fuera de alcance

- Pagos, saldo pendiente, comprobantes fiscales, devoluciones, descuentos, crédito y caja.
- Consumo de piezas desde una operación de taller; pertenece a los Sprints 09 y 10.
- Reportes, KPIs y recomendaciones; requieren datos de ventas confirmadas y pertenecen a los Sprints 12 a 14.

## Implementación

### API

- Modelos Prisma `Sale` y `SaleLine` con enums `SaleStatus` (DRAFT/CONFIRMED) y `SaleLineType` (PRODUCT/SERVICE); relaciones con `Customer`, `Product` y `Service`; eventos de auditoría `SALE_CREATED` y `SALE_CONFIRMED`. Migraciones manuales `20260928120000_add_sales` y `20260928130000_add_sale_audit_events` (sin aplicar a la BD de desarrollo). Seed con permiso `sales:write`.
- Módulo `apps/api/src/modules/sales`, montado en `/sales`: `GET /sales` (búsqueda por código/cliente/documento, filtro por estado, paginación), `GET /sales/catalogo` (productos activos con stock + servicios activos), `GET /sales/:id`, `POST /sales`, `PUT /sales/:id` y `POST /sales/:id/confirm`. Permisos de servidor `sales:read` / `sales:write`.
- Reglas de dominio: código único `VENTA-######` por secuencia `sales_code_seq`; venta opcionalmente sin cliente; líneas solo de producto activo con existencia suficiente o servicio activo; cada línea conserva nombre, código, unidad y precio (precios congelados); editar líneas recalcula subtotal y total.
- Confirmación transaccional: valida stock en servidor, bloquea la venta y cada producto (`torcly:sale:<id>`, `torcly:inventory:<id>`), y registra una salida exacta por producto con `idempotencyKey` `sale-exit:<venta>:<producto>` y auditoría `INVENTORY_EXIT_REGISTERED`. Es idempotente: reconfirmar no duplica salidas ni auditoría. Una venta confirmada es de solo lectura (409 `SALE_READONLY`).
- Errores de dominio: 404 `SALE_NOT_FOUND`, `PRODUCT_NOT_FOUND`, `SERVICE_NOT_FOUND`, `CUSTOMER_NOT_FOUND`; 400 `SALE_NO_LINES`, `SALE_INVALID_LINE`; 409 `PRODUCT_INACTIVE`, `SERVICE_INACTIVE`, `INSUFFICIENT_STOCK`, `SALE_REFERENCE_INVALID`, `SALE_DUPLICATE_CODE`.

### Web

- Ruta `/ventas` con permiso `sales:read`; página con resumen (total, borradores y confirmadas de la página), búsqueda por código/cliente/documento, filtro por estado, tabla y tarjetas responsive, paginación, estados vacíos, carga y error con reintento.
- Acciones de nueva venta/edición gated por `sales:write`: modal con cliente opcional (SmartSelect con «Venta sin cliente»), selector de productos (solo con stock) con cantidad y rechazo temprano de stock insuficiente, selector de servicios y resumen de subtotal y total.
- Ficha de detalle modal con cliente, responsable, fechas, líneas con precios congelados e importes, y acción «Editar venta» solo en borradores con permiso de escritura.
- Confirmación de venta desde el formulario (guardar + confirmar); los hooks invalidan listado y detalle tras cada mutación.
- README de la feature en `apps/web/src/features/sales/README.md`.

## Verificación

- API: `prisma validate`, `tsc -b`, `eslint`, `vitest` — 121 pasadas + 52 aplazadas de integración (activables con `DATABASE_TESTS=true`) en 26 archivos.
- Web: `tsc -b`, `eslint`, `vitest` — 49 archivos y 225 pruebas, build verificado.

## Cierre

El Sprint 07 está aprobado y cerrado. El porcentaje acumulado es 35/92 = 38,04%. El push permanece pendiente de solicitud expresa.
