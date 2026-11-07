# Mantenimiento Preventivo (Web)

## Responsabilidad
Pantalla operativa y de fidelización para talleres automotrices que analiza las visitas y kilometraje de los vehículos registrados, calcula cuándo les corresponde su próximo servicio preventivo (cambio de aceite, afinamiento, chequeo de fluidos) y provee contacto comercial directo vía WhatsApp.

## Estructura
* `pages/preventive-maintenance-page.tsx`: Vista principal con PageHeader estandarizado, tarjetas de métricas, filtros y tabla de alertas.
* `components/preventive-maintenance-metrics.tsx`: KPIs de parque vehicular (Vencidos, Por vencer, Al día y Total).
* `components/preventive-maintenance-table.tsx`: Tabla detallada con botón directo para enviar WhatsApp preformateado y botón de copiado de mensaje.
* `hooks/use-preventive-maintenance.ts`: React Query hook con cacheo y reactividad.
* `services/preventive-maintenance.service.ts`: Cliente HTTP para el endpoint `/preventive-maintenance`.
* `types/preventive-maintenance.types.ts`: Contratos TypeScript del dominio.
