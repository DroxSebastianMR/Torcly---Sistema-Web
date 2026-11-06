# Sprint 29 — Modo Oscuro Parte 2: Shell del Dashboard de Taller, Navegación y Operaciones Centrales

- **Rama base:** `feature/reponsive-ui`
- **Rama de trabajo:** `feature/darkmode-part-2-dashboard-operations`
- **Estado:** Planificado (Documentación lista)
- **Alcance:** Exclusivo para el dashboard de taller de usuarios (no incluye consola de plataforma `/plataforma`).

---

## 1. Contexto y Objetivos

Una vez establecida la infraestructura base de tema en el Sprint 28, el **Sprint 29** aborda la experiencia troncal del sistema de taller: el **shell principal de navegación**, la barra superior con su popover de notificaciones y switch de tema, y los **cinco módulos operativos de uso más frecuente** por los jefes de taller, asesores de servicio y mecánicos.

El objetivo es lograr una navegación inmersiva, sin elementos brillantes desalineados, con transiciones fluidas de color y perfecta legibilidad en pantallas táctiles, tablets de taller y computadoras de escritorio.

---

## 2. Alcance Funcional — Sprint 29

### A. Shell y Navegación del Taller

- **Barra Lateral (Sidebar):**
  - Fondo `bg-card` / `border-border`.
  - Estados interactivos de los enlaces (`active`, `hover`, `focus`) adaptados a tonos verdes sutiles.
  - Insignias numéricas (`badge`) con fondo atenuado y texto de alta visibilidad.
  - Menú hamburguesa y drawer móvil responsive con backdrop oscuro semitransparente.
- **Cabecera Superior (TopBar / Header):**
  - Switch de tema interactivo (`Sun` / `Moon` / `Laptop`) integrado en la barra de usuario.
  - Campana de notificaciones con indicador visual en tiempo real.
  - **Popover desplegable de notificaciones:** fondo oscuro `bg-popover`, pestañas de categorías adaptadas, botones de acción ("Marcar todas", "Ver todas") y scrollbar invisible (`scrollbar-none`).
  - Separadores verticales elegantes (`border-border`).

### B. Módulos Operativos de Taller

1. **Dashboard Operativo (`/dashboard`):**
   - Tarjetas de resumen diario (órdenes en curso, citas pendientes, vehículos listos para entrega).
   - Bloque de agenda diaria con horarios destacados.
   - Centro de avisos operativos rápidos.
2. **Órdenes de Trabajo (`/ordenes-taller`):**
   - Listado tabular y filtros por estado (`PENDIENTE`, `EN_PROCESO`, `LISTA_PARA_ENTREGA`, `ENTREGADA`, `CANCELADA`).
   - Modal de detalle de orden con visualización de líneas de repuestos y servicios.
   - Modales operativos: asignación de técnicos, registro de consumos de repuestos y devoluciones al almacén.
3. **Citas y Agenda (`/citas`):**
   - Selector visual de fecha y ranuras de hora (mañana/tarde).
   - Modal de agendamiento rápido y modal de reprogramación con verificación de capacidad horaria.
4. **Gestión de Clientes (`/clientes`, `/clientes/:id`):**
   - Directorio de clientes con buscador rápido.
   - Modal de alta y edición (persona natural con DNI y persona jurídica con RUC).
   - Ficha integral del cliente con historial de vehículos asociados y órdenes anteriores.
5. **Parque Automotor / Vehículos (`/vehiculos`, `/vehiculos/:id`):**
   - Directorio de vehículos con badges de placa, marca, modelo y año.
   - Modal de registro con validación de placa.
   - Ficha del vehículo con tabs de kilometraje, mantenimientos y propietario.

---

## 3. Entregables del Sprint 29

1. **Shell:** `apps/web/src/layouts/app/` y `apps/web/src/features/navigation/` adaptados a modo oscuro.
2. **Selector de Tema:** Componente `ThemeToggle` colocado en la cabecera del dashboard.
3. **Módulos Operativos:** `dashboard`, `work-orders`, `appointments`, `customers` y `vehicles` adaptados al 100% en modo oscuro.
4. **Componentes UI:** `SmartSelect`, `DataTable`, `Modal`, `DatePicker`, `TimePicker` con soporte oscuro nativo.
