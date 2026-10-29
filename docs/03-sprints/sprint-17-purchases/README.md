# Sprint 17 - Compras y recepción de proveedores

Rama objetivo: `feature/sprint-17-purchases`  
Base requerida: Sprint 16 implementado y entorno de prueba conocido  
Estado: **Implementado; listo para prueba del usuario.**

## Objetivo

Permitir registrar proveedores y compras de productos existentes, confirmar una recepción una sola vez y aumentar inventario de manera trazable. El flujo reduce digitación repetida sin mezclar pagos a proveedores con el módulo de caja de ventas.

## Alcance

- CRUD de proveedores: razón social/nombre, documento único, contacto opcional, teléfono/correo y estado activo.
- Compra como borrador con proveedor, fecha, referencia externa opcional y líneas de productos existentes: cantidad positiva de hasta tres decimales y costo unitario congelado.
- Edición/eliminación de líneas solo en borrador; total calculado por servidor.
- Confirmación de recepción: crea movimientos `ENTRY` confirmados, actualiza existencias dentro de una única transacción y conserva compra, líneas y movimientos como historial inmutable.
- Estados mínimos: `DRAFT`, `RECEIVED`, `CANCELLED`; cancelar no revierte una recepción ya confirmada.
- Lista, detalle, filtros por proveedor/estado/período y resumen pequeño de compras recibidas.
- Permisos separados: `purchases:read` y `purchases:write`; toda ruta exige auth y permiso de servidor.

## Fuera de alcance

- Cuentas por pagar, pagos a proveedores, facturación electrónica, OCR, importación masiva, órdenes automáticas y modificación de costos históricos.
- Crear productos desde una compra: primero se registra el producto en su catálogo.

## Reglas no negociables

1. Confirmar una compra debe ser idempotente por `requestId` y usar lock por compra/productos para impedir doble ingreso de stock.
2. El total, saldo de inventario y estado se calculan/validan en API; el cliente no es autoridad.
3. Una recepción confirmada no se edita ni borra. Correcciones posteriores se realizan con ajuste de inventario auditado, no reescribiendo historia.
4. Cantidades y precios validan precisión definida; no usar `float` del navegador como valor de negocio definitivo.
5. No aplicar migraciones, seed ni cambios de base sin autorización posterior.

## Entregables

- Módulo API `purchases` con schemas, reglas, repositorio, servicio, controlador, rutas, migraciones nuevas y pruebas.
- Pantallas web de proveedores, compras, detalle y formulario de borrador/recepción con estados loading/empty/error/restricted.
- Navegación, permisos, auditoría y README del módulo.
- Evidencia automatizada y plan manual de este sprint.
