# Sprint 32: Operaciones de Taller Unificadas (Citas y Órdenes en Tabs) + Peritaje Digital de Recepción

## 1. Información General
* **Asignado:** Desarrollador 2 (Dev 2)
* **Rama Base:** `team/develop`
* **Rama Feature:** `feature/sprint-32-operaciones-checklist-recepcion`
* **Estado:** Planificado / Listo para desarrollo

---

## 2. Objetivos del Negocio
1. **Unificar Taller en Pestañas (Tabs):** Permitir al recepcionista y al jefe de taller alternar entre la gestión de **Órdenes de Taller** (aforo, órdenes activas, entregadas) y la **Agenda de Citas** en una sola vista con pestañas inmediatas, sin buscar módulos dispersos en el menú.
2. **Peritaje Digital de Ingreso (Check-in con Daños y Fotos):** Registrar formalmente el estado del auto al ingresar (combustible, checklist de accesorios, pertenencias y fotos de carrocería) para evitar quejas falsas de clientes.
3. **Flujo Ágil Cita → Orden:** Convertir una cita confirmada en orden de trabajo con 1 clic y conmutar suavemente a la pestaña de órdenes.
4. **Corrección de UI en Dashboard y Header:** Solucionar el solapamiento de scroll entre el `AppHeader` y el banner del Dashboard. Ocultar temporalmente Compras y Proveedores en la navegación.

---

## 3. Historias de Usuario

### HU-32.1: Navegación de Taller por Pestañas (Tabs)
**Como** recepcionista de taller,  
**quiero** tener en una sola pantalla las pestañas de "Órdenes de trabajo" y "Citas programadas",  
**para** gestionar el patio y la agenda sin navegar por menús laterales separados.

* **Criterios de Aceptación:**
  * En la vista de Operaciones de Taller, selector superior de Tabs:
    * **Tab 1: Órdenes de Taller** (Aforo de patio en vivo, filtros de fecha/hoy, tabla de órdenes).
    * **Tab 2: Citas** (Agenda de citas, estado de confirmación, calendario/lista).
  * URL sincronizada con parámetro query o subruta (ej: `?tab=citas` o `?tab=ordenes`).

### HU-32.2: Peritaje Digital & Checklist de Ingreso
**Como** asesor de servicio,  
**quiero** llenar una ficha rápida de recepción al crear la orden de trabajo,  
**para** dejar constancia del nivel de combustible, inventario del auto y rayones preexistentes.

* **Criterios de Aceptación:**
  * Selector visual de nivel de combustible (1/4, 1/2, 3/4, Full).
  * Checklist de accesorios: Llanta de repuesto, gata y palanca, radio/panel, documentos del vehículo, herramientas.
  * Notas de daños de carrocería (rayones, golpes) con opción de adjuntar fotos de ingreso.
  * La ficha de inspección queda adjunta a la orden y se visualiza en su detalle.

### HU-32.3: Corrección de Header y Ocultamiento de Compras/Proveedores
**Como** usuario del sistema,  
**quiero** que al scrollear en el Dashboard el texto y las imágenes pasen limpiamente por debajo de la cabecera superior,  
**y** no ver en el menú lateral los módulos de Compras y Proveedores mientras no estén en uso por la organización.

---

## 4. Archivos Asignados y Límites de Código (Cero Conflictos)
* **Backend (`apps/api/`):**
  * `apps/api/src/modules/work-orders/` (soporte para campos o relación de `inspection` de ingreso).
  * `apps/api/src/modules/appointments/` (transición cita a orden).
* **Frontend (`apps/web/`):**
  * `apps/web/src/features/work-orders/` (componente tabs, formulario de peritaje de ingreso, detalle de inspección).
  * `apps/web/src/features/appointments/` (integración con el cambio de tab a órdenes).
  * `apps/web/src/features/navigation/` (`app-header.tsx` - corrección de z-index, `navigation-items.ts` - ocultar compras y proveedores).
  * `apps/web/src/features/dashboard/pages/dashboard-page.tsx` (revisión de z-index de cabecera y aplicación de `<PageHeader />`).
