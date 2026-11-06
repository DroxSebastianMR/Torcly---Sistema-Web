# Plan de Implementación — Sprint 30: Operaciones Directas y Aforo de Patio

## 1. Arquitectura de Datos y Modelado Prisma

### A. Modificaciones en el Modelo `WorkOrder`
- `appointmentId`: Pasa de `String @unique` a `String? @unique @map("appointment_id") @db.Uuid`.
- `appointment`: Pasa de `Appointment` a `Appointment?`.
- `source`: Nuevo campo `WorkOrderSource @default(APPOINTMENT)` con valores `APPOINTMENT` | `WALK_IN`.
- `currentMileage`: `Int? @map("current_mileage")` (Kilometraje al ingresar).
- `fuelLevel`: `String? @map("fuel_level") @db.VarChar(20)` (`EMPTY`, `QUARTER`, `HALF`, `THREE_QUARTERS`, `FULL`).
- `receptionNotes`: `String? @map("reception_notes") @db.VarChar(500)`.

### B. Modificaciones en el Modelo `Vehicle`
- `mileage`: `Int? @map("mileage")` (Odómetro actualizado con el último registro en taller).

---

## 2. Contratos de API REST

### Órdenes de Trabajo (`/api/v1/work-orders`)

1. **Creación Directa (Walk-in):**
   - **Ruta:** `POST /api/v1/work-orders/direct`
   - **Permiso:** `work_orders:write`
   - **Payload:**
     ```json
     {
       "customerId": "uuid",
       "vehicleId": "uuid",
       "currentMileage": 45200,
       "fuelLevel": "HALF",
       "receptionNotes": "Cliente reporta chillido al frenar en rueda delantera derecha"
     }
     ```
   - **Respuesta:** Detalle de la orden creada en estado `RECEPCIONADA` con código correlativo `OT-XXXXXX`.

2. **Atención de Cita con Recepción Vehicular:**
   - **Ruta:** `POST /api/v1/work-orders/from-appointment`
   - **Permiso:** `work_orders:write`
   - **Payload:**
     ```json
     {
       "appointmentId": "uuid",
       "currentMileage": 89100,
       "fuelLevel": "THREE_QUARTERS",
       "receptionNotes": "Mantenimiento periódico preventivo de 90,000 km"
     }
     ```

3. **Métricas y Aforo de Patio:**
   - **Ruta:** `GET /api/v1/work-orders/yard-capacity`
   - **Permiso:** `work_orders:read`
   - **Respuesta:**
     ```json
     {
       "maxCapacity": 8,
       "occupiedBays": 5,
       "availableBays": 3,
       "occupancyRate": 62.5,
       "isAtCapacity": false,
       "todayEntriesCount": 7,
       "todayWalkInsCount": 4,
       "todayAppointmentsCount": 3
     }
     ```

---

## 3. Componentes Frontend (Web)

1. **Widget de Capacidad de Patio (`YardCapacityWidget`):**
   - Muestra indicador visual en la cabecera de `/ordenes-taller`.
   - Barra de progreso segmentada o indicador con tonalidad:
     - Verde (`< 75%` ocupación).
     - Ámbar (`75% - 99%` ocupación, ej. 6-7 autos).
     - Rojo (`100%` ocupación, 8 de 8 bahías ocupadas).
   - Contador de vehículos ingresados en el día (Citas vs Walk-in).

2. **Modal de Nueva Orden Directa (`DirectWorkOrderModal`):**
   - Selector inteligente de Cliente y Vehículo (`SmartSelect`).
   - Campo numérico para Kilometraje actual (`currentMileage`).
   - Selector de Nivel de combustible (`fuelLevel`) con opciones visuales (Vacío, 1/4, 1/2, 3/4, Lleno).
   - Área de observaciones de recepción.
   - Advertencia visual si el aforo actual ya alcanzó las 8 bahías ocupadas.

3. **Ajuste en Recepción de Citas:**
   - En el modal de confirmación o acción de atender cita, solicitar odómetro y nivel de combustible para completar la recepción integral.

---

## 4. Reglas de Negocio

1. **Estados que Ocupan Patio:** `RECEPCIONADA`, `EN_DIAGNOSTICO`, `PENDIENTE_APROBACION`, `APROBADA`, `EN_EJECUCION`, `LISTA_PARA_ENTREGA`.
2. **Liberación de Patio:** Al pasar a `ENTREGADA` o `RECHAZADA`, el vehículo deja de computar como aforo activo.
3. **Persistencia de Odómetro:** Al guardar el kilometraje en la recepción, el valor se propaga al campo `mileage` del `Vehicle` (siempre que sea mayor o igual al valor preexistente).
4. **Respeto a Estándares UI Torcly:** Sin íconos decorativos en cabeceras de diálogos, selectores custom y barras de scroll ocultas.
