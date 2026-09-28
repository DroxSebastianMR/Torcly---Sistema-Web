# Auth (API)

Responsable de credenciales, sesión, bloqueo, expiración, autorización base y cierre. Expone `POST /auth/login`, `GET /auth/me` y `POST /auth/logout`; no decide la UI.

## Archivos

- `auth.routes.ts` y `auth.controller.ts`: transporte HTTP.
- `auth.schemas.ts`: validación de entradas.
- `auth.service.ts`: reglas de login, sesión y permisos.
- `auth.repository.ts`: persistencia Prisma y auditoría.
- `auth.middleware.ts`: sesión obligatoria y permisos de servidor.
- `auth.cookies.ts`: cookie HttpOnly y lectura segura.
- `password.ts`: hash `scrypt` con salt aleatorio.
- `session-token.ts`: tokens opacos y huella SHA-256.

Las contraseñas y los tokens de sesión nunca se guardan o registran en texto claro. Las sesiones vencen tras 30 minutos de inactividad y cinco fallos bloquean la cuenta durante 15 minutos. El módulo se relaciona con `users`, Prisma, los guards del frontend y todos los módulos protegidos. Sprint propietario: 01.
