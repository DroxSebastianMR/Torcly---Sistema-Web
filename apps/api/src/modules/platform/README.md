# Plataforma

Espacio interno de Torcly para la futura consola SaaS. No comparte permisos ni
datos operativos con un taller.

## Protección

- Todas las rutas requieren sesión autenticada y `User.isPlatformAdmin = true`.
- Una membresía de organización no basta para entrar.
- La consola permite consultar, crear, activar o desactivar organizaciones y
  administrar sus miembros con roles de taller, sin acceder a los datos
  operativos de ningún taller.
- Desactivar una organización o una membresía revoca sus sesiones activas y
  bloquea sus nuevas autenticaciones hasta que se reactive.

Los módulos operativos resuelven la organización exclusivamente desde la
sesión y consultan sus propios registros. Planes, suscripciones, analítica
agregada y soporte auditado siguen fuera de este módulo.
