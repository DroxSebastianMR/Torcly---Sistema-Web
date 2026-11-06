# Acta de Aprobación — Sprint 25

- **Fecha:** 5 de noviembre de 2026
- **Sprint:** 25 — Restablecimiento Asistido de Contraseñas y Soporte
- **Rama:** `feature/admin-password-reset`
- **Estado:** Aprobado para integración en `develop`

---

## 1. Verificación de Criterios de Aceptación

- [x] Migración de base de datos aplicada con columna `must_change_password` en ambientes local y producción.
- [x] Endpoints de API en `/users/:id/reset-password` y `/platform/organizations/:orgId/members/:userId/reset-password` operativos y protegidos por tenant.
- [x] Generación de claves temporales con formato seguro `Torcly-[4 letras]-[4 dígitos]!` y registro de auditoría `PASSWORD_RESET_COMPLETED`.
- [x] Modales de emisión y copia rápida al portapapeles en `/usuarios` (tabla de usuarios) y `/plataforma` (miembros de organizaciones).
- [x] Modal bloqueante no descartable `ForcePasswordChangeModal` en `AppLayout` cuando `user.mustChangePassword === true`.
- [x] Verificación de suites de prueba completas: 439 pruebas de API pasadas y 428 pruebas de Web pasadas (0 fallos).
- [x] Typecheck y verificación de tipos en verde para `@torcly/api` y `@torcly/web`.

---

## 2. Dictamen

**Aprobado**: La solución de restablecimiento asistido de contraseñas responde con precisión y solidez a la prioridad 1 establecida para Torcly en su etapa actual sin servidor SMTP/dominio transaccional, garantizando seguridad estricta, aislamiento multi-tenant y auditoría permanente.
