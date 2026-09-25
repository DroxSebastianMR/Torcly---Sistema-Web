# Appointments (web)

Módulo de citas: resumen, búsqueda, filtros por fecha/cliente/estado, listado y tarjetas responsive, detalle modal, reprogramación y cancelación.

- Una cita se crea `PROGRAMADA` y pertenece a un cliente y a uno de sus vehículos; al elegir cliente se cargan solo sus vehículos.
- Fecha y hora no pueden ser pasadas; la capacidad aprobada del taller es de hasta 8 citas activas por la misma fecha y hora programadas (la novena se rechaza con mensaje de horario completo).
- Reprogramar y cancelar están disponibles solo para citas `PROGRAMADA` con `appointments:write`; cancelar conserva el registro con su estado histórico.
- La consulta y el acceso a la página están limitados por `appointments:read`.

Sprint propietario: 08.
