# Acta de Aprobación y Verificación - Sprint 33

> **Torcly SaaS · Sprint 33: Ventas con Cobro Inmediato + Cotizaciones y Presupuestos (Proformas)**  
> **Fecha de Cierre:** 09 de noviembre de 2026  
> **Responsables:** Usuario (Lead Developer) + Antigravity (Pair Programming)  
> **Rama:** `feature/sprint-33-ventas-cobro-cotizaciones`  
> **Rama Base:** `team/develop`

---

## 1. Resumen de Entrega y Alcance Cumplido

Se implementaron con éxito todos los requerimientos y mejoras acordados para este sprint:

1. **Flujo de Ventas con Cobro Inmediato en Mostrador (`POST /sales/:id/confirm-and-pay`):**
   - Sustitución del flujo anterior de duplicidad donde toda venta generaba una deuda pendiente en caja.
   - Al hacer clic en _"Confirmar venta"_, se abre el nuevo modal `SalePaymentModal` permitiendo elegir el método de pago directo:
     - **Efectivo (`CASH`)**: con chips de billetes sugeridos (`Exacto`, `S/ 20`, `S/ 50`, `S/ 100`, `S/ 200`), cálculo automático y en tiempo real del vuelto a entregar y validación de efectivo suficiente.
     - **Billetera Digital (`DIGITAL_WALLET`)**: para cobros inmediatos con Yape / Plin.
     - **Tarjeta (`CARD`)**: con débito o crédito directo.
     - **Transferencia Bancaria (`TRANSFER`)**: para transferencias interbancarias directas.
     - **Pago Mixto (`MIXED`)**: desglose en dos métodos combinados verificando que la suma coincida exactamente con el total.
   - Registro atómico del pago en la tabla `payments` vinculado a la sesión de caja activa (`CashSession`), descontando inventario en la misma transacción Prisma `$transaction`.
   - Opción explícita en el modal: _"Dejar pendiente (Crédito)"_ para mantener compatibilidad con cobros diferidos o pendientes en el módulo de caja.

2. **Módulo Completo de Cotizaciones y Presupuestos / Proformas (`/cotizaciones`):**
   - Nuevo modelo de base de datos en Supabase PostgreSQL: `Quotation` y `QuotationItem` con estados `DRAFT`, `SENT`, `APPROVED`, `EXPIRED`, `REJECTED`, migración aplicada `20261109010000_add_quotations`.
   - Módulo backend en `apps/api/src/modules/quotations/` con validación Zod, reglas de negocio de multi-tenancy, repositorio y controlador.
   - Módulo frontend en `apps/web/src/features/quotations/` con filtros por estado, búsqueda en vivo, tabla interactiva, métricas operativas y modales de creación/detalle.
   - **Compartir por WhatsApp**: Botón directo con enlace `https://wa.me/51...` preformateado con mensaje comercial formal detallando número de proforma, cliente, vehículo, total e instrucciones.
   - **Conversión a Orden de Taller en 1 Clic (`POST /quotations/:id/convert-to-order`)**: Genera correlativo oficial `OT-XXXXXX`, migra las líneas a `work_order_lines`, actualiza el estado de la cotización a `APPROVED` y enlaza el `workOrderId`.

3. **Optimización de Navegación y Estandarización Visual:**
   - Módulos de "Compras" y "Proveedores" configurados como `visible: false` en `app-navigation.ts` para simplificar la interfaz sin eliminar su lógica existente.
   - Creación del componente reutilizable `@/components/ui/page-header.tsx` con el estándar de tipografía, alturas y espaciado de Ventas (`text-brand-forest`, subtítulo muted y contenedor de acciones).
   - Estandarización aplicada a la cabecera de Ventas y Cotizaciones.

---

## 2. Verificación de Definition of Done (DoD)

| Criterio                                                              |   Estado    | Evidencia                                                                                                             |
| :-------------------------------------------------------------------- | :---------: | :-------------------------------------------------------------------------------------------------------------------- |
| **Typecheck Monorepo (`pnpm -r typecheck`)**                          | ✅ Aprobado | 0 errores en `apps/api` y `apps/web`.                                                                                 |
| **Tests Unitarios & Integración Backend (`pnpm --filter api test`)**  | ✅ Aprobado | 62 archivos de prueba aprobados (494 tests pasando, 0 fallos).                                                        |
| **Tests Unitarios & Integración Frontend (`pnpm --filter web test`)** | ✅ Aprobado | 104 archivos de prueba aprobados (496 tests pasando, 0 fallos).                                                       |
| **Aislamiento de Código**                                             | ✅ Aprobado | No se alteraron módulos de clientes ni vehículos asignados a Sprint 31, ni órdenes/citas de Sprint 32.                |
| **Documentación Formal Completa**                                     | ✅ Aprobado | `README.md`, `implementation-plan.md`, `acceptance-and-test-plan.md`, `approval.md` y `README.md` de módulos creados. |

---

## 3. Estado del Sprint

**ESTADO:** `LISTO PARA MERGE A team/develop`
