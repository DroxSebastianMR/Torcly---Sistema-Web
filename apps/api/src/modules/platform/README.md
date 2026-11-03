# Plataforma

Espacio interno de Torcly para la futura consola SaaS. No comparte permisos ni
datos operativos con un taller.

## Protección

- Todas las rutas requieren sesión autenticada y `User.isPlatformAdmin = true`.
- Una membresía de organización no basta para entrar.
- El primer endpoint (`GET /api/v1/platform/access`) solo confirma acceso; no
  expone todavía organizaciones, miembros ni métricas.

Las capacidades analíticas, organizaciones, planes y suscripciones se
incorporarán después de completar el aislamiento por `organizationId` de los
módulos operativos.
