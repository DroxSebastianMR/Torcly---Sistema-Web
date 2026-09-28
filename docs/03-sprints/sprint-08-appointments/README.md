# Sprint 08 — Citas

Rama: `feature/sprint-08-appointments`
Base: Sprint 07 aprobado (`b9c8b2b`)
Historias: HU-31 a HU-35
Avance acumulado al aprobar: 40/92 = 43,48%

## Estado

**Aprobado por el usuario.** Prueba manual completada y cierre autorizado; queda pendiente únicamente el push si se solicita.

## Objetivo

Registrar y organizar las citas del taller, asegurando que cada una corresponda a un cliente y a uno de sus vehículos, sin conflictos de horario y conservando su historial cuando se reprograma o cancela.

## Historias incluidas

| Historia | Resultado esperado                                                          |
| -------- | --------------------------------------------------------------------------- |
| HU-31    | Programar una cita con cliente, vehículo del cliente, fecha, hora y motivo. |
| HU-32    | Validar la disponibilidad y advertir conflictos antes de registrar.         |
| HU-33    | Buscar y consultar citas por fecha, cliente o estado.                       |
| HU-34    | Reprogramar fecha u hora y volver a validar disponibilidad.                 |
| HU-35    | Cancelar conservando el registro y su estado histórico.                     |

## Reglas funcionales

- Cliente, vehículo, fecha, hora y motivo son obligatorios.
- El vehículo debe pertenecer al cliente seleccionado; la API es la fuente de verdad de esta validación.
- Una cita nueva o reprogramada no puede estar en una fecha u hora pasada.
- La capacidad aprobada del taller es de **hasta 8 vehículos activos por la misma fecha y hora programadas**. La novena cita activa en ese horario debe rechazarse en el servidor, también frente a solicitudes concurrentes. No se deben inventar duraciones ni bahías mientras no existan una historia y una decisión explícita.
- Un mismo vehículo no puede tener dos citas `PROGRAMADA` en la misma fecha y hora, aunque todavía existan cupos del taller. Vehículos distintos comparten la capacidad global de 8 cupos.
- Una cita se crea en estado `PROGRAMADA`. Al cancelar, pasa a `CANCELADA`, no se elimina y no bloquea el horario para una nueva cita.
- Solo se permite editar o reprogramar una cita programada. La atención y la generación de operación pertenecen al Sprint 09.
- Cada creación, reprogramación y cancelación debe dejar auditoría con actor, fecha, identificador de cita e IP cuando esté disponible.

## Fuera de alcance

- Confirmar asistencia, marcar una cita como atendida, no asistencia o crear una operación desde ella: Sprint 09.
- Asignar técnicos, presupuesto, diagnóstico, consumo de repuestos, ventas, pagos y facturación.
- Calendario por duración o agenda por bahías; requieren definición específica del taller.

## Implementación

### API

- Modelo Prisma `Appointment` con enum `AppointmentStatus` (PROGRAMADA/CANCELADA), código legible `CITA-######` por secuencia `appointments_code_seq`, campos `date @db.Date` y `time @db.Time(0)` y relaciones con `Customer` y `Vehicle`; eventos de auditoría `APPOINTMENT_CREATED`, `APPOINTMENT_RESCHEDULED` y `APPOINTMENT_CANCELLED`. Migraciones manuales `20261001120000_add_appointments` y `20261001130000_add_appointment_audit_events` aplicadas en la prueba manual. Seed con permisos `appointments:read` y `appointments:write`.
- Módulo `apps/api/src/modules/appointments`, montado en `/appointments`: `GET /appointments` (búsqueda por código/cliente/vehículo/placa y motivo, filtros de fecha, cliente y estado, paginación), `GET /appointments/:id`, `POST /appointments`, `PUT /appointments/:id/reschedule` y `POST /appointments/:id/cancel`. Permisos de servidor `appointments:read` / `appointments:write`.
- Reglas de dominio: cliente obligatorio, vehículo debe pertenecer al cliente (400 `APPOINTMENT_VEHICLE_INVALID`), fecha u hora pasada (la hora pasada es `time <= hora actual`, 400 `APPOINTMENT_PAST_DATE`/`APPOINTMENT_PAST_TIME`), motivo de 3 a 300 caracteres, capacidad de **8 citas activas (PROGRAMADA) por la misma fecha y hora** con rechazo de la novena (409 `APPOINTMENT_SLOT_FULL`) y bloqueo de una segunda cita simultánea para el mismo vehículo (409 `APPOINTMENT_VEHICLE_BUSY`).
- Validación transaccional con advisory locks (`torcly:appointment:slot:<fecha>:<hora>` y `torcly:appointment:<id>`): el conteo de activas y la escritura ocurren bajo el mismo lock, de modo que solicitudes concurrentes por el último cupo no exceden la capacidad. Reprogramación y cancelación solo sobre citas `PROGRAMADA` (409 `APPOINTMENT_NOT_PROGRAMADA`); cancelar conserva el registro con responsable y fecha, y el cupo se libera.
- Errores de dominio: 404 `APPOINTMENT_NOT_FOUND`, `CUSTOMER_NOT_FOUND`; 400 `APPOINTMENT_PAST_DATE`, `APPOINTMENT_PAST_TIME`, `APPOINTMENT_VEHICLE_INVALID`; 409 `APPOINTMENT_SLOT_FULL`, `APPOINTMENT_NOT_PROGRAMADA`.
- La consulta responde `{ data, pagination, summary: { total, programadas, canceladas, hoy } }`.

### Web

- Ruta `/citas` con permiso `appointments:read`; página con resumen (total, hoy, programadas y canceladas), búsqueda, filtros de fecha/cliente/estado, tabla y tarjetas responsive, paginación, estados vacíos, carga y error con reintento.
- Formulario modal de registro y reprogramación gated por `appointments:write`: selectores custom con cliente que al elegirse carga solo sus vehículos (SmartSelect), calendario con mínimo hoy, hora en intervalos de 30 minutos, motivo, y nota informativa cuando el horario alcanzó las 8 citas activas.
- Ficha de detalle modal con cliente, vehículo, código, responsable, fechas y motivo; acciones de reprogramar y cancelar solo en citas `PROGRAMADA` con permiso de escritura, la cancelación con diálogo de confirmación y sin borrado físico.
- Los hooks de citas invalidan listado y detalle tras cada mutación; en creación informa los errores de dominio (p. ej. horario completo) como mensajes en español.
- README de la feature en `apps/web/src/features/appointments/README.md`.

## Verificación

- API: `prisma validate`, `eslint`, `tsc`, `vitest` — 144 pasadas + 59 aplazadas de integración (activables con `DATABASE_TESTS=true`) en 30 archivos.
- Web: `eslint`, `tsc -b`, `vitest` — 54 archivos y 251 pruebas, build verificado.
- `prettier --check` y `git diff --check` sin hallazgos.

## Cierre

El Sprint 08 está aprobado y cerrado. El porcentaje acumulado es 40/92 = 43,48%. El push permanece pendiente de solicitud expresa.
