# Sprint 29 — Proveedores y Compras Integradas a Inventario

## 1. Contexto y Objetivos

En la operación diaria de un taller mecánico automotriz, el aprovisionamiento de repuestos, lubricantes, filtros y consumibles representa uno de los pilares críticos para la rentabilidad y la continuidad de las órdenes de trabajo.

Actualmente:

- El taller necesita gestionar un directorio formal de **Proveedores** (distribuidoras mayoristas, importadoras de autopartes, servicios especializados externos como tornos o rectificadoras, y compras locales menores).
- El módulo de **Compras** debe estar plenamente articulado con la navegación oficial de Torcly (`/compras` y `/proveedores`), permitiendo registrar órdenes de compra con su respectivo comprobante tributario o comercial (Factura, Boleta, Guía de Remisión).
- El vínculo con **Inventario** debe ser automático y transaccional (ACID): al confirmar la recepción física de un pedido, el stock de cada repuesto debe incrementarse al instante, generarse el movimiento inmutable de kardex (`InventoryMovement` de tipo `ENTRY`) y actualizarse el costo unitario de reposición en el catálogo.

El objetivo del **Sprint 29** es implementar el flujo integral de **Proveedores y Compras**, abarcando su arquitectura relacional, contratos de API REST, reglas contables y de almacén, vistas completas de interfaz y sincronización directa con el catálogo de productos.

---

## 2. Alcance Funcional

### A. Catálogo y Directorio de Proveedores (`/proveedores`)

- **Diferenciación de Tipo de Proveedor:**
  - **Persona Jurídica (Empresas y Distribuidoras):** RUC de 11 dígitos (iniciados en 20 o 10), Razón Social oficial (`legalName`), Nombre Comercial (`tradeName`), Dirección fiscal y ciudad.
  - **Persona Natural con Negocio o Técnico Externo:** DNI de 8 dígitos o RUC 10, Nombres y Apellidos completos.
- **Datos de Contacto y Operación:**
  - Persona de contacto / Asesor comercial (`contactName`).
  - Teléfono o WhatsApp directo de pedidos (`phone`).
  - Correo electrónico para cotizaciones y órdenes de compra (`email`).
  - Estado de operación: `Activo` / `Inactivo` para inhabilitar proveedores suspendidos.
- **Búsqueda y Filtros:** Búsqueda en tiempo real por Razón Social, RUC/DNI o Nombre Comercial, y filtrado por estado.

### B. Módulo de Gestión de Compras (`/compras`)

- **Navegación e Integración al Sistema:**
  - Alta en el menú lateral principal de navegación (`app-navigation.ts`) bajo la sección de aprovisionamiento/catálogo.
  - Protección de rutas con permisos RBAC (`purchases:read`, `purchases:write`).
- **Métricas Operativas del Mes:**
  - Compras recibidas del mes actual (conteo y monto total en soles `S/`).
  - Compras en borrador pendientes de recepción.
  - Proveedores activos con compras registradas.
- **Listado y Filtros:**
  - Tabla de compras con código secuencial (ej. `COM-0001`), proveedor, comprobante externo, fecha de emisión, total y estado (`DRAFT`, `RECEIVED`, `CANCELLED`).
  - Filtro por estado y buscador por proveedor, código o número de factura.

### C. Registro y Edición de Compra (`PurchaseFormModal`)

- **Selección de Proveedor:** Selector dinámico con buscador (`SmartSelect`), con acceso directo para crear un proveedor nuevo sin abandonar el formulario de compra.
- **Fecha de Compra:** Integración con el componente oficial `DatePicker` de Torcly.
- **Comprobante y Referencia:** Tipo de comprobante (Factura / Boleta / Guía de Remisión) y serie-número correlativo (`externalRef`).
- **Líneas de Detalle de Repuestos:**
  - Selección de producto del catálogo existente.
  - Cantidad con soporte de hasta 3 decimales (para unidades como litros de aceite, grasa o metros de manguera).
  - Costo unitario de compra (`unitCost`).
  - Cálculo automático del subtotal por línea y total consolidado de la compra.
- **Observaciones o Notas de Entrega:** Campo opcional para condiciones de entrega o almacén.

### D. Recepción Atómica y Entrada Directa a Inventario

- Botón de acción **`[Confirmar y Recepcionar]`**:
  - Diálogo de confirmación `ConfirmationDialog` informando que la mercadería será ingresada inmediatamente al almacén.
  - **Ejecución en Transacción Única:**
    1. Actualiza el estado de la compra a `RECEIVED`, registrando `receivedBy` y `receivedAt`.
    2. Registra un movimiento inmutable en `InventoryMovement` (`type: 'ENTRY'`, `status: 'CONFIRMED'`, `referenceType: 'purchase'`, `referenceId: purchase.id`).
    3. Incrementa el stock físico de cada producto en la tabla `Product`.
    4. **Actualiza el costo de catálogo (`costPrice`):** Garantiza que las órdenes de taller y ventas calculen márgenes reales basados en el último costo de compra.
    5. Dispara notificación interna a los usuarios con permisos de inventario (`PURCHASE_RECEIVED`).

---

## 3. Entregables

1. **Documentación:**
   - `README.md`: Resumen y especificaciones del sprint.
   - `implementation-plan.md`: Arquitectura, endpoints API y componentes visuales.
   - `acceptance-and-test-plan.md`: Criterios de aceptación y casos de prueba automatizados.
   - `approval.md`: Acta de verificación de entrega.
2. **Backend API:**
   - Rutas y controladores para Proveedores (`/suppliers`) y Compras (`/purchases`).
   - Sincronización transaccional con inventario y actualización de costos de compra.
   - Pruebas unitarias de schemas y servicios en `@torcly/api`.
3. **Frontend Web:**
   - Páginas y vistas `/compras` y `/proveedores` conectadas al enrutador y sidebar.
   - Modales de creación/edición de proveedores y órdenes de compra con estándares Torcly (sin iconos superiores, DatePicker custom, sin barras grises nativas).
   - Pruebas de componentes y flujos de usuario en `@torcly/web`.
