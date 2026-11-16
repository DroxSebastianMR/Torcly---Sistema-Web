# Torcly v3.3.2 — Operación Comercial, Taller y Conversión de Cotizaciones

Fecha de preparación: 15 de noviembre de 2026  
Rama de integración: `team/develop` -> `develop`  
Estado: Preparada para validación en desarrollo

## Resumen

La versión **v3.3.2** reúne los sprints operativos integrados después de
v2.2.2. El sistema refuerza la trazabilidad de clientes y vehículos, organiza
la atención de taller, permite ventas con cobro inmediato y convierte
cotizaciones preliminares en órdenes sin abandonar el flujo comercial.

## Capacidades incluidas

### Sprint 31 — Clientes y expediente vehicular

- Registro atómico de cliente y primer vehículo.
- Historial vehicular con visitas, servicios, repuestos y totales.
- Validación de documento y placa dentro de la organización activa.

### Sprint 32 — Citas, taller y recepción

- Operación de citas y órdenes dentro de un flujo de taller unificado.
- Recepción del vehículo con kilometraje, combustible y observaciones.
- Flujo de diagnóstico, presupuesto, aprobación, consumo y entrega.

### Sprint 33 — Ventas, cobros y cotizaciones

- Cobro inmediato desde ventas, incluido efectivo, medios digitales y mixto.
- Cotizaciones con productos, servicios, vigencia y envío por WhatsApp.
- La cotización no mueve inventario hasta que se convierte en orden o venta.

### Sprint 34 — Administración y mantenimiento preventivo

- Consola de plataforma con soporte seguro por organización.
- Recordatorios y vistas de mantenimiento preventivo.
- Correcciones de interfaz y consistencia en módulos operativos.

### Sprint 36 — Completar datos al convertir cotizaciones

- Las cotizaciones preliminares pueden mantenerse sin cliente ni vehículo.
- Al convertir, el sistema solicita seleccionar cliente y vehículo vinculados.
- Puede registrarse un cliente nuevo con su primer vehículo durante la
  conversión, en una única transacción.
- El mensaje de WhatsApp incluye cada repuesto o servicio presupuestado, su
  cantidad y subtotal; conserva la selección de destinatario del dispositivo.

## Reglas funcionales relevantes

- La conversión a orden requiere siempre cliente y vehículo de la misma
  organización.
- Un vehículo seleccionado debe pertenecer al cliente seleccionado.
- WhatsApp es una acción de compartición: no obliga a registrar cliente ni
  teléfono para una cotización preliminar.
- El aislamiento por organización aplica a clientes, vehículos, cotizaciones,
  órdenes, ventas, caja, inventario y mantenimiento.

## Verificación previa a integración

- Typecheck de API y Web correcto.
- Pruebas dirigidas de Cotizaciones correctas.
- Lint y build de Web correctos.
- Queda pendiente la matriz manual del Sprint 36 antes de promover a `main`.
