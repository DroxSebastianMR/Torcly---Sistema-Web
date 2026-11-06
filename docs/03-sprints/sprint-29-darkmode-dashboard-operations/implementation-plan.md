# Plan de Implementación — Sprint 29

## 1. Componentes del Shell a Adaptar

### `apps/web/src/layouts/app/app-layout.tsx` y `app-header.tsx`

- Reemplazar cualquier fondo blanco rígido (`bg-white`) por clases semánticas de Tailwind:
  - `bg-background` para el viewport general.
  - `bg-card` y `border-border` para barras y tarjetas.
- Agregar componente `ThemeToggle` al lado del avatar de usuario o de la campana:
  ```tsx
  <Button
    variant="ghost"
    size="sm"
    onClick={toggleTheme}
    aria-label="Alternar tema visual"
    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
  >
    {resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
  </Button>
  ```
- **Popover de Notificaciones (`notification-summary-popover.tsx`):**
  - Contenedor con `bg-popover border-border shadow-xl`.
  - Pestañas de categorías con borde activo `border-primary` y texto legible.
  - Lista de avisos con `divide-border/50` y hover sutil `hover:bg-muted/50`.

---

## 2. Adaptación de Módulos Operativos

### A. Dashboard (`apps/web/src/features/dashboard/`)

- Adaptar `dashboard-page.tsx` y widgets diarios.
- Tarjetas de KPIs: fondo `bg-card`, números en `text-foreground`, subtítulos en `text-muted-foreground`.

### B. Órdenes de Taller (`apps/web/src/features/work-orders/`)

- `work-orders-page.tsx`:
  - Barra de herramientas con `SmartSelect` de clientes/vehículos y buscador.
  - Tabla de órdenes con filas `hover:bg-muted/40`.
  - Badges de estado de orden con contraste equilibrado en fondo oscuro:
    - Pendiente: amarillo suave (`#3D3012` texto `#E5B84B`).
    - En Proceso: azul suave (`#152B3C` texto `#5AA0E0`).
    - Lista para entrega: verde esmeralda (`#133827` texto `#42C288`).
    - Entregada: gris atenuado (`#252E2B` texto `#97A8A2`).
- Modales:
  - `work-order-form-modal.tsx`
  - `work-order-consumption-modal.tsx`
  - `work-order-return-modal.tsx`

### C. Citas (`apps/web/src/features/appointments/`)

- `appointments-page.tsx`:
  - Grid de horarios disponibles y ocupados con bordes definidos.
  - Modal de cita `appointment-form-modal.tsx`.

### D. Clientes y Vehículos (`apps/web/src/features/customers/`, `apps/web/src/features/vehicles/`)

- Tablas paginadas `DataTable` con encabezados de columna contrastados.
- Fichas de detalle (`customer-detail-page.tsx`, `vehicle-detail-page.tsx`) con pestañas y tarjetas de datos de solo lectura adaptadas a `bg-card border-border`.

---

## 3. Controles Reutilizables a Nivel UI

- `apps/web/src/components/ui/modal.tsx`: Fondo del modal en `bg-card`, backdrop oscuro semitransparente `bg-black/70`.
- `apps/web/src/components/ui/smart-select.tsx`: Opciones desplegables en `bg-popover text-popover-foreground`.
- `apps/web/src/components/ui/date-picker.tsx`: Calendario flotante con números legibles y días seleccionados en `bg-primary`.
