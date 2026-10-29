# Análisis del estado actual

Fecha de auditoría: 24/09/2026.

## Resultado ejecutivo

Torcly tiene una base frontend coherente y una API en expansión, pero todavía no posee un flujo protegido de negocio completo. Durante la auditoría, `origin/main` avanzó al commit `3559381`, que incorpora PostgreSQL/Prisma y un catálogo de productos con UI y API. Con una Definition of Done de extremo a extremo, el avance funcional aceptado sigue siendo 0 de 92 historias hasta que esas funciones tengan autorización de servidor, pruebas integradas, evidencia y aprobación del usuario. HU-15 a HU-18 se clasifican como implementadas y pendientes de revalidación, no como aprobadas.

La base técnica sí aporta valor y no debe desecharse: monorepo pnpm, React 19, Vite, TypeScript estricto, React Router, TanStack Query, React Hook Form, Zod, Axios, Tailwind, Express 5, Prisma/PostgreSQL, errores uniformes, CORS, Helmet, request ID, carga diferida de rutas y pruebas unitarias. Esa infraestructura se mide como habilitador, no como historia de negocio terminada.

## Evidencia del repositorio

| Área          | Estado verificable                                                  | Brecha principal                                                            |
| ------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Monorepo      | `apps/web` y `apps/api` compilan                                    | No hay paquetes compartidos ni contrato generado; no son necesarios todavía |
| Frontend      | Login, recuperación, layout, navegación, guards y diseño responsive | Los módulos de negocio son placeholders                                     |
| API           | Salud, configuración, productos y errores                           | Sin autenticación ni permisos de servidor; los demás dominios no existen    |
| Persistencia  | Prisma/PostgreSQL, migraciones de productos y movimientos           | Modelo parcial; usuarios, clientes, vehículos y servicios pendientes        |
| Autenticación | Contratos y UI preparados; demo en memoria                          | Sin sesión real, hash, bloqueo, expiración ni autorización de servidor      |
| Pruebas       | 29 pruebas pasan; typecheck, lint y build pasan                     | Cobertura limitada a base HTTP, formularios, permisos y navegación          |
| Documentación | SRS, backlog, acta, Business Case, estado y costeo extensos         | Inconsistencias de estado, tecnología y porcentaje; faltaban sprints y DoD  |

## Inconsistencias encontradas

1. El primer checkout auditado no contenía Prisma ni productos; `origin/main` incorporó ese trabajo durante la revisión. El informe previo queda parcialmente respaldado por el nuevo commit, pero la aceptación aún carece de permisos de servidor y evidencia completa.
2. La documentación frontend mencionaba NestJS, mientras el backend real es Express 5.
3. El Business Case conserva una carátula V2.5 aunque el nombre del archivo y el historial apuntan a V2.6.
4. El presupuesto resumido de S/ 10 000 y el costeo de mercado no representan la misma línea base; el informe reconoce que el costo no era evaluable.
5. La navegación actual incluye compras, caja, códigos de barras y notificaciones como módulos principales, pero el SRS V1.0 organiza el alcance en diez componentes distintos. Deben conservarse solo cuando apoyen una historia aprobada.
6. Los requisitos exigen correo o nombre de usuario para autenticarse; el formulario actual exige correo. El contrato se normalizará a `identifier`.

## Riesgos inmediatos

- Alcanzar 31,52% esta semana exige validaciones muy rápidas y una secuencia estricta de dependencias.
- Crear seis ramas antes de commits no crea divergencia real: todas apuntan inicialmente al mismo commit. La ascendencia efectiva se obtiene al aprobar y autorizar el commit de cada sprint antes de comenzar el siguiente.
- PostgreSQL con Prisma ya está incorporado en `origin/main`; la política de sesiones y el modelo de usuarios condicionan Sprint 01.
- No se debe contar UI aislada como avance funcional. Cada módulo debe demostrar persistencia, reglas, permisos y pruebas.

## Recomendación

Ejecutar seis sprints verticales y acumulativos. Congelar ampliaciones no incluidas, registrar cualquier cambio, y usar la aprobación del usuario como puerta obligatoria. El objetivo es 29 historias aceptadas de 92, equivalente a 31,52%.
