# Plan de implementación

1. Convertir `customerId` y `vehicleId` del contrato de cotización a campos anulables u opcionales.
2. Permitir en API crear o actualizar una cotización sin asociación, y validar la relación solo cuando se proporcionen ambos identificadores.
3. Conservar el bloqueo de conversión a orden, que exige cliente y vehículo.
4. Actualizar el formulario de cotizaciones: cliente y vehículo opcionales, alta inmediata con el mismo patrón visual de la orden directa.
5. Revisar el formulario de orden directa para que las secciones numeradas y los marcadores obligatorios usen el verde institucional y etiquetas externas.
6. Ejecutar pruebas de contratos, formularios y typecheck.
