# Products (web)

Catálogo de productos: alta, búsqueda combinable, ficha de detalle, actualización y desactivación sin borrado. Acepta código digitado o recibido desde un lector USB tipo teclado.

## Páginas y rutas

- `/productos` — listado con búsqueda (código, nombre, categoría), paginación, estado y acciones de escritura según permiso.
- `/productos/:id` — ficha de detalle: datos comerciales, precio, stock de solo lectura y acciones de edición/desactivación. Ruta protegida bajo `PermissionRoute` con `products:read`.

## Permisos

- `products:read` — ver listado y ficha.
- `products:write` — acciones «Registrar», catálogos, edición y activar/desactivar. Sin el permiso no se renderizan las acciones de escritura en tabla, ficha ni menú.

## Catálogos

El modal «Catálogos» administra categorías, marcas y unidades: permite crear, editar y activar/desactivar. No elimina registros, por lo que conserva las relaciones históricas de los productos. Los registros inactivos no se ofrecen al registrar productos nuevos, pero se mantienen visibles en el modal para reactivarlos.

## Stock de solo lectura

El stock proviene de inventory: se muestra como «Existencia disponible» en la ficha y como dato informativo en el modal de edición, siempre de solo lectura. El formulario envía únicamente datos comerciales; nunca el stock.

## Compatibilidad con lector USB

Los campos de código y código de barras evitan el envío implícito al presionar Enter (`stopImplicitSubmit`), de modo que un escáner tipo teclado puede escribir el código completo y la validación se dispara al enfocar el campo (RHF) en lugar de enviar el formulario a mitad de la lectura.

## Pruebas

- `services/products.service.test.ts` — contrato HTTP del servicio (list, get, create, update, status, opciones).
- `forms/product.schema.test.ts` — validación del formulario web.
- `pages/products-page.test.tsx` — listado, permisos, búsqueda, navegación y confirmación de desactivación.
- `pages/product-detail-page.test.tsx` — carga de ficha, datos, stock de solo lectura, edición y desactivación (con `useProductMutations` mockeado).
- `components/product-form-modal.test.tsx` — validaciones, normalización de código, payload correcto, Enter no envía y stock de solo lectura al editar.

Sprint propietario: 05.
