# Plan de Implementación - Sprint 33

## 1. Backend (`apps/api`)

### Tarea 1.1: Endpoint de Confirmación de Venta con Pago Inmediato
* **Archivo:** `apps/api/src/modules/sales/sales.controller.ts` y `sales.service.ts`
  * Crear `POST /sales/:id/confirm-and-pay`:
    * Recibe en el body:
      ```typescript
      {
        paymentMethod: 'CASH' | 'YAPE' | 'CARD' | 'TRANSFER' | 'MIXED',
        amountPaid: number,
        cashChange?: number,
        notes?: string
      }
      ```
    * Ejecutar dentro de `prisma.$transaction`:
      1. Validar stock suficiente de productos y reducir inventario.
      2. Cambiar estado de la venta a `CONFIRMED`.
      3. Verificar si el usuario tiene una `CashSession` abierta (`OPEN`). Si no hay caja abierta, arrojar error descriptivo.
      4. Crear el registro en `Payment` con `status = PAID`, asociándolo a la venta y a la sesión de caja activa.
      5. Retornar la venta actualizada con el recibo de pago.

### Tarea 1.2: Módulo de Cotizaciones y Presupuestos (Backend)
* **Archivo:** `apps/api/src/modules/quotations/`
  * Crear modelo Prisma `Quotation` y `QuotationItem` (o JSON metadata si no se desea migración compleja de inmediato).
  * Endpoints REST:
    * `GET /quotations`: Listado paginado con filtros.
    * `POST /quotations`: Crear proforma borrador.
    * `PUT /quotations/:id`: Actualizar cotización.
    * `POST /quotations/:id/convert-to-order`: Valida la cotización y genera la `WorkOrder` correspondiente.

---

## 2. Frontend (`apps/web`)

### Tarea 2.1: Diálogo de Pago en Ventas (`SalePaymentModal`)
* **Archivo:** `apps/web/src/features/sales/components/sale-payment-modal.tsx`
  * Modal limpio con resumen de venta (Total S/).
  * Botones rápidos de método de pago: `[ Efectivo ]`, `[ Yape / Plin ]`, `[ POS / Tarjeta ]`, `[ Transferencia ]`.
  * Si es Efectivo: input numérico con montos sugeridos rápidos (ej: billetes de S/ 50, S/ 100, S/ 200) y cálculo automático:  
    `Vuelto = Monto Recibido - Total`.
  * Botón principal: *"Cobrar y Finalizar Venta"*.
  * Botón secundario: *"Venta al Crédito (Cobro pendiente en caja)"*.

### Tarea 2.2: Módulo Frontend de Cotizaciones
* **Ruta:** `/cotizaciones` en `apps/web/src/features/quotations/`
  * `pages/quotations-page.tsx`: Lista de presupuestos con toolbar, filtros por estado y buscador.
  * `components/quotation-form-modal.tsx`: Modal para seleccionar cliente, vehículo y agregar filas de repuestos y mano de obra.
  * `components/quotations-table.tsx`: Tabla con badges de estado (`BORRADOR`, `ENVIADA`, `APROBADA`).
  * Integración de botón WhatsApp: Genera enlace `https://wa.me/51.../?text=...` con el detalle del presupuesto para enviarlo al cliente en un toque.
