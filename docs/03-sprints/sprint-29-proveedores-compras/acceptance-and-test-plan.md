# Criterios de Aceptación y Plan de Pruebas — Sprint 29: Proveedores y Compras

## 1. Criterios de Aceptación (Gherkin)

### Escenario 1: Registro de Proveedor con RUC o DNI

- **Dado** que un usuario con permiso `purchases:write` abre el modal de nuevo proveedor.
- **Cuando** ingresa un RUC válido de 11 dígitos (ej. `20601234567`) o un DNI de 8 dígitos con su respectiva Razón Social.
- **Entonces** el proveedor se crea exitosamente y queda disponible para asociarle compras.
- **Y si** intenta registrar un número de documento ya existente en el taller, el sistema rechaza la operación con mensaje de error específico.

### Escenario 2: Creación de Compra en Borrador

- **Dado** que el usuario inicia el formulario de nueva compra.
- **Cuando** selecciona un proveedor activo, fecha de compra mediante el `DatePicker` de Torcly y agrega líneas de repuestos con cantidad y costo unitario.
- **Entonces** la compra se guarda en estado `DRAFT` con código secuencial (ej. `COM-0001`), calculando el subtotal y total exactos sin modificar aún el inventario.

### Escenario 3: Recepción de Compra e Impacto en Inventario

- **Dado** una compra en estado `DRAFT` con 10 unidades de aceite de motor y 4 filtros de aire.
- **Cuando** el usuario hace clic en _"Confirmar y Recepcionar"_ y acepta el diálogo de confirmación.
- **Entonces** la compra pasa al estado `RECEIVED`, registrando usuario y fecha/hora.
- **Y** el stock de aceite y filtros en la tabla `Product` se incrementa inmediatamente en 10 y 4 unidades.
- **Y** se genera un registro en `InventoryMovement` de tipo `ENTRY` vinculado a la orden de compra.
- **Y** el costo de reposición (`costPrice`) de cada producto se actualiza con el costo pactado en la compra.

### Escenario 4: Bloqueo de Modificación en Compra Recibida

- **Dado** una compra en estado `RECEIVED`.
- **Cuando** el usuario intenta editar las líneas o eliminar la compra.
- **Entonces** la interfaz no ofrece opciones de edición y cualquier petición por API es rechazada con código `409 Conflict`.

---

## 2. Plan de Pruebas Automatizadas

1. **Pruebas de Esquemas y Validaciones (`@torcly/api`):**
   - Validación de RUC (11 dígitos numéricos) y DNI (8 dígitos numéricos).
   - Validación de líneas de compra: rechazo de costos negativos y cantidades menores o iguales a cero.
2. **Pruebas de Servicio de Compras (`@torcly/api`):**
   - Creación de compra en borrador y cálculo de totales.
   - Confirmación transaccional: verificación de creación de `InventoryMovement`, actualización de stock y actualización de `costPrice`.
   - Prevención de confirmación de compra cancelada o sin líneas.
3. **Pruebas de Componentes y Páginas (`@torcly/web`):**
   - Renderizado de la tabla de compras y métricas del mes.
   - Navegación e integración en el sidebar.
   - Apertura y envío del formulario de proveedores.
   - Apertura y validación del formulario de compras con `DatePicker` y `SmartSelect`.
   - Diálogo de confirmación para recepción física de mercadería.
