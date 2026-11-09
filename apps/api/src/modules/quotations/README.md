# Módulo de Cotizaciones y Presupuestos (Proformas)

## Propósito
Permite a los talleres elaborar presupuestos comerciales previos sin comprometer inventario ni abrir órdenes de taller prematuras. 

## Endpoints
* `GET /quotations`: Listado paginado de cotizaciones con filtros por estado (`DRAFT`, `SENT`, `APPROVED`, `EXPIRED`, `REJECTED`) y buscador por cliente, código o placa.
* `GET /quotations/:id`: Detalle completo con ítems de repuestos y servicios.
* `POST /quotations`: Registro de nueva cotización.
* `PUT /quotations/:id`: Actualización de ítems y condiciones de la cotización.
* `POST /quotations/:id/convert-to-order`: Convierte la cotización aprobada directamente en una Orden de Taller (`WorkOrder`), copiando sus líneas y marcando la cotización como `APPROVED`.
