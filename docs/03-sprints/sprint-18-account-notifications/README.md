# Sprint 18 - Cuenta, notificaciones y limpieza de códigos de barras

Rama objetivo: `feature/sprint-18-account-notifications`  
Base requerida: Sprint 17 implementado  
Estado: **Planificado; no iniciado.**

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
