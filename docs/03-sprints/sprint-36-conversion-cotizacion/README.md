# Sprint 36: Completar datos para convertir cotizaciones

## Objetivo

Permitir que una cotización preliminar, creada sin cliente ni vehículo, pueda
convertirse con seguridad en una orden de taller. La conversión siempre debe
terminar con un cliente y un vehículo pertenecientes a la organización activa.

## Alcance

- Mantener las cotizaciones preliminares y el envío por WhatsApp sin cambios.
  WhatsApp conserva su selector de contacto o número del dispositivo.
- Reemplazar el error de conversión por un diálogo para completar los datos
  requeridos.
- Permitir seleccionar un cliente existente y únicamente sus vehículos.
- Permitir crear de forma atómica un cliente y su primer vehículo desde ese
  mismo diálogo.
- Actualizar la cotización y, a continuación, convertirla a orden de taller.

## Historias de usuario

### HU-36.1: Completar cotización preliminar

**Como** asesor del taller, **quiero** completar cliente y vehículo al intentar
convertir una cotización preliminar, **para** no tener que abandonar el flujo.

**Criterios de aceptación:**

- Si la cotización ya tiene cliente y vehículo, se convierte sin pasos extra.
- Si falta alguno, se abre el diálogo `Completar datos para convertir`.
- El vehículo se habilita sólo cuando se eligió un cliente y se filtra por él.
- La actualización y conversión no permiten datos de otra organización.

### HU-36.2: Alta inmediata opcional

**Como** asesor del taller, **quiero** registrar un nuevo cliente con su
vehículo desde la conversión, **para** cerrar una atención de prospecto sin
duplicar tareas.

**Criterios de aceptación:**

- El toggle `¿Es un cliente nuevo?` muestra los datos mínimos de cliente y
  vehículo.
- Se validan documento y placa antes de guardar.
- Cliente, vehículo, actualización de cotización y orden se ejecutan de forma
  atómica.

## Fuera de alcance

- No se altera el flujo de **Enviar por WhatsApp**.
- No se obliga a identificar cliente o vehículo al crear/editar una cotización.
- No se modifica el modelo de membresías o cuotas SaaS.
