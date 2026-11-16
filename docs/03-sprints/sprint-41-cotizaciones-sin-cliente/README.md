# Sprint 41 - Cotizaciones flexibles y alta estandarizada

## Objetivo

Permitir cotizaciones exploratorias sin cliente ni vehículo, y uniformar la alta inmediata de cliente y vehículo con el formulario de orden directa.

## Regla funcional

- Una cotización puede guardarse sin cliente ni vehículo.
- Si se asigna un cliente existente, el vehículo es opcional al guardar la cotización.
- Para convertir una cotización en orden de taller se exige un cliente y un vehículo: se pueden seleccionar existentes o registrar ambos durante la conversión.

## Alcance

- Ajustar contratos frontend y API para asociaciones opcionales al crear o editar una cotización.
- Conservar la validación de pertenencia cliente-vehículo cuando ambos estén presentes.
- Estandarizar las secciones de alta inmediata: etiquetas externas, ayudas bajo el campo, secciones numeradas en verde y ejemplos consistentes.
