# Torcly

Monorepo de gestión comercial con dos aplicaciones independientes:

- `apps/web`: React, Vite y TypeScript. Conserva la arquitectura por features.
- `apps/api`: Express 5 y TypeScript. Backend modular con API `/api/v1`.
- `docs`: arquitectura y contratos.
- `output`: documentos entregables. `tmp`: archivos auxiliares locales.

## Desarrollo

Requisitos: Node.js 22.12+ y pnpm 11.19.0.

```sh
pnpm install
```

Copiar `.env.example` a `.env` en cada aplicación si no existen. Ya se prepararon los archivos locales para este entorno.

```sh
pnpm dev          # Inicia web y API; Ctrl+C detiene ambos
pnpm dev:web      # Solo frontend
pnpm dev:api      # Solo backend
```

Web: http://127.0.0.1:5173. API: http://127.0.0.1:3000/api/v1/health.
Vite reenvía `/api` al puerto 3000. En el navegador, `/api/v1/health` prueba la conexión a Express a través del frontend. Si se cambia el puerto API, actualizar también el proxy en `apps/web/vite.config.ts`.

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm format:check
pnpm start:api    # Ejecuta el backend compilado
```

## Estado actual

El backend implementa salud HTTP, configuración validada, CORS, cabeceras de seguridad, identificadores de solicitud, errores uniformes y cierre del servidor. No incluye aún base de datos, autenticación, correo ni operaciones comerciales.

El botón de login conserva el acceso temporal de desarrollo con `VITE_ENABLE_DEMO=true`; no autentica contra Express. Producción lo deshabilita. Los endpoints de negocio aún no implementados responden 404.

## Producción

Compilar ambas aplicaciones. Servir `apps/web/dist` con fallback SPA y ejecutar `apps/api/dist/server.js`. Configurar un proxy inverso para `/api` o una URL absoluta en `VITE_API_URL` al compilar el frontend. El proxy de Vite solo existe en desarrollo. La API admite HOST, PORT y CORS_ORIGINS; no incluir secretos en variables VITE.

## Organización

Ver [arquitectura](docs/architecture.md). Las rutas y pantallas conservadas del frontend están documentadas en [referencia frontend](docs/frontend.md).
