# Products (API)

Catálogo maestro de repuestos. Gestiona código único, datos comerciales (nombre, descripción, categoría, marca, unidad, precio de venta), stock mínimo y estado activo/inactivo. La desactivación conserva el producto para relaciones históricas (no es un borrado).

No calcula ni modifica existencias: el stock es responsabilidad de inventory (Sprint 06) y nunca llega al payload del módulo.

## Endpoints

- `GET /api/v1/products` — listado con búsqueda combinable (código, nombre, categoría) y paginación. Permiso `products:read`.
- `GET /api/v1/products/:id` — ficha de detalle. Permiso `products:read`.
- `POST /api/v1/products` — alta. Permiso `products:write`.
- `PUT /api/v1/products/:id` — actualización (payload total, validado con el mismo esquema estricto). Permiso `products:write`.
- `PATCH /api/v1/products/:id/status` — activar/desactivar. Permiso `products:write`.
- `GET /api/v1/products/catalog` — categorías, marcas y unidades, incluidas las inactivas, para administración. Permiso `products:write`.
- `PUT /api/v1/products/categories|brands|units/:id` — editar un registro de catálogo. Las unidades incluyen `name` y `symbol`. Permiso `products:write`.
- `PATCH /api/v1/products/categories|brands|units/:id/status` — activar o desactivar sin borrar datos asociados. Permiso `products:write`.

## Validaciones (servidor)

- Esquema estricto (`.strict()`): se rechazan claves desconocidas como `stock` o `inventoryMovements`.
- Código único, nombre obligatorio, categoría obligatoria, precio finito en `[0, 9_999_999_999]` y stock mínimo mayor que cero.
- La actualización usa `productUpdateSchema` (PUT total), coherente con el formulario web que siempre envía todos los campos.

## Auditoría

`AuditEventType` ampliado con `PRODUCT_CREATED`, `PRODUCT_UPDATED`, `PRODUCT_DEACTIVATED` y `PRODUCT_ACTIVATED`. `create`, `update` y `updateStatus` corren en transacción con `prisma.$transaction` y escriben el `auditLog` con actor (`request.auth.id`) y contexto de solicitud (`getRequestContext`) en el mismo commit que la mutación. Migración punzante: `20260926140000_add_product_audit_events`.

## Pruebas

- Unitarias de esquemas (`tests/products.schemas.test.ts`): strictness, campos obligatorios, mensajes en español, `productUpdateSchema`.
- Unitarias de service (`tests/products.service.test.ts`): stock derivado de movimientos, alerta de stock bajo, alta/actualización/cambio de estado con auditoría (actor y contexto), errores accionables (código `P2010`, catálogo inválido, inexistente), detalle con stock de solo lectura y CRUD de opciones de catálogo.
- Integración (`tests/products.integration.test.ts`): se ejecutan solo con `DATABASE_TESTS=true` (crean/limpian datos reales de la BD).

Sprint propietario: 05.
