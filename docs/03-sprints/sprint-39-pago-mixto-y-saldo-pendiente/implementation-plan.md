# Plan de implementación

1. Modelar los importes del pago mixto como texto controlado y convertirlos a decimal seguro solo al calcular o enviar.
2. Mostrar la diferencia frente al total y deshabilitar `Cobrar y Finalizar` hasta que sea exactamente cero.
3. Añadir una alerta legible que dirija al usuario a ajustar los importes o usar crédito.
4. Conservar la acción existente de crédito para confirmar la venta sin cobro inmediato.
5. Cubrir el escenario incompleto y la edición sin cero prefijado mediante pruebas del modal.
