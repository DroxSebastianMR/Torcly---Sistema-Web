# Plan de Implementación — Sprint 30

## 1. Módulos y Rutas de Taller a Adaptar

### A. Productos e Inventario

- `apps/web/src/features/products/`:
  - `pages/products-page.tsx`: Tabla de productos con estado activo/inactivo.
  - `pages/product-detail-page.tsx`: Ficha con datos de stock de solo lectura.
  - `components/product-form-modal.tsx`: Formulario de creación/edición de repuestos.
- `apps/web/src/features/inventory/`:
  - `pages/inventory-page.tsx`: Tabs de existencias, historial de movimientos y ajustes.
  - `components/movements-table.tsx`: Filas de movimientos de almacén.
- `apps/web/src/features/replenishment/`:
  - `pages/replenishment-page.tsx`: Recomendaciones automáticas generadas por IA.
  - `components/run-modal.tsx`: Modal de configuración de cobertura de stock.

### B. Comercial y Caja

- `apps/web/src/features/sales/`:
  - `pages/sales-page.tsx`: Registro de ventas, buscador de repuestos/servicios y líneas de venta.
  - `components/sale-form-modal.tsx`: Formulario de venta y confirmación.
- `apps/web/src/features/cash/`:
  - `pages/cash-page.tsx`: Tarjetas de estado de caja, historial de turnos y arqueos.
  - `components/payment-form-modal.tsx`: Modal de cobro mixto (efectivo, tarjeta, transferencia, billetera).
  - `components/cash-session-form-modal.tsx`: Modal de apertura y cierre de caja.
  - `components/compensation-form-modal.tsx`: Modal de compensación.

### C. Notificaciones y Novedades SaaS

- `apps/web/src/features/notifications/`:
  - `pages/notifications-page.tsx`: Full-width con `divide-y divide-border`.
  - `components/notification-card.tsx`: Mapeo condicional de colores según tema:
    - En modo claro: fondos `#E7F6EF`, `#FCEBFA`, `#EAF4FD`, `#FFF0F4`, `#FFFBE8`.
    - En modo oscuro: fondos `#10261D`, `#261325`, `#102234`, `#2B121B`, `#2B2310` con acentos de alto contraste.
  - `components/notifications-toolbar.tsx`: Píldoras de tiempo (`Todo`, `7d`, `30d`, `90d`).
- `apps/web/src/features/announcements/`:
  - `pages/announcements-feed-page.tsx`: Feed de publicaciones con pestañas de categorías.
  - `components/announcement-card.tsx`: Tarjeta de anuncio con tags de versión y video.
  - `components/announcement-detail-modal.tsx`: Modal de detalle con reproductor de video.

### D. Reportes y Analítica

- `apps/web/src/features/reports/`:
  - `pages/reports-page.tsx`: Indicadores de negocio y filtros por rango de fechas.
  - `components/bar-chart.tsx`:
    - Ejes `<XAxis stroke="hsl(var(--muted-foreground))" />`
    - Tooltip personalizado con `bg-popover text-popover-foreground border-border shadow-lg`.
    - Grilla `<CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />`

### E. Perfil de Usuario

- `apps/web/src/features/profile/`:
  - `pages/profile-page.tsx`: Tarjetas de información personal, cambio de contraseña, switches de preferencias y tarjeta interactiva de **Selección de Tema** (`Claro`, `Oscuro`, `Sistema`) con miniaturas visuales.

---

## 2. Verificación de Exclusión de Plataforma

- La consola administrativa `/plataforma` no sufre modificaciones de alcance en este sprint, asegurando foco absoluto en la productividad del taller.
