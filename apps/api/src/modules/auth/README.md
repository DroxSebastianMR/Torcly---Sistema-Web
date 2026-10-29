# Auth (API)

Responsable de credenciales, sesión, bloqueo, expiración, autorización base, recuperación de contraseña y cierre. Expone `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`, `POST /auth/forgot-password` y `POST /auth/reset-password`; no decide la UI.

## Archivos

- `auth.routes.ts` y `auth.controller.ts`: transporte HTTP.
- `auth.schemas.ts`: validación de entradas.
- `auth.service.ts`: reglas de login, sesión, permisos y recuperación.
- `auth.repository.ts`: persistencia Prisma y auditoría.
- `auth.middleware.ts`: sesión obligatoria y permisos de servidor.
- `auth.cookies.ts`: cookie HttpOnly y lectura segura.
- `password.ts`: hash `scrypt` con salt aleatorio.
- `session-token.ts`: tokens opacos y huella SHA-256.
- `recovery-token.ts`: token de recuperación aleatorio y huella SHA-256.
- `password-reset-notifier.ts`: adaptador de comunicación seguro y testeable (por defecto solo registra de forma sanitizada).

Las contraseñas y los tokens de sesión nunca se guardan o registran en texto claro. Las sesiones vencen tras 30 minutos de inactividad y cinco fallos bloquean la cuenta durante 15 minutos. La recuperación responde igual exista o no la cuenta, almacena solo el hash del token, respeta el TTL (`PASSWORD_RESET_TTL_MINUTES`), es de un solo uso (consumo atómico) e invalida las sesiones previas. El módulo se relaciona con `users`, Prisma, los guards del frontend y todos los módulos protegidos. Sprints propietarios: 01 y 16 (HU-84).
