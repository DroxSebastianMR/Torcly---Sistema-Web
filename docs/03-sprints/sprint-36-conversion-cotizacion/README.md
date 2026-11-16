# Sprint 36: Cotizaciones vinculadas y conversión segura

## Objetivo

Garantizar que toda cotización nueva quede vinculada desde su creación a un
cliente y un vehículo de la organización activa; luego, convertirla con
seguridad en una orden de taller.

## Alcance

- Al crear una cotización, exigir un cliente y su vehículo, existentes o
  registrados desde el mismo flujo.
- Conservar un diálogo de regularización al convertir cotizaciones históricas
  que fueron creadas antes de esta regla.
- Permitir seleccionar un cliente existente y únicamente sus vehículos.
- Permitir crear de forma atómica un cliente y su primer vehículo desde ese
  mismo diálogo.
- Actualizar la cotización y, a continuación, convertirla a orden de taller.

## Historias de usuario

### HU-36.1: Crear cotización vinculada

**Como** asesor del taller, **quiero** seleccionar un cliente con uno de sus
vehículos o registrarlos desde la cotización, **para** que el presupuesto tenga
un destinatario y pueda convertirse sin bloqueos posteriores.

**Criterios de aceptación:**

- No se guarda una cotización nueva sin cliente y vehículo.
- El vehículo se habilita sólo cuando se eligió un cliente y se filtra por él.
- La creación, actualización y conversión no permiten datos de otra
  organización ni un vehículo que no pertenezca al cliente.

### HU-36.2: Alta inmediata opcional

**Como** asesor del taller, **quiero** registrar un nuevo cliente con su
vehículo desde la cotización, **para** cerrar una atención de prospecto sin
duplicar tareas.

**Criterios de aceptación:**

- El toggle `¿Es un cliente nuevo?` muestra los datos mínimos de cliente y
  vehículo.
- Se validan documento y placa antes de guardar.
- El cliente y su primer vehículo se registran con el flujo estándar de
  clientes y se asignan inmediatamente a la cotización antes de guardarla.

## Fuera de alcance

- No se altera el flujo de **Enviar por WhatsApp**.
- No se permiten nuevas cotizaciones sin cliente y vehículo identificados.
- No se modifica el modelo de membresías o cuotas SaaS.
