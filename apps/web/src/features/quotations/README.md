# Feature: Cotizaciones y Presupuestos (Proformas)

## Propósito
Permite a los asesores y mecánicos del taller automotriz generar proformas previas para sus clientes sin alterar inventario ni crear órdenes anticipadas.

## Funcionalidades Clave
1. **Elaboración de Presupuesto**: Selección de cliente y vehículo (o placa tentativa), agregando repuestos y mano de obra con fecha de vigencia.
2. **Envío 1-Clic a WhatsApp**: Genera un mensaje formateado con el resumen de la cotización y enlace directo `wa.me` para enviar al cliente en un toque.
3. **Conversión a Orden de Taller**: Al ser aceptada por el cliente, se convierte automáticamente en una Orden de Taller (`WorkOrder`) con los mismos ítems y servicios.
4. **Header Estandarizado**: Implementado con el componente `<PageHeader />` siguiendo la altura y diseño de Ventas.
