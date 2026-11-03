# Plan de aceptación — Sprint 23

## Pruebas de aislamiento

1. Crear Organización A y B.
2. En ambas, crear el mismo código de producto y la misma placa; ambos deben
   ser válidos dentro de su organización.
3. Con una sesión de A, consultar el UUID de un cliente, venta, pago u orden de
   B: la API no debe devolver datos ni confirmar su existencia.
4. Intentar crear una venta de A usando el UUID de un producto de B: debe ser
   rechazada.
5. Confirmar que inventario, reportes, dashboard, IA y notificaciones sólo
   consideran registros de la organización activa.

## Pruebas de administrador de plataforma

1. La cuenta global no debe aparecer como técnico, cliente ni administrador de
   una organización.
2. Puede crear/desactivar organizaciones y gestionar membresías.
3. Toda entrada de soporte a una organización registra actor, organización,
   motivo, momento y dirección IP cuando esté disponible.

## Modelo de roles

1. La cuenta marcada como `isPlatformAdmin` no recibe permisos de un taller ni
   aparece como Dueño del taller.
2. El rol visible **Dueño del taller** puede administrar sólo su organización.
3. Un colaborador con el mismo rol en Organización B no obtiene datos de A.

## Migración

1. Hacer backup verificable antes de aplicar.
2. Ejecutar preflight: conteo por tabla y relaciones huérfanas.
3. Ejecutar backfill hacia la organización de transición.
4. Comparar los conteos antes/después y ejecutar pruebas de lectura.
5. Sólo entonces volver obligatorios los campos e índices compuestos.
