# Appointments (API)

Gestiona las citas del taller en tres estados: programada, atendida y cancelada.

- Una cita requiere cliente, vehículo del cliente, fecha, hora y motivo.
- El vehículo debe pertenecer al cliente; la API es la fuente de verdad de esta validación.
- No se permiten citas nuevas ni reprogramaciones en fechas u horas pasadas.
- La capacidad aprobada del taller es de **8 citas activas por la misma fecha y hora**; la novena se rechaza con `409 APPOINTMENT_SLOT_FULL`.
- La validación de capacidad es transaccional y está protegida contra solicitudes concurrentes mediante advisory locks por horario (`torcly:appointment:slot:<fecha>:<hora>`).
- Una cita cancelada deja de contar para la capacidad del horario y no se elimina; permanece consultable con su estado histórico.
- Solo las citas `PROGRAMADA` se pueden reprogramar, cancelar o atender.
- Atender una cita exige que esté `PROGRAMADA`, la marca como `ATENDIDA` con responsable y fecha, y genera una única orden de taller conservando cliente y vehículo; una cita cancelada o ya atendida no origina otra orden.
- El código legible se genera con la secuencia `appointments_code_seq` como `CITA-000001`.
- La auditoría registra la creación, la reprogramación y la cancelación con actor, identificador, fecha, request e IP cuando está disponible.

Sprint propietario: 08.
