# Arquitectura de Torcly

Un repositorio Git, dos aplicaciones, un lockfile de pnpm. Cada aplicación declara sus dependencias y entorno. La raíz coordina comandos, sin código de negocio.

## Frontend

`apps/web/src`: app, features, layouts, components, infrastructure, lib, styles y assets. Las páginas componen vistas, los hooks coordinan estado y los servicios llaman a la API. Ningún componente importa código del servidor.

## API

```text
apps/api/src/
  app.ts                    Composición HTTP, sin escuchar un puerto
  server.ts                 Inicio y apagado del proceso
  routes.ts                 Registro de módulos bajo /api/v1
  config/env.ts             Lectura y validación del entorno
  modules/<dominio>/        routes, controller, service, schema, types
  middlewares/              Errores y contexto de solicitudes
  infrastructure/database/  Cliente de persistencia (pendiente)
  infrastructure/mail/      Adaptador de correo (pendiente)
  shared/errors/            Errores de aplicación
```

Flujo: ruta → validación → controlador → servicio → repository cuando exista base de datos. Los controladores resuelven HTTP; los servicios contienen reglas de negocio. La infraestructura no depende de las vistas. Añadir carpetas y contratos cuando tengan una responsabilidad concreta.

## Contratos iniciales

GET `/api/v1/health` devuelve `{ status, service, timestamp }`. Es salud del proceso, no certifica disponibilidad de base de datos.

Errores: `{ error: { code, message, requestId } }`. La cabecera X-Request-Id permite correlacionar la respuesta. No se devuelven trazas internas.

Autenticación prevista: POST `/auth/login`, GET `/auth/me`, POST `/auth/logout`, POST `/auth/forgot-password` con `{ identifier }` y POST `/auth/reset-password`. Son contratos pendientes, no endpoints operativos. Se conservará la validación de permisos en el servidor independientemente de los guards del frontend.

## Pruebas

Vitest en ambas aplicaciones. Supertest prueba Express sin depender de un servidor externo ni de una base de datos. No se agregan microservicios, colas ni paquetes compartidos sin necesidad concreta.

Referencias: https://expressjs.com/en/guide/error-handling/ y https://vite.dev/config/server-options#server-proxy.
