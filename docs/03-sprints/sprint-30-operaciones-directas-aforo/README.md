# Sprint 30 — Operaciones Directas en Recepción y Aforo Diario de Patio

## 1. Contexto y Objetivos

En la operación real de un taller mecánico automotriz, no todos los clientes programan una cita con anticipación. Gran parte de la afluencia ocurre por **ingresos directos ("walk-ins")**: vehículos que llegan de improviso por emergencias mecánicas (ruidos extraños, pinchazos, sobrecalentamiento, fallas de arranque o mantenimientos inmediatos).

Actualmente:
- Para generar una Orden de Trabajo (`WorkOrder`), el flujo exigía obligatoriamente partir de una cita previa (`Appointment`).
- En la recepción física del vehículo faltaba registrar variables críticas de control automotriz: **kilometraje actual (`currentMileage`)** y **nivel de combustible (`fuelLevel`)**, datos que protegen al taller ante reclamos y sustentan futuras alertas preventivas (ej. cambios de aceite cada 5,000 km).
- Los talleres físicos operan con una infraestructura limitada: en este caso, una capacidad física de **8 vehículos concurrentes** en patio/bahías de trabajo. El control de cuántos vehículos ingresan al día y el aforo actual de patio se venía gestionando a mano o en pizarras.

El objetivo del **Sprint 30** es implementar la recepción directa de vehículos sin cita previa, el registro vehicular de odómetro y combustible al ingresar (tanto en citas como en directas), y el control visual del aforo y capacidad de patio en tiempo real (límite de 8 vehículos concurrentes).

---

## 2. Alcance Funcional

### A. Recepción Directa y Creación de Orden de Trabajo sin Cita Previa ("Walk-ins")
- **Generación directa de OTs:** Permite a los recepcionistas y asesores crear una Orden de Trabajo directamente desde `/ordenes-taller` o recepción rápida sin requerir una cita previa.
- **Selección o Registro Rápido:** Selección ágil de cliente y vehículo existentes (con búsqueda por placa o DNI/RUC), o alta rápida en caso de cliente nuevo.
- **Trazabilidad de Origen:** La orden queda etiquetada con su origen (`source: 'WALK_IN'` vs `source: 'APPOINTMENT'`).
- **Estado Inicial y Asignación:** Ingresa en estado `RECEPCIONADA` con correlativo secuencial `OT-XXXXXX`.

### B. Captura de Odómetro y Nivel de Combustible en Recepción
- **Campos de Control Obligatorios en Recepción:**
  - **Kilometraje actual (`currentMileage`):** Número entero en kilómetros. Se actualiza automáticamente como el último kilometraje registrado en la ficha del vehículo (`Vehicle.mileage`).
  - **Nivel de Combustible (`fuelLevel`):** Selección gráfica o segmentada (`EMPTY`, `1/4`, `1/2`, `3/4`, `FULL`).
  - **Notas / Motivo de Ingreso:** Diagnóstico preliminar o manifestación del conductor.
- **Aplicación Universal:** Disponible tanto en la **creación directa** como al **atender y recepcionar una cita programada**.

### C. Aforo Diario y Capacidad de Patio (Límite 8 Bahías)
- **Monitoreo de Capacidad Concurrente:**
  - El aforo mide los vehículos físicamente en taller (estados activos: `RECEPCIONADA`, `EN_DIAGNOSTICO`, `PENDIENTE_APROBACION`, `APROBADA`, `EN_EJECUCION`, `LISTA_PARA_ENTREGA`).
  - Cuando la orden pasa a `ENTREGADA` o `RECHAZADA`, el vehículo libera su bahía en patio.
- **Widget y Métricas de Aforo:**
  - Indicador de bahías ocupadas vs disponibles (ej. `5 / 8 bahías ocupadas - 62.5%`).
  - Alerta visual cuando el patio alcanza su capacidad máxima (`8 / 8`).
  - Contador de vehículos ingresados en el día (discriminado por walk-in vs cita).
- **Regla Operativa:** Notificación preventiva cuando el patio esté lleno al intentar recepcionar un nuevo vehículo, permitiendo autorizaciones extraordinarias o espera de entrega inminente.

---

## 3. Entregables

1. **Documentación:**
   - `README.md`: Resumen y objetivos del sprint.
   - `implementation-plan.md`: Modelado de base de datos, contratos API y diseño UI.
   - `acceptance-and-test-plan.md`: Criterios de aceptación Gherkin y plan de pruebas.
   - `approval.md`: Acta de verificación DoD.
2. **Backend API (`@torcly/api`):**
   - Migración Prisma para desvincular la obligatoriedad de `appointmentId` en `WorkOrder`.
   - Adición de `currentMileage`, `fuelLevel`, `source` y `receptionNotes` en `WorkOrder`.
   - Adición de `mileage` en `Vehicle`.
   - Endpoint / Lógica de cálculo de aforo de patio (`getBayCapacity`).
   - Servicio para creación de órdenes de taller directas y actualización de odómetro.
   - Pruebas unitarias de esquemas, reglas y servicios.
3. **Frontend Web (`@torcly/web`):**
   - Modal de recepción directa / modal unificado de recepción de órdenes de trabajo.
   - Widget visual de Aforo de Patio (8 bahías) en la cabecera del módulo de órdenes de taller.
   - Captura de kilometraje y combustible al atender citas y en creación directa.
   - Pruebas unitarias de componentes y validaciones.
