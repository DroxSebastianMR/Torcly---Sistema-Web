# Sprint 33: Ventas con Cobro Inmediato + Cotizaciones y Presupuestos (Proformas)

## 1. Información General
* **Asignado:** Desarrollador 3 (Dev 3)
* **Rama Base:** `team/develop`
* **Rama Feature:** `feature/sprint-33-ventas-cobro-cotizaciones`
* **Estado:** Planificado / Listo para desarrollo

---

## 2. Objetivos del Negocio
1. **Cobro Inmediato en Mostrador (Venta Rápida):** Permitir que al confirmar una venta en el punto de venta de repuestos o lubricantes se cobre directamente en el modal (Efectivo con cálculo de vuelto, Yape/Plin, Tarjeta o Mixto), registrando el ingreso en la sesión de caja abierta y marcando la venta como `PAID` al instante, sin obligar al usuario a ir a Caja.
2. **Módulo de Cotizaciones y Presupuestos (Pre-Orden):** Permitir elaborar proformas para clientes que solicitan un presupuesto formal antes de autorizar el trabajo.
3. **Conversión 1-Clic a WhatsApp y a Orden:** Compartir presupuestos formateados directamente por WhatsApp y, tras la aprobación del cliente, convertirlos en una Orden de Taller con un solo clic.

---

## 3. Historias de Usuario

### HU-33.1: Modal de Pago Inmediato en Ventas
**Como** vendedor de mostrador de repuestos,  
**quiero** cobrar la venta en el mismo momento en que la confirmo,  
**para** no tener que ir al módulo de Caja a buscarla como pendiente.

* **Criterios de Aceptación:**
  * Al hacer clic en "Confirmar venta", se abre el diálogo de pago `SalePaymentModal`.
  * Muestra el total a pagar en S/.
  * Selector de Método de Pago: Efectivo, Yape/Plin, Tarjeta, Transferencia, Pago Mixto.
  * Si es Efectivo: Campo "Monto recibido" y cálculo en tiempo real de "Vuelto a entregar".
  * Al confirmar con pago: La venta pasa a estado `CONFIRMED` y `PAID`, y se registra el movimiento de ingreso en la `CashSession` activa.
  * Opción alternativa: *"Dejar como cobro pendiente (Crédito)"* para enviarlo a Caja.

### HU-33.2: Creación y Gestión de Cotizaciones / Presupuestos
**Como** asesor comercial del taller,  
**quiero** elaborar presupuestos con repuestos y servicios sin alterar el inventario ni crear órdenes prematuras,  
**para** presentar una cotización formal al cliente.

* **Criterios de Aceptación:**
  * Módulo de Cotizaciones (`/cotizaciones`): Lista de presupuestos con estados (`BORRADOR`, `ENVIADA`, `APROBADA`, `VENCIDA`).
  * Formulario de presupuesto: Selección de cliente, vehículo (o placa tentativa), lista de repuestos presupuestados y mano de obra con fecha de vigencia.

### HU-33.3: Compartir por WhatsApp y Conversión a Orden
**Como** asesor comercial,  
**quiero** enviar el presupuesto por WhatsApp con un mensaje prearmado y convertirlo a orden de trabajo cuando el cliente acepte,  
**para** acelerar el cierre comercial del servicio.

* **Criterios de Aceptación:**
  * Botón *"Enviar por WhatsApp"*: Abre `wa.me` con el texto formateado: resumen de repuestos, mano de obra, total en S/ y vigencia.
  * Botón *"Aprobar y convertir a Orden"*: Crea automáticamente la Orden de Taller con los repuestos y servicios del presupuesto, cambiando el estado de la cotización a `APROBADA`.

---

## 4. Archivos Asignados y Límites de Código (Cero Conflictos)
* **Backend (`apps/api/`):**
  * `apps/api/src/modules/sales/` (endpoint `POST /sales/:id/confirm-with-payment`).
  * `apps/api/src/modules/cash/` (método reutilizable para asociar pago de venta directa a la sesión activa).
  * `apps/api/src/modules/quotations/` (nuevo módulo de cotizaciones: controller, service, dto, Prisma schema).
* **Frontend (`apps/web/`):**
  * `apps/web/src/features/sales/components/sale-payment-modal.tsx` (modal de cobro y vuelto).
  * `apps/web/src/features/sales/hooks/use-sales.ts` (mutación de cobro rápido).
  * `apps/web/src/features/quotations/` (nuevo módulo: componentes, hooks, páginas, servicios).
