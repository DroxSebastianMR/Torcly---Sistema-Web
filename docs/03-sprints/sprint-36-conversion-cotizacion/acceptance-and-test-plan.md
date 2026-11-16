# Matriz de aceptación y pruebas

## Precondiciones

- Una cotización preliminar con al menos un ítem, sin cliente ni vehículo.
- Un cliente existente con al menos un vehículo en la organización activa.

## Conversión con cliente existente

1. Abre la cotización preliminar y pulsa **Convertir a orden**.
2. Comprueba que aparece `Completar datos para convertir`.
3. Selecciona el cliente existente.
4. Verifica que el selector de vehículo se habilita y sólo lista los vehículos
   de ese cliente.
5. Selecciona el vehículo y confirma.

**Esperado:** se asocian cliente y vehículo a la cotización y se crea la orden.

## Conversión con cliente nuevo

1. Abre una cotización preliminar y pulsa **Convertir a orden**.
2. Activa `¿Es un cliente nuevo?`.
3. Completa documento, teléfono, nombres, placa, marca, modelo y año.
4. Confirma la conversión.

**Esperado:** el sistema crea una única vez cliente y vehículo en la
organización actual, actualiza la cotización y crea la orden.

## Regresión de WhatsApp

1. En una cotización preliminar, pulsa **Enviar por WhatsApp**.

**Esperado:** se conserva el comportamiento actual de selección de contacto o
número en el dispositivo; no se exige cliente ni teléfono.
