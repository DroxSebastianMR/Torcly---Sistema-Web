# Plan de aceptación — Sprint 08 Citas

## Preparación

1. Aplicar las migraciones del Sprint 08 y ejecutar la semilla solo cuando el incremento esté listo para prueba.
2. Iniciar sesión como administrador y confirmar acceso al módulo **Citas**.
3. Tener dos clientes y, como mínimo, dos vehículos: un cliente debe poseer dos vehículos y el otro uno diferente.

## Datos de prueba sugeridos

| Cliente                        | Vehículo                | Fecha y hora futura        | Motivo                                      |
| ------------------------------ | ----------------------- | -------------------------- | ------------------------------------------- |
| Prueba Natural Sprint03        | ABC123 — Toyota Corolla | siguiente día hábil, 09:00 | Mantenimiento preventivo y cambio de aceite |
| Torcly Prueba Sprint 03 S.A.C. | B7X908 — Hyundai Accent | siguiente día hábil, 10:00 | Revisión de frenos delanteros               |

Sustituye las placas si no existen en la base de prueba; deben ser vehículos realmente asociados al cliente elegido.

## Casos principales

| Caso                      | Acción                                                                                  | Resultado esperado                                                                      |
| ------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Crear cita                | Elegir cliente, uno de sus vehículos, fecha/hora futura y motivo.                       | Guarda una cita `PROGRAMADA` con código, responsable y fecha de registro.               |
| Relación cliente/vehículo | Cambiar el cliente después de seleccionar vehículo o intentar enviar un vehículo ajeno. | La interfaz limpia o restringe opciones; la API rechaza cualquier relación inválida.    |
| Vehículo ocupado          | Registrar una segunda cita del mismo vehículo, misma fecha y misma hora.                | Rechaza la segunda cita aunque queden cupos para otros vehículos.                       |
| Fecha pasada              | Intentar crear para ayer o una hora ya transcurrida.                                    | No permite guardar e informa el campo inválido.                                         |
| Capacidad                 | Registrar 8 citas activas en la misma fecha y hora y crear una novena.                  | Las primeras 8 se registran; la novena se rechaza con un mensaje de capacidad completa. |
| Consulta                  | Buscar por cliente, filtrar por fecha y por estado.                                     | Solo aparecen las citas que coinciden; se puede abrir su detalle.                       |
| Reprogramar               | Mover la cita a una hora libre.                                                         | Se actualiza fecha/hora y conserva el registro de auditoría.                            |
| Capacidad al reprogramar  | Mover una cita al horario que ya tiene 8 citas activas.                                 | Rechaza el cambio sin modificar la cita original.                                       |
| Cancelar                  | Cancelar una cita programada y confirmar la acción.                                     | Cambia a `CANCELADA`, permanece consultable y ya no bloquea su horario.                 |
| Permisos                  | Probar con perfil sin escritura, cuando esté disponible.                                | Puede consultar si tiene lectura, pero no crear, reprogramar ni cancelar.               |

## Evidencia mínima

- Código y detalle de una cita programada y otra cancelada.
- Evidencia de la novena cita rechazada por capacidad y de una reprogramación válida.
- Consulta filtrada por fecha, cliente y estado.
- Resultado de pruebas automatizadas, typecheck, lint, build y formato.
