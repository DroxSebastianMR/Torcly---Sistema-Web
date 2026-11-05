# Despliegue de producción en Render

Esta guía separa de forma estricta la base de datos de producción de la usada
en desarrollo. Las credenciales nunca se guardan en el repositorio ni en un
archivo `.env` versionado.

## Variables de base de datos

La aplicación ya reconoce las dos variables necesarias. En el servicio **API**
de Render se crean como secretos con las nuevas credenciales de producción:

| Variable       | Uso                                  | Valor que debe configurarse en Render                     |
| -------------- | ------------------------------------ | --------------------------------------------------------- |
| `DATABASE_URL` | Conexión de la API en ejecución      | URL del pool transaccional de la nueva base de producción |
| `DIRECT_URL`   | Prisma Migrate durante el despliegue | URL de sesión/directa de esa misma base de producción     |

No se deben crear aliases como `PRODUCTION_DATABASE_URL`: el código usa
intencionalmente los nombres estándar anteriores. Así se evita que una sesión
local de desarrollo pueda elegir la base de producción por accidente.

## Servicios de Render

Crear dos servicios desde el mismo repositorio:

### 1. API — Web Service

- Runtime: Node.
- Build command: `pnpm install --frozen-lockfile && pnpm --filter @torcly/api build`
- Start command: `pnpm --filter @torcly/api start`
- Health check: `/api/v1/health`
- Variables no secretas:
  - `NODE_ENV=production`
  - `HOST=0.0.0.0`
  - `CORS_ORIGINS=https://<dominio-del-frontend>`
  - Ajustar los límites de sesión existentes solo si el taller lo requiere.
- Secretos: `DATABASE_URL`, `DIRECT_URL`, `GROQ_API_KEY` si se habilitará el
  asistente, y las credenciales de seed únicamente si se ejecutará una semilla
  controlada.

### 2. Web — Static Site

- Build command: `pnpm install --frozen-lockfile && pnpm --filter @torcly/web build`
- Publish directory: `apps/web/dist`
- Variable de compilación: `VITE_API_URL=https://<dominio-de-la-api>/api/v1`
- Regla obligatoria para React Router:
  - Source: `/*`
  - Destination: `/index.html`
  - Action: `Rewrite`

Sin esa reescritura, la navegación interna funciona, pero recargar o abrir
directamente `/dashboard`, `/productos`, `/caja` u otra ruta devuelve el
`Not Found` del CDN antes de que React Router pueda iniciar. El archivo
`render.yaml` versiona esta regla cuando los servicios se administran como
Blueprint. Si el Static Site fue creado manualmente, la misma regla debe
registrarse una vez en **Redirects/Rewrites** del panel de Render.

No usar `VITE_` para secretos: todo valor con ese prefijo termina incluido en
el JavaScript público del navegador.

## Primera salida a producción

1. Crear primero el servicio API y registrar las variables con la nueva base.
2. Configurar las credenciales de las únicas dos cuentas iniciales como secretos
   de Render:
   - `SEED_ADMIN_EMAIL`, `SEED_ADMIN_USERNAME`, `SEED_ADMIN_NAME` y
     `SEED_ADMIN_PASSWORD` para la administradora.
   - `SEED_OWNER_EMAIL`, `SEED_OWNER_USERNAME`, `SEED_OWNER_NAME` y
     `SEED_OWNER_PASSWORD` para el dueño del taller.
     Ambas reciben el rol Administrador; no se crean usuarios técnicos.
3. Ejecutar una única vez, desde un entorno controlado que tenga los mismos
   secretos, `pnpm db:migrate:deploy` y después `pnpm db:seed`. La semilla de
   producción crea exclusivamente permisos, el rol y esas dos cuentas; no carga
   técnicos, productos, servicios ni datos de demostración cuando
   `NODE_ENV=production`.
4. Verificar `https://<api>/api/v1/health`.
5. Crear el Static Site, configurar `VITE_API_URL` y copiar su URL exacta en
   `CORS_ORIGINS` de la API. Hacer redeploy de API si ese valor cambió.
   No agregar una barra final a ninguna URL. Ejemplo:
   `CORS_ORIGINS=https://torcly-web.onrender.com`.
6. Probar inicio y cierre de sesión, una consulta, una venta, un pago y el
   cierre de caja en una cuenta controlada.
7. Confirmar que las cookies se emiten con HTTPS y que la consola del navegador
   no informa errores CORS antes de habilitar el uso operativo.

## Controles antes de cada deploy

```sh
pnpm db:validate
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm format:check
```

Las pruebas de integración que requieren PostgreSQL se ejecutan aparte con la
base de QA, nunca contra la base de producción.
