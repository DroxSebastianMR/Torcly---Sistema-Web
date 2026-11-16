# Matriz de aceptación y pruebas

## Precondiciones

- Un cliente existente con al menos un vehículo en la organización activa.

## Creación con cliente existente

1. Pulsa **Nueva cotización**.
2. Selecciona un cliente y verifica que el selector de vehículo sólo muestra
   los vehículos de ese cliente.
3. Selecciona un vehículo, agrega un ítem y guarda.

**Esperado:** la cotización queda vinculada a ambos datos. No debe guardarse
si falta cliente o vehículo.

## Creación con cliente nuevo

1. Pulsa **Nueva cotización** y activa `¿Es un cliente nuevo?`.
2. Completa los datos obligatorios del cliente y su primer vehículo.
3. Agrega un ítem y guarda.

**Esperado:** se registra el cliente con su vehículo y la cotización queda
asignada a ambos.

## Conversión con cliente existente

1. Abre una cotización histórica sin asignación y pulsa **Convertir a orden**.
2. Comprueba que aparece `Completar datos para convertir`.
3. Selecciona el cliente existente.
4. Verifica que el selector de vehículo se habilita y sólo lista los vehículos
   de ese cliente.
5. Selecciona el vehículo y confirma.

**Esperado:** se asocian cliente y vehículo a la cotización y se crea la orden.

## Conversión con cliente nuevo

1. Abre una cotización histórica sin asignación y pulsa **Convertir a orden**.
2. Activa `¿Es un cliente nuevo?`.
3. Completa documento, teléfono, nombres, placa, marca, modelo y año.
4. Confirma la conversión.

**Esperado:** el sistema crea una única vez cliente y vehículo en la
organización actual, actualiza la cotización y crea la orden.

## Regresión de WhatsApp

1. En una cotización, pulsa **Enviar por WhatsApp**.

**Esperado:** se conserva el comportamiento actual de selección de contacto o
número en el dispositivo; no se fuerza el teléfono registrado del cliente.
