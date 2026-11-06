# Plan de Aceptación y Pruebas — Sprint 26

## 1. Criterios de Aceptación

### CA-01: Visibilidad en Header y Sidebar

- La cabecera de la aplicación (`AppHeader`) debe incluir un botón de campana (`Bell`) con badge rojo si hay notificaciones sin leer (`count > 0`).
- El menú lateral (`AppSidebar`) debe incluir la opción **Notificaciones** dentro del grupo general o de administración con permiso `notifications:read`.
- Si existen notificaciones no leídas, el ítem del sidebar debe mostrar una burbuja numérica destacada con el conteo (ej. `3` o `99+`).

### CA-02: Popover de Resumen Rápido

- Al hacer clic en la campana del header, se debe desplegar un popover flotante con:
  - Título y conteo de no leídas.
  - Enlace "Ver todas" que redirige a `/notificaciones`.
  - Las últimas 5 notificaciones ordenadas cronológicamente en orden descendente.
  - Al hacer clic en una notificación, debe cerrar el popover y navegar a la ruta correspondiente (`link`).

### CA-03: Ruta y Navegación a `/notificaciones`

- La ruta `/notificaciones` debe estar registrada en `protected.routes.tsx` bajo la guardia `PermissionRoute` con permiso `notifications:read`.
- Si un usuario navega a `/notificaciones`, se debe renderizar `NotificationsPage`.

### CA-04: Gestión y Marcado de Lectura

- Cada notificación en `/notificaciones` o en el popover debe indicar si está leída o no leída con un punto distintivo.
- Botón "Marcar como leída" en cada tarjeta.
- Botón "Marcar todas como leídas" en la barra de herramientas de `/notificaciones`.
- El conteo de no leídas debe disminuir de inmediato de forma reactiva.

### CA-05: Eventos de Taller y Tipos Soportados

- El sistema debe soportar:
  - `APPOINTMENT_SCHEDULED`: Cita agendada.
  - `APPOINTMENT_RESCHEDULED`: Cita reprogramada.
  - `APPOINTMENT_OVERDUE`: Cita programada pendiente que pasó su hora límite.
  - `STOCK_LOW`: Repuesto o producto bajo stock mínimo.
  - `PURCHASE_RECEIVED`: Recepción de insumos o repuestos.
  - `WORK_ORDER_READY`: Orden de trabajo terminada y lista para entrega.
  - `PAYMENT_COMPENSATED`: Compensación o anulación de cobro.
  - `SYSTEM`: Comunicados y novedades del SaaS.

---

## 2. Casos de Prueba

| ID    | Escenario                                            | Resultado Esperado                                                                                       |
| ----- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| CP-01 | Usuario con 3 notificaciones no leídas inicia sesión | Header muestra campana con badge `3`. Sidebar muestra `Notificaciones` con burbuja `3`.                  |
| CP-02 | Clic en la campana del header                        | Se despliega el popover con las 5 notificaciones más recientes.                                          |
| CP-03 | Clic en "Marcar todas como leídas"                   | Todas las notificaciones pasan a leídas. El badge del header y la burbuja del sidebar desaparecen (`0`). |
| CP-04 | Navegación a `/notificaciones`                       | La página carga métricas, barra de filtros por lectura/tipo y listado paginado.                          |
| CP-05 | Aislamiento por taller                               | Un usuario de un taller A nunca ve ni cuenta notificaciones emitidas para un taller B.                   |
