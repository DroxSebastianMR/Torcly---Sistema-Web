# Plan de Implementación - Sprint 32

## 1. Backend (`apps/api`)

### Tarea 1.1: Soporte de Inspección / Checklist de Recepción
* **Archivo:** `apps/api/src/modules/work-orders/dto/create-work-order.dto.ts`
  * Añadir objeto opcional `receptionChecklist`:
    ```typescript
    receptionChecklist: z.object({
      fuelLevel: z.enum(['E', '1/4', '1/2', '3/4', 'F']).optional(),
      hasSpareTire: z.boolean().default(false),
      hasJackAndTools: z.boolean().default(false),
      hasVehicleDocuments: z.boolean().default(false),
      hasRadioFaceplate: z.boolean().default(false),
      externalDamageNotes: z.string().max(1000).optional(),
      photos: z.array(z.string().url()).optional(),
    }).optional()
    ```
* **Archivo:** `apps/api/src/modules/work-orders/work-orders.service.ts`
  * Guardar el checklist de recepción en el campo metadata o tabla relacionada de la orden de taller.

---

## 2. Frontend (`apps/web`)

### Tarea 2.1: Navegación por Pestañas (Tabs) en Taller
* **Archivo:** `apps/web/src/features/work-orders/pages/workshop-operations-page.tsx` (o unificación en `work-orders-page.tsx`)
  * Implementar barra de pestañas:
    * `[ Órdenes de trabajo ]` | `[ Citas programadas ]`
  * Sincronizar el estado de la pestaña activa con `useSearchParams` (`?tab=orders` vs `?tab=appointments`).
  * En la pestaña de Citas, el botón "Atender cita" abre el modal de creación de orden con los datos pre-rellenados y, tras el éxito, conmuta a `?tab=orders`.

### Tarea 2.2: Componente de Peritaje de Ingreso (Checklist y Fotos)
* **Archivo:** `apps/web/src/features/work-orders/components/reception-checklist-form.tsx`
  * Selector gráfico de nivel de combustible.
  * Checkboxes para: Llanta de repuesto, Gata y llaves, Documentos, etc.
  * Área de texto para observaciones de carrocería (rayones, golpes visibles).
  * Soporte de carga de URLs o archivos de fotos de ingreso.
* **Archivo:** `apps/web/src/features/work-orders/components/work-order-detail-modal.tsx`
  * Añadir pestaña o sección "Peritaje de Recepción" para visualizar el estado con el que ingresó el vehículo.

### Tarea 2.3: Corrección de Header (z-index) y Ocultar Compras/Proveedores
* **Archivo:** `apps/web/src/features/navigation/components/app-header.tsx`
  * Modificar `sticky top-0 z-10` a `sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b`.
* **Archivo:** `apps/web/src/features/dashboard/pages/dashboard-page.tsx`
  * Remover los `z-10` innecesarios en el banner y robot para que no colisionen con la barra superior al hacer scroll.
* **Archivo:** `apps/web/src/features/navigation/config/navigation-items.ts`
  * Comentar u ocultar temporalmente los ítems de "Compras" y "Proveedores" para la organización.
