# Criterios de Aceptación y Plan de Pruebas — Sprint 30: Operaciones Directas y Aforo de Patio

## 1. Criterios de Aceptación (Gherkin)

### Escenario 1: Creación Directa de Orden de Trabajo (Walk-in)

- **Dado** que un asesor o recepcionista se encuentra en el módulo de órdenes de taller con permiso `work_orders:write`.
- **Cuando** presiona "Nueva orden directa" e ingresa cliente, vehículo, kilometraje (ej. `52,000 km`), combustible (`1/2`) y observaciones.
- **Entonces** el sistema crea la orden en estado `RECEPCIONADA` con su código correlativo `OT-XXXXXX`.
- **Y** la orden registra el origen `source: 'WALK_IN'` con `appointmentId: null`.
- **Y** el odómetro del vehículo se actualiza a 52,000 km.

### Escenario 2: Recepción de Cita Programada con Kilometraje y Combustible

- **Dado** una cita en estado `PROGRAMADA`.
- **Cuando** el usuario recepciona el vehículo completando el kilometraje actual y el nivel de combustible.
- **Entonces** la cita pasa a `ATENDIDA` y se genera la orden de taller en estado `RECEPCIONADA` vinculada a la cita.
- **Y** los datos de odómetro y combustible quedan guardados en la orden y en el vehículo.

### Escenario 3: Monitoreo de Aforo de Patio y Capacidad Concurrente (Límite 8 Bahías)

- **Dado** que existen 5 órdenes activas en el taller (entre `RECEPCIONADA` y `LISTA_PARA_ENTREGA`).
- **Cuando** el usuario consulta el widget de capacidad de patio.
- **Entonces** el sistema indica 5 bahías ocupadas de 8 (62.5% de aforo) con 3 bahías disponibles.

### Escenario 4: Alerta Preventiva por Patio Lleno

- **Dado** que el taller cuenta con 8 vehículos activos concurrentes (aforo al 100%).
- **Cuando** el usuario intenta registrar un nuevo ingreso directo o recepcionar una cita.
- **Entonces** la interfaz muestra una advertencia visible de capacidad máxima alcanzada (8/8 bahías) para prevenir congestión física en el taller.

### Escenario 5: Liberación de Espacio tras Entrega

- **Dado** un taller con 8 vehículos en patio.
- **Cuando** una de las órdenes pasa a estado `ENTREGADA`.
- **Entonces** el contador de bahías ocupadas disminuye inmediatamente a 7/8 bahías.

---

## 2. Plan de Pruebas Automatizadas

1. **Pruebas de Esquemas y Validaciones (`@torcly/api`):**
   - Validación del schema de orden directa: rechazo de kilometraje negativo, validación de combustible permitido.
   - Validación de actualización de odómetro en vehículo.
2. **Pruebas de Reglas y Servicios (`@torcly/api`):**
   - Cálculo del aforo de patio con órdenes en distintos estados (activas vs entregadas).
   - Servicio de creación de orden directa (`createDirectWorkOrder`).
   - Servicio de recepción de citas con odómetro (`createFromAppointment`).
3. **Pruebas de Componentes y Páginas (`@torcly/web`):**
   - Renderizado del widget de aforo de patio (`YardCapacityWidget`).
   - Modal de orden directa y validación de campos de recepción.
   - Flujo de interacción sin iconos superiores y diseño limpio según estándares Torcly.
