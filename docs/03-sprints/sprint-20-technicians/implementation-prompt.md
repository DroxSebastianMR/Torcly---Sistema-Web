# Prompt de implementación - Sprint 20

```text
Implementa exclusivamente Sprint 20 - Técnicos de taller de Torcly.

Lee por completo README.md, acceptance-and-test-plan.md y approval.md de docs/03-sprints/sprint-20-technicians, además de definition-of-done, extension-roadmap, los módulos work-orders, users, auth, audit y navegación antes de cambiar código.

Construye un catálogo operativo independiente Technician. No crees cuentas, contraseñas, sesiones, roles ni permisos para técnicos: Torcly lo opera únicamente el administrador. El técnico solo sirve para asignarse opcionalmente a órdenes de taller.

Implementa código automático TEC-000001, fullName obligatorio, active=true por defecto y opcionales document, phone, email, specialties y notes. Documento y correo son únicos solo si tienen valor; normaliza cadenas vacías a null. No borres físicamente técnicos ya usados: activa/desactiva y conserva historia.

Reemplaza la relación actual WorkOrder.technicianId -> User por una relación nullable hacia Technician mediante migración segura y progresiva. No conviertas administradores existentes en técnicos. Las asignaciones heredadas a User deben quedar sin asignar, preservando la auditoría existente. Una orden puede continuar todos sus estados sin técnico. Al asignar, reasignar o retirar técnico, valida en servidor que exista y esté activo y registra auditoría. Rechaza UUID de usuarios administradores como técnico.

Expón API de técnicos protegida por workshop:read/workshop:write, y actualiza endpoints, filtros, tipos, detalle y selectores de órdenes. Crea la página web de Técnicos bajo Operación de taller con tabla, búsqueda, filtros, modal de crear/editar/detalle y acciones de activación/desactivación accesibles. Incluye “Sin asignar” en órdenes.

No ejecutes migraciones ni seed sin autorización. Añade pruebas unitarias, de integración gated y de web para las reglas, relaciones, migración, estados y flujos descritos. Ejecuta typecheck, lint, tests, build, format:check y git diff --check. Actualiza documentación con resultados reales, deja approval.md como “Listo para prueba del usuario” solo al terminar la implementación y no hagas commit ni push.
```
