# Sprint 05 - Catálogo de productos

Rama: `feature/sprint-05-products`
Base: Sprint 04 aprobado
Historias: HU-15 a HU-18
Avance acumulado al aprobar: 18/92 = 19,57%

## Objetivo

Revalidar y endurecer el catálogo incorporado en `origin/main`, cerrar sus brechas de seguridad/pruebas y dejarlo aprobado para inventario.

## Entregables

- revisión del código ya existente y ajuste a la arquitectura aprobada;
- alta con código único, nombre, descripción, categoría, marca y precio;
- búsqueda por código, nombre y categoría;
- detalle y actualización sin alterar históricos futuros;
- desactivación sin borrado;
- administración reutilizable de categorías, marcas y unidades (alta, edición y activar/desactivar);
- entrada compatible con lector USB como teclado;
- permisos reales de servidor, auditoría, pruebas de integración y regresión;
- README de `products` en frontend y API.

## Fuera de alcance

Stock editable desde catálogo; existencias provienen exclusivamente de movimientos del Sprint 06.

## Implementación

### API

- Modelo Prisma `Product` endurecido; `AuditEventType` ampliado con `PRODUCT_CREATED`, `PRODUCT_UPDATED`, `PRODUCT_DEACTIVATED` y `PRODUCT_ACTIVATED` (migración `20260926140000_add_product_audit_events`).
- Módulo `apps/api/src/modules/products`: `GET/POST /api/v1/products`, `GET/PUT /api/v1/products/:id`, `PATCH /api/v1/products/:id/status`, permisos de servidor `products:read` / `products:write`, paginación y búsqueda combinable.
- Esquema estricto (`.strict()`): rechaza claves desconocidas (incluye `stock`/`inventoryMovements`); código normalizado a mayúsculas, precio finito no negativo y stock mínimo mayor que cero; `productUpdateSchema` = esquema de entrada (PUT total).
- Auditoría transaccional: `create`, `update` y `updateStatus` corren en `prisma.$transaction` registrando actor y contexto de la petición.
- Stock derivado de movimientos y de solo lectura en la respuesta; alerta `lowStock` cuando el nivel disponible no supera el mínimo.
- Productos desactivados se conservan para relaciones históricas y se excluyen de los listados activos.
- Catálogos administrables mediante `GET /products/catalog`, `PUT /products/categories|brands|units/:id` y `PATCH .../:id/status`; los inactivos se conservan para reactivación y no se ofrecen en altas nuevas.

### Web

- Ruta pública de catálogo `/productos` y ficha `/productos/:id` bajo `PermissionRoute products:read`.
- Acciones de escritura (registrar, catálogos, editar, activar/desactivar) gated por `products:write`; ocultas sin permiso en tabla, ficha y menú.
- Ficha de detalle (`product-detail-page.tsx`): datos comerciales, precio, stock de solo lectura («las existencias se administran desde Inventario»), edición y desactivación con diálogo de confirmación.
- Lectura USB: los campos de código y código de barras evitan el envío implícito con Enter (`stopImplicitSubmit`).
- Modal Catálogos: edición en línea y activación/desactivación de categorías, marcas y unidades, con estado visible.

## Verificación

- API: `prisma generate`, `tsc -b`, `eslint`, `vitest` — 17 unitárias/schemas + 6 integración (activable con `DATABASE_TESTS=true`), `format:check`.
- Web: `tsc -b`, `eslint`, `vitest` — 30 pruebas de la feature, `format:check`. Build verificado.
