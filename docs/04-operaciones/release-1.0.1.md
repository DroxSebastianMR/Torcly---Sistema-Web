# Torcly v1.0.1 — versión operativa estabilizada

Fecha de publicación: 31 de octubre de 2026.

Esta versión entrega la operación central del taller para uso administrado: se
registra la atención, se ejecuta la orden de trabajo, se controla el inventario,
se cobra y se realiza el cierre semanal de caja. La aplicación se publica como
frontend estático y API separados en Render, conectados a una base PostgreSQL de
producción.

## Cambios destacados de v1.0.1

- Se evita el ciclo de validación de sesión tras inactividad: las respuestas de
  autenticación no se cachean y el cliente no reintenta la comprobación durante
  varios minutos si la API no está disponible.
- La recuperación autónoma por correo se deshabilita en la interfaz; se orienta
  al usuario a solicitar apoyo al propietario o equipo responsable.
- Se compacta la tarjeta de acceso y se actualizan las KPI de Dashboard y
  Reportes con iconografía decorativa más visible, sin afectar la lectura del
  dato.
- El sidebar identifica la versión desplegada como `v1.0.1`.

## Módulos incluidos

| Área                  | Capacidades disponibles                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Acceso y usuarios     | Inicio y cierre de sesión, límite de intentos, bloqueo temporal, roles y permisos, perfil y administración de usuarios.                     |
| Clientes y vehículos  | Registro, edición, consulta, búsqueda, filtros, paginación y vínculo propietario-vehículo.                                                  |
| Productos y servicios | Catálogos de categorías, marcas y unidades; registro, edición, activación y consulta de productos y servicios.                              |
| Inventario            | Stock inicial, entradas, salidas, ajustes, existencias e historial trazable de movimientos.                                                 |
| Citas                 | Agenda de atención, reprogramación, cancelación y atención que genera una orden de taller.                                                  |
| Órdenes de taller     | Diagnóstico, presupuesto, aprobación, asignación opcional de técnico, actividades, consumo/devolución de repuestos, finalización y entrega. |
| Técnicos              | Catálogo independiente de técnicos, sin cuentas de acceso; se asignan opcionalmente a órdenes de taller.                                    |
| Ventas y caja         | Ventas en borrador o confirmadas, anulación controlada, cobros parciales, compensaciones, apertura y cierre de caja con detalle histórico.  |
| Dashboard             | Resumen operativo del día, citas próximas, alertas de inventario, actividad reciente y estado del taller.                                   |
| Reportes              | Reportes por período de ventas, cobros, inventario, servicios y taller, con gráficos y exportación a Excel.                                 |

## Reglas operativas relevantes

- Una cita atendida genera una única orden de taller.
- La orden puede avanzar sin técnico asignado; el técnico es un registro interno,
  no un usuario del sistema.
- Los consumos de una orden descuentan existencias solo cuando se registran.
- Una venta confirmada genera una obligación de cobro; los pagos se registran en
  Caja y se vinculan a la caja abierta.
- El cierre de caja conserva su detalle histórico y calcula el efectivo esperado.
- Los códigos de productos y servicios se proponen automáticamente y pueden
  revisarse antes de guardar; deben ser únicos.

## Seguridad y sesión

- Las sesiones usan cookies seguras en producción, expiración por inactividad,
  límite absoluto de jornada y renovación controlada del identificador.
- Las respuestas de autenticación no se almacenan en caché, para evitar que una
  sesión expirada deje el cliente en una validación indefinida.
- La recuperación por correo está deshabilitada en esta versión. El enlace
  **¿Olvidaste tu contraseña?** orienta a contactar al propietario del taller o
  al equipo responsable para gestionar el restablecimiento.

## Elementos deliberadamente fuera de alcance

- Compras, reabastecimiento, referencias de inventario y códigos de barras.
- Módulos de mantenimiento y auditoría visibles para la operación diaria.
- Asistente IA y su historial para usuarios finales.
- Recuperación autónoma de contraseñas mediante correo.

## Operación y soporte

- La versión visible en el sidebar es `v1.0.1`.
- La guía de configuración, migraciones y semilla mínima de producción está en
  [render-production.md](render-production.md).
- La semilla de producción crea únicamente las cuentas de dueño y administradora
  configuradas mediante variables de entorno. No carga datos de demostración.

## Verificación previa a despliegue

```sh
pnpm db:validate
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm format:check
```

Las pruebas de integración que requieren PostgreSQL se ejecutan sobre un entorno
de QA; no deben ejecutarse contra la base de producción.
