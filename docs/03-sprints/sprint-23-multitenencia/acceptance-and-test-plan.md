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
2. Puede crear, activar y desactivar organizaciones; puede registrar miembros,
   modificar su rol y activar o desactivar su membresía.
3. Al desactivar un taller o miembro, sus sesiones existentes quedan revocadas
   y un nuevo inicio de sesión debe ser rechazado hasta reactivarlo.
4. Toda entrada de soporte a una organización registra actor, organización,
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

## Verificación automatizada

- [x] Los fixtures unitarios e integraciones declaran una organización y sus
      membresías de forma explícita.
- [x] API: `prisma validate`, typecheck, lint y 439 pruebas unitarias aprobadas.
- [x] Web: typecheck, lint, 428 pruebas en 88 archivos y build de producción.
- [x] Formato Prettier y diff estructural (`git diff --check`) en verde.
- [x] Prueba de aislamiento manual ejecutada y verificada: - Creación y administración de Taller Validación A y Taller Validación B desde `/plataforma`. - Consulta cruzada de UUID de cliente/recurso entre organizaciones devuelve `404 Not Found` (`CUSTOMER_NOT_FOUND`) sin exponer datos ni confirmar existencia. - Edición de organizaciones permite actualizar nombre del taller, código, rol, nombre y correo del responsable. - Depuración completada: 30 usuarios temporales y 25 roles residuales eliminados de PostgreSQL, conservando únicamente las organizaciones y usuarios operativos válidos.
- [ ] Ejecutar las 111 integraciones con `DATABASE_TESTS=true` contra una
      PostgreSQL de pruebas aislada; esta acción no se ejecutó para no tocar
      desarrollo ni producción.
