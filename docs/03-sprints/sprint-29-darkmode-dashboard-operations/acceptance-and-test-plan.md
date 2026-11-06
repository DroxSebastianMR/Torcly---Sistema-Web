# Criterios de Aceptación y Plan de Pruebas — Sprint 29

## 1. Criterios de Aceptación (DoD)

- [ ] **CA-01 (Shell de Taller):** El sidebar, la cabecera superior y el pie de página se adaptan al modo oscuro sin ninguna superficie en blanco desentonado.
- [ ] **CA-02 (Switch de Tema):** El usuario de taller puede alternar entre modo claro y modo oscuro desde la cabecera con un solo clic.
- [ ] **CA-03 (Popover de Notificaciones):** El desplegable de la campana de notificaciones mantiene lectura clara, colores identificativos y scroll sin barra gris visible.
- [ ] **CA-04 (Módulos Operativos):** Las pantallas `/dashboard`, `/ordenes-taller`, `/citas`, `/clientes` y `/vehiculos` se visualizan perfectamente en modo oscuro.
- [ ] **CA-05 (Modales de Operación):** Los modales de registro de citas, creación de órdenes, consumo y devolución de repuestos tienen fondo oscuro, bordes limpios y textos legibles.
- [ ] **CA-06 (Responsividad Móvil):** En pantallas pequeñas, el menú drawer lateral y las tarjetas se ajustan fluidamente sin desbordamientos.

---

## 2. Casos de Prueba Manual

| ID           | Módulo             | Procedimiento                                                      | Criterio de Éxito                                                                             |
| :----------- | :----------------- | :----------------------------------------------------------------- | :-------------------------------------------------------------------------------------------- |
| **TC-29-01** | Header             | Clic en el botón `ThemeToggle` en la barra superior.               | Toda la vista del taller cambia de claro a oscuro de inmediato sin recarga.                   |
| **TC-29-02** | Popover Campana    | Desplegar la campana de notificaciones en modo oscuro.             | El fondo del popover es oscuro, las pestañas resaltan con contraste y el scroll es invisible. |
| **TC-29-03** | Órdenes de Trabajo | Abrir listado de órdenes y abrir modal de consumo de repuestos.    | Los estados de orden tienen colores pastel adaptados y el modal de repuestos es legible.      |
| **TC-29-04** | Agenda de Citas    | Navegar por el calendario y abrir el modal de reprogramación.      | Las celdas de fecha y botones de hora destacan sin cansar la vista.                           |
| **TC-29-05** | Ficha de Cliente   | Entrar al detalle de un cliente con vehículos y órdenes asociadas. | Pestañas, tablas anidadas y datos de contacto presentan contraste óptimo.                     |
