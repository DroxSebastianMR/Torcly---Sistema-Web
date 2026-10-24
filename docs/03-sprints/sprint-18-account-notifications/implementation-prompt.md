# Prompt de implementación - Sprint 18

```text
Implementa únicamente Sprint 18 - Cuenta, notificaciones y limpieza de Códigos de barras.

Lee los tres documentos del sprint, definition-of-done y los módulos auth, users, appointments, inventory, work-orders, payments, purchases, navigation y audit antes de cambiar código.

Construye un perfil propio seguro (solo datos permitidos, validación y cambio de contraseña seguro) y notificaciones persistentes por usuario. Todo acceso debe filtrarse en API por actor autenticado y permisos; las notificaciones no deben bloquear ni revertir transacciones críticas. Incluye estados de carga/vacío/error y enlaces solo a recursos autorizados.

Retira el módulo independiente de Códigos de barras: rutas, navegación, búsqueda, permisos, endpoints declarados, semillas, tests y docs huérfanos. Conserva Product.barcode como campo comercial opcional; no destruyas datos de productos.

Usa migraciones nuevas si hacen falta, sin aplicarlas ni hacer seed. Añade tests de aislamiento, permisos, idempotencia y regresión del retiro. Ejecuta las verificaciones completas, documenta resultados reales y deja approval.md “Listo para prueba del usuario”. No hagas commit ni push.
```
