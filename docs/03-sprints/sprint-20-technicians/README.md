# Sprint 20 - Técnicos de taller

Rama objetivo: `feature/sprint-20-technicians`  
Base técnica: Sprint 19 implementado.  
Estado: **Implementado; listo para aplicar migración y prueba manual.**

## Objetivo

Separar el catálogo operativo de técnicos de las cuentas de usuario para que las órdenes de taller solo se asignen a personas que realmente ejecutan trabajo técnico.

El sistema seguirá siendo usado exclusivamente por el administrador. Los técnicos no tendrán usuario, contraseña, permisos ni acceso a Torcly.

## Alcance

- Módulo **Técnicos** con listado, búsqueda, creación, edición, consulta, activación y desactivación.
- Catálogo independiente de `User`, con código consecutivo visible como `TEC-000001`.
- Datos obligatorios: nombre completo y estado; estado activo por defecto.
- Datos opcionales: documento, teléfono, correo, especialidades y notas.
- Selectores de técnico de Órdenes de taller alimentados únicamente por técnicos activos.
- Una orden puede mantenerse o avanzar sin técnico asignado; asignar, reasignar y retirar la asignación son acciones explícitas y auditadas.
- Filtros/listas de órdenes continúan permitiendo `Sin técnico asignado`.
- Migración segura desde la referencia actual de órdenes a `User`: las asignaciones heredadas a administradores no se reinterpretan como técnicos y quedan sin asignar.

## Fuera de alcance

- Cuentas de inicio de sesión para técnicos.
- Roles, permisos, contraseñas, recuperación de acceso o sesiones de técnicos.
- Horarios, turnos, asistencia, remuneraciones, comisiones, geolocalización, fotografías o control de capacidad.
- Asignación automática, agenda individual o medición de productividad por técnico.

## Reglas no negociables

1. `Technician` no se relaciona con `User`; crear un técnico jamás crea una cuenta.
2. Solo técnicos activos aparecen como candidatos en una orden.
3. `technicianId` en una orden es nullable. No bloquea diagnóstico, presupuesto, aprobación, ejecución, finalización ni entrega.
4. No se permite desactivar un técnico mientras sea necesario preservar una asignación activa sin confirmación explícita del administrador; la UI debe explicar el efecto y ofrecer reasignar o retirar la asignación.
5. No se elimina físicamente un técnico que ya aparezca en una orden o evento de auditoría. Se desactiva para preservar la historia.
6. Documento y correo son opcionales; si se registran, son únicos dentro del taller. Valores vacíos se normalizan a `null`.
7. La API valida siempre que un técnico asignado exista y esté activo. La web no es la autoridad de esa regla.
8. Creación, edición, activación, desactivación, asignación, reasignación y retiro de técnico generan auditoría sin exponer documento, correo, teléfono ni notas en logs.

## Modelo de datos

| Campo                    | Tipo / regla                               | Obligatorio |
| ------------------------ | ------------------------------------------ | ----------- |
| `id`                     | UUID interno                               | Automático  |
| `code`                   | Consecutivo único `TEC-000001`             | Automático  |
| `fullName`               | Texto normalizado, 3 a 120 caracteres      | Sí          |
| `active`                 | Booleano; valor inicial `true`             | Sí          |
| `document`               | Texto normalizado, único si existe         | No          |
| `phone`                  | Texto normalizado                          | No          |
| `email`                  | Correo válido, único si existe             | No          |
| `specialties`            | Lista breve de especialidades              | No          |
| `notes`                  | Observación interna, máximo 500 caracteres | No          |
| `createdAt`, `updatedAt` | Trazabilidad temporal                      | Automático  |
| `createdBy`, `updatedBy` | Usuario administrador actor                | Automático  |

## Migración de órdenes existente

Actualmente `WorkOrder.technicianId` referencia a `User`, por lo que algunos administradores pueden aparecer erróneamente como técnicos. La migración debe ser reproducible y reversible a nivel de respaldo:

1. Crear la tabla `technicians` y sus restricciones únicas parciales para documento/correo no nulos.
2. Agregar una nueva relación nullable de orden hacia `Technician`; no reutilizar la clave foránea de usuario de forma incompatible.
3. Conservar los eventos de auditoría existentes como evidencia histórica del actor que hizo la asignación.
4. Establecer en `null` las asignaciones heredadas hacia usuarios, porque ningún administrador se debe convertir implícitamente en técnico.
5. Mover el código de lectura/escritura de órdenes a la nueva relación y validar con datos reales antes de retirar la referencia heredada.
6. Retirar la columna/relación heredada solo en una migración posterior cuando no exista código que la consulte.

No se aplican migraciones ni seed durante la implementación sin autorización expresa.

## Entregables técnicos

- API `technicians`: tipos, schemas, reglas, repositorio, servicio, controlador, rutas y README del módulo.
- Endpoints protegidos con `workshop:read` para consulta y `workshop:write` para mutaciones, dado que el administrador opera todo el taller.
- Integración de `work-orders` con la nueva referencia, filtros y resumen legible del técnico o `Sin asignar`.
- Web: página de Técnicos, tabla, filtros, modal de alta/edición y cambio de estado; navegación bajo Operación de taller.
- Verificación estática completada: `prisma generate`, typecheck y lint de API/web. La integración contra PostgreSQL queda pendiente hasta aplicar la migración.
