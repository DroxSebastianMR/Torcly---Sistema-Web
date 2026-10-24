# Purchases (API)

Gestión de proveedores y compras de productos existentes. Permite crear compras en borrador, editar líneas, confirmar recepción de inventario de forma trazable e idempotente, y cancelar borradores.

## Endpoints — Proveedores

- `GET /api/v1/purchases/suppliers` — lista con búsqueda y paginación. Permiso `purchases:read`.
- `GET /api/v1/purchases/suppliers/activos` — solo activos, para selectores. Permiso `purchases:read`.
- `GET /api/v1/purchases/suppliers/:id` — detalle. Permiso `purchases:read`.
- `POST /api/v1/purchases/suppliers` — crear proveedor. Permiso `purchases:write`.
- `PUT /api/v1/purchases/suppliers/:id` — actualizar proveedor. Permiso `purchases:write`.
- `PATCH /api/v1/purchases/suppliers/:id/status` — activar/desactivar. Permiso `purchases:write`.

## Endpoints — Compras

- `GET /api/v1/purchases` — lista con filtros por proveedor/estado/período. Permiso `purchases:read`.
- `GET /api/v1/purchases/:id` — detalle con líneas. Permiso `purchases:read`.
- `POST /api/v1/purchases` — crear borrador. Permiso `purchases:write`.
- `PUT /api/v1/purchases/:id` — actualizar borrador. Permiso `purchases:write`.
- `POST /api/v1/purchases/:id/receive` — confirmar recepción (idempotente por `requestId`). Permiso `purchases:write`.
- `POST /api/v1/purchases/:id/cancel` — cancelar borrador. Permiso `purchases:write`.

## Reglas

1. Total, subtotales y validaciones calculados exclusivamente en servidor.
2. Confirmar recepción es idempotente por `requestId`; usa advisory lock por compra y por producto.
3. Una recepción confirmada es inmutable: no se edita, no se borra, no se revierte.
4. Cancelar no revierte una recepción ya confirmada.
5. Proveedor inactivo no puede usarse en nuevas compras.
6. Cantidades hasta tres decimales (`DECIMAL(14,3)`); costos sin límite de decimales menor al centavo.

## Pruebas

- `tests/purchases.schemas.test.ts` — schemas Zod: strictness, mensajes, validación de decimales.
- `tests/purchases.rules.test.ts` — reglas de negocio: transiciones de estado, totales.
- `tests/purchases.integration.test.ts` — integración con PostgreSQL (gated con `DATABASE_TESTS=true`).

Sprint propietario: 17.
