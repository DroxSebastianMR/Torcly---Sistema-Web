# Sprint 18 - Cuenta, notificaciones y limpieza de códigos de barras

Rama objetivo: `feature/sprint-18-account-notifications`  
Base requerida: Sprint 17 implementado  
Estado: **Implementado; listo para prueba del usuario.**

## Objetivo

Dar al usuario control seguro sobre su perfil, centralizar avisos operativos relevantes y retirar el módulo independiente de Códigos de barras que no forma parte del flujo actual.

## Alcance

- Perfil propio: ver y editar nombre visible y datos permitidos; cambio de contraseña mediante flujo seguro y validación de contraseña actual cuando corresponda.
- Notificaciones persistentes por usuario: listar, leer/no leer, marcar una o todas como leídas y enlazar a la entidad origen sin revelar datos no autorizados.
- Eventos iniciales: stock bajo, compra recibida, cita próxima/reprogramada, orden lista para entrega y pago compensado, según permisos del destinatario.
- Preferencias básicas de notificación dentro del perfil; no enviar correos, WhatsApp ni push externo en este sprint.
- Retiro del módulo de Códigos de barras: eliminar navegación, ruta, página, búsqueda global, permisos, endpoints declarados, semillas y documentación asociados.

## Aclaración crítica

No se elimina `Product.barcode`: se conserva como campo opcional de producto. Se retira solo el módulo independiente `/codigos-de-barras` y sus referencias huérfanas.

## Reglas no negociables

1. Perfil permite actuar solo sobre la propia cuenta; administración de usuarios conserva sus permisos actuales.
2. Notificaciones se consultan solo por el destinatario autenticado; el servidor filtra siempre por `userId`.
3. Marcar lectura es idempotente y auditado cuando aplique; no se borra historia operativa al limpiar visualmente.
4. La creación de notificaciones no bloquea transacciones críticas: falla de aviso no revierte venta, cita, compra, pago ni inventario.
5. Ninguna clave de canal externo se incorpora en este sprint.

## Implementación realizada

- API `profile`: consulta/edición exclusiva de la propia cuenta, , cambio de contraseña con validación de contraseña actual, revocación de sesiones y auditoría sanitizada.
- API `notifications`: bandeja paginada por usuario, filtro por permiso de origen, contador de no leídas y acciones idempotentes para marcar una o todas como leídas.
- Eventos no bloqueantes: stock bajo, compra recibida, cita programada/reprogramada, orden lista para entrega y pago compensado. Un fallo de aviso no revierte la operación origen ni expone el error interno en logs.
- Web: perfil por pestañas, preferencias, cambio de contraseña, centro de notificaciones, contador en encabezado y estados loading/empty/error.
- Retiro completo del módulo independiente de Códigos de barras de rutas, navegación, búsqueda, permisos, seed y feature; `Product.barcode` se conserva.
- Migración `20261025000000_add_notifications_and_profile` creada y **no aplicada**.

## Verificación automatizada

- API: typecheck, lint y `prisma validate` correctos; 387 pruebas aprobadas y 111 integraciones PostgreSQL omitidas sin entorno gated.
- Web: typecheck, lint, build y pruebas focalizadas de Sprint 18 correctas. La prueba de formulario de productos pasa aislada; al ejecutar la suite web completa en paralelo puede competir por recursos, comportamiento preexistente fuera del alcance del Sprint 18.
- Repositorio: `pnpm format:check` y `git diff --check` correctos.
