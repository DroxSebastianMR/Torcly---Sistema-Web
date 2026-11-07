# Preventive Maintenance Module (API)

## Responsabilidad
Motor de detección y generación de recordatorios inteligentes de mantenimiento preventivo para talleres automotrices.

## Endpoints
* `GET /preventive-maintenance`: Lista de vehículos con su estado de mantenimiento preventivo (`CRITICAL`, `WARNING`, `UP_TO_DATE`), métricas consolidadas del taller y mensaje de WhatsApp preformateado.
  * Requiere autenticación y contexto de organización activa.
  * Parámetros opcionales:
    * `priority`: `'all' | 'CRITICAL' | 'WARNING' | 'UP_TO_DATE'`
    * `search`: Búsqueda por placa, marca, modelo, cliente o teléfono.

## Algoritmo
* Se calcula el tiempo transcurrido desde la última orden de trabajo entregada (`status: ENTREGADA`) o la fecha de registro del vehículo.
* `CRITICAL`: $\ge 180$ días (6 meses) desde el último servicio.
* `WARNING`: $150$ a $179$ días (5 a 6 meses).
* `UP_TO_DATE`: $< 150$ días.
