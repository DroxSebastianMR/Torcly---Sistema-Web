# Torcly v3.3.3 — Consistencia de carga y cotizaciones vinculadas

Fecha de preparación: 16 de noviembre de 2026  
Rama de integración: `team/develop` -> `develop`  
Estado: En validación para integración

## Incluye

- Recuperación e integración de la interfaz operativa validada hasta
  `beb3a3a`, evitando que Sprint 36 parta de una UI anterior.
- Cotizaciones nuevas obligatoriamente vinculadas a cliente y vehículo.
- Alta inmediata de cliente y primer vehículo desde cotización.
- Conversión segura de cotizaciones históricas sin asignación.
- Mensajes de WhatsApp con el detalle de productos y servicios cotizados.
- Control reutilizable de alta de cliente, compartido por Orden Directa y
  Cotizaciones.
- Skeletons estandarizados: tabla de Cotizaciones y Dashboard estructurado.

## Compatibilidad

- No requiere migración de base de datos.
- Las cotizaciones históricas sin cliente o vehículo siguen pudiendo
  regularizarse al convertirlas a orden.

## Verificación requerida antes de `main`

- Typecheck monorepo y suites completas en verde.
- Validación manual de carga inicial en Dashboard y Cotizaciones.
- Validación manual del flujo de cotización con cliente existente y nuevo.
