# Sprint 30 — Modo Oscuro Parte 3: Catálogo, Stock, Finanzas, Reportes y Centro de Avisos de Taller

- **Rama base:** `feature/reponsive-ui`
- **Rama de trabajo:** `feature/darkmode-part-3-catalog-finance-notifs`
- **Estado:** Planificado (Documentación lista)
- **Alcance:** Exclusivo para el dashboard de taller de usuarios (no incluye consola de plataforma `/plataforma`).

---

## 1. Contexto y Objetivos

El **Sprint 30** culmina la adopción completa del modo oscuro en todo el sistema de taller de Torcly. Este sprint abarca los módulos de **gestión de almacén**, **flujo financiero y comercial**, **analítica de reportes con gráficos visuales** y las bandejas unificadas de **notificaciones operativas y novedades SaaS**.

Al término de este sprint, el 100% de las pantallas, modales, formularios, tablas y gráficos del usuario de taller ofrecerán un soporte impecable tanto en tema claro como en tema oscuro.

---

## 2. Alcance Funcional — Sprint 30

### A. Catálogo y Almacén

1. **Productos (`/productos`, `/productos/:id`):**
   - Catálogo de repuestos e insumos con filtros por categoría y marca.
   - Ficha de producto con existencias de solo lectura y modal de creación/edición.
2. **Inventario (`/inventario`, `/inventario/reabastecimiento`):**
   - Historial de movimientos (kardex) con badges de entradas, salidas y ajustes.
   - Corrida de reabastecimiento con sugerencias de compra automáticas y modal de parámetros.
3. **Servicios y Técnicos (`/servicios`, `/tecnicos`):**
   - Tarifario de servicios de taller y modal de configuración.
   - Directorio de técnicos y carga de trabajo asignada.

### B. Gestión Comercial y Finanzas

1. **Ventas y Facturación (`/ventas`):**
   - Punto de venta, selector de productos/servicios y resumen de venta.
   - Modal de cobro mixto con desglose en efectivo, tarjeta, transferencia y billetera digital.
2. **Control de Caja (`/caja`):**
   - Apertura de turno de caja, registro de ingresos/egresos y modal de arqueo de cierre con balance neto por método de pago.

### C. Bandejas de Notificaciones y Novedades SaaS

1. **Notificaciones de Taller (`/notificaciones`):**
   - Lista a ancho completo con divisor horizontal `divide-y`.
   - Botones rápidos de filtro temporal (`Todo`, `7d`, `30d`, `90d`).
   - Adaptación de la paleta identitaria de 5 colores a contraste oscuro:
     - **Verde menta:** fondo `#10261D` / acento `#44CF9A`
     - **Rosa lavanda:** fondo `#261325` / acento `#E566D9`
     - **Azul cielo:** fondo `#102234` / acento `#5EA5EC`
     - **Rosa suave:** fondo `#2B121B` / acento `#F06597`
     - **Amarillo crema:** fondo `#2B2310` / acento `#E0A338`
2. **Novedades y Anuncios SaaS (`/novedades`):**
   - Feed de actualizaciones (`TrendingUp`), mantenimientos (`Wrench`) y comunicados (`FileText`).
   - Modal de detalle con reproductor de video tutorial embebido adaptado.

### D. Inteligencia de Negocio y Perfil

1. **Reportes Operativos (`/reportes`):**
   - Adaptación de gráficos Recharts (ejes, grilla de fondo, leyendas y tooltips flotantes en modo oscuro).
   - Alternativa tabular accesible para exportación de datos.
2. **Perfil del Usuario (`/perfil`):**
   - Configuración de cuenta, cambio de contraseña y selector visual de tema de tres opciones: `Claro`, `Oscuro` y `Automático (Sistema)`.

---

## 3. Entregables del Sprint 30

1. **Módulos Adaptados:** `products`, `inventory`, `replenishment`, `services`, `technicians`, `sales`, `cash`, `notifications`, `announcements`, `reports`, `profile`.
2. **Gráficos:** Componentes de `src/components/ui/chart.tsx` y `bar-chart.tsx` con estilos oscuros nativos.
3. **Consistencia Visual:** Paletas de colores pastel adaptadas a alto contraste en modo oscuro.
4. **Pruebas:** Pruebas unitarias y de integración visual completas en todos los módulos de taller.
