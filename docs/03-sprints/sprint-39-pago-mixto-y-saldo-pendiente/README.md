# Sprint 39 - Pago mixto y saldo pendiente

## Objetivo

Hacer explícito el resultado de un pago mixto incompleto y corregir la edición de sus importes.

## Alcance

- Impedir que un cobro finalice silenciosamente si la suma difiere del total.
- Informar el importe faltante o excedente dentro del diálogo.
- Mantener `Dejar pendiente (Crédito)` como la única acción explícita para dejar saldo por cobrar; si existen importes mixtos válidos, registrarlos y dejar solo la diferencia a crédito.
- Evitar que los inputs numéricos antepongan o regeneren ceros al escribir.

## Fuera de alcance

No se modifican las reglas contables ni la API de pagos: el pago finalizado continúa requiriendo el total exacto.
