# Plan de Implementación — Sprint 29: Proveedores y Compras Integradas a Inventario

## 1. Arquitectura de Datos y Modelado

### A. Modelo de Proveedores (`Supplier`)

El modelo en PostgreSQL almacena tanto personas jurídicas (distribuidoras) como personas naturales:

- `id`: UUID (Primary Key).
- `organizationId`: Multi-tenancy isolation.
- `legalName`: Razón social o nombres completos (`VarChar(150)`).
- `documentNumber`: RUC de 11 dígitos o DNI de 8 dígitos (`VarChar(30)`).
- `contactName`: Nombre del asesor de ventas o contacto (`VarChar(100)`).
- `phone`: Teléfono o celular (`VarChar(30)`).
- `email`: Correo electrónico (`VarChar(254)`).
- `active`: Booleano para control de activación/desactivación.
- Restricción única: `@@unique([organizationId, documentNumber])`.

### B. Modelo de Compras (`Purchase` y `PurchaseLine`)

- `code`: Identificador secuencial por taller (`COM-0001`).
- `supplierId`: Clave foránea al proveedor.
- `status`: Enum `PurchaseStatus` (`DRAFT`, `RECEIVED`, `CANCELLED`).
- `externalRef`: Número de Factura, Boleta o Guía del proveedor (`VarChar(80)`).
- `purchaseDate`: Fecha de compra / emisión.
- `total`: Monto total de la orden (`Decimal(14, 2)`).
- `performedBy`, `receivedBy`, `receivedAt`, `cancelledBy`, `cancelledAt`.
- `lines`: Detalle de repuestos (`productId`, `quantity`, `unitCost`, `subtotal`).

---

## 2. Contratos de API REST

### Proveedores

- `GET /api/v1/suppliers`: Lista proveedores paginados con filtros `search`, `status`, `page`, `pageSize`.
- `GET /api/v1/suppliers/:id`: Obtiene el detalle de un proveedor.
- `POST /api/v1/suppliers`: Crea un nuevo proveedor (`legalName`, `documentNumber`, `contactName`, `phone`, `email`).
- `PUT /api/v1/suppliers/:id`: Actualiza datos comerciales del proveedor.
- `PATCH /api/v1/suppliers/:id/status`: Alterna estado activo/inactivo.

### Compras

- `GET /api/v1/purchases`: Lista compras con filtros por estado, proveedor, fecha y paginación.
- `GET /api/v1/purchases/:id`: Obtiene el detalle de la compra con sus líneas y movimientos de inventario.
- `POST /api/v1/purchases`: Registra una compra en estado `DRAFT`.
- `PUT /api/v1/purchases/:id`: Modifica una compra mientras permanezca en borrador.
- `POST /api/v1/purchases/:id/confirm`: Confirma la recepción física, eleva el stock en `Product` y genera el `InventoryMovement` `ENTRY`.
- `POST /api/v1/purchases/:id/cancel`: Cancela una compra no recibida.

---

## 3. Componentes Frontend (Web)

1. **Rutas y Navegación:**
   - Registro en `paths.ts`: `purchases: '/compras'`, `suppliers: '/proveedores'`.
   - Registro en `protected.routes.tsx` con lazy-loading.
   - Enlace en `app-navigation.ts` bajo la sección _"Catálogo y stock"_.
2. **Página de Compras (`/compras`):**
   - Métricas de cabecera: Inversión del mes, compras recibidas y borradores.
   - Tabla de compras con badge de estado, botones de acción (_Ver detalle_, _Editar_, _Confirmar recepción_).
3. **Página / Pestaña de Proveedores (`/proveedores`):**
   - Vista de directorio con búsqueda y tabla de proveedores, indicando RUC/DNI, contacto, teléfono, correo y switch de estado.
4. **Formularios Modales:**
   - `PurchaseFormModal`: Formulario de compra con `SmartSelect` de proveedores, `DatePicker` propio de Torcly, tabla dinámica de líneas con cálculo en vivo de totales.
   - `SupplierFormModal`: Formulario ágil para dar de alta proveedores con validación de documento (RUC 11 dígitos, DNI 8 dígitos).
   - `PurchaseDetailModal`: Vista de solo lectura del comprobante con detalle de repuestos y datos de recepción.

---

## 4. Reglas de Negocio e Integridad

1. **Unicidad de Documento de Proveedor:** No pueden coexistir dos proveedores con el mismo RUC o DNI dentro de la misma organización.
2. **Inmutabilidad tras Recepción:** Una compra en estado `RECEIVED` no puede ser editada ni eliminada. Solo puede ser consultada.
3. **Atomicidad de Inventario:** La confirmación de compra se ejecuta en una única transacción de Prisma: si falla el incremento de stock de algún producto, se revierte toda la operación.
4. **Actualización de Costo:** Al recepcionar, el `unitCost` de cada línea pasa a actualizar el campo `costPrice` en `Product`, asegurando valorización actualizada del inventario.
