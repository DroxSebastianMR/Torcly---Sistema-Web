# Plan de implementación

1. Extender el contrato de conversión para recibir una asociación existente o
   los datos de un cliente y vehículo nuevos.
2. En una transacción de Prisma, validar la organización, crear opcionalmente
   cliente y vehículo, asociarlos a la cotización y crear la orden.
3. Mantener el endpoint actual compatible para cotizaciones que ya estén
   completas.
4. Crear el diálogo reutilizando `Modal`, `SmartSelect` e `Input`.
5. Mostrar el diálogo sólo cuando la cotización no tenga cliente o vehículo;
   de lo contrario conservar la conversión directa.
6. Añadir pruebas de servicio para aislamiento por organización y pruebas de
   interfaz para la selección cliente → vehículo.
