# Plan de Implementación - Sprint 31

## 1. Backend (`apps/api`)

### Tarea 1.1: Alta atómica de Cliente con Vehículo
* **Archivo:** `apps/api/src/modules/customers/dto/create-customer.dto.ts`
  * Extender el esquema Zod de creación de cliente para aceptar un objeto opcional `vehicle`:
    ```typescript
    vehicle: z.object({
      plate: z.string().min(3).max(10).trim(),
      brand: z.string().optional(),
      model: z.string().optional(),
      year: z.number().int().optional(),
      color: z.string().optional(),
      currentMileage: z.number().int().min(0).optional(),
    }).optional()
    ```
* **Archivo:** `apps/api/src/modules/customers/customers.service.ts`
  * En el método `createCustomer`, envolver la operación en `prisma.$transaction`:
    1. Crear el registro en `Customer`.
    2. Si `vehicle` está presente, crear el registro en `Vehicle` asociando `customerId: newCustomer.id` y `organizationId`.
    3. Retornar el cliente con su vehículo recién creado.

### Tarea 1.2: Endpoint de Historial Clínico Vehicular
* **Archivo:** `apps/api/src/modules/vehicles/vehicles.controller.ts` y `vehicles.service.ts`
  * Crear endpoint `GET /vehicles/:id/history` o `GET /vehicles/plate/:plate/history`.
  * Recopilar:
    * Datos base del vehículo y propietario.
    * Todas las `WorkOrder` cerradas (`ENTREGADA`) o activas asociadas al vehículo.
    * Por cada orden: fecha de ingreso, kilometraje de entrada, servicios ejecutados (`WorkOrderServiceItem`), repuestos utilizados (`WorkOrderItem` con nombre y cantidad), técnico asignado y monto total.

---

## 2. Frontend (`apps/web`)

### Tarea 2.1: Componente Reutilizable `<PageHeader />`
* **Archivo:** `apps/web/src/components/ui/page-header.tsx`
  * Props: `category` (string, ej: "GESTIÓN COMERCIAL"), `title` (string, ej: "Clientes"), `description` (string), `action` (ReactNode opcional para botones primarios).
  * Estructura idéntica al estándar de `sales-page.tsx`:
    ```tsx
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {category}
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-brand-forest sm:text-[2rem]">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {action && <div>{action}</div>}
    </header>
    ```

### Tarea 2.2: Modal de Cliente con Formulario de Vehículo
* **Archivo:** `apps/web/src/features/customers/components/customer-form-modal.tsx`
  * Añadir checkbox/switch con diseño Torcly: `¿Registrar vehículo ahora?`.
  * Si está activado, desplegar campos limpios con validación de placa.
  * Al enviar el formulario, propagar el payload completo al hook `useCreateCustomer`.

### Tarea 2.3: Vista de Historial Clínico Vehicular (Hoja de Vida)
* **Archivo:** `apps/web/src/features/vehicles/components/vehicle-history-modal.tsx` o nueva página `/vehiculos/:id/historial`.
  * Renderizar una línea de tiempo vertical con badges de fecha, kilometraje, mecánicos y lista de repuestos y servicios.
  * Botón para imprimir o descargar resumen en PDF/impresión amigable.
* **Archivo:** `apps/web/src/features/vehicles/components/vehicles-table.tsx`
  * En el menú de acciones de la tabla de vehículos, agregar la opción: `Ver historial clínico`.
