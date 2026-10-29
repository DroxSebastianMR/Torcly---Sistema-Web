# Estándar de módulos

## Frontend

Cada feature vive en `apps/web/src/features/<modulo>/` y crea únicamente carpetas con una responsabilidad real:

```text
components/  piezas visuales del dominio
forms/       esquemas y formularios
hooks/       coordinación de estado y consultas
pages/       composición de rutas
services/    contratos con la API
types/       tipos del dominio
utils/       funciones puras
styles/      estilos exclusivos, solo si Tailwind no basta
assets/      recursos exclusivos del módulo
README.md    alcance, rutas, archivos y relaciones
```

Los elementos reutilizados por varias features pertenecen a `src/components`, `src/lib`, `src/styles` o `src/assets`. Las páginas no llaman Axios directamente. Los hooks coordinan TanStack Query; los servicios usan el cliente HTTP.

## Backend

Cada dominio vive en `apps/api/src/modules/<modulo>/`:

```text
<modulo>.routes.ts       rutas y middleware
<modulo>.controller.ts   traducción HTTP
<modulo>.service.ts      reglas y casos de uso
<modulo>.repository.ts   persistencia
<modulo>.schema.ts       entrada y salida validadas
<modulo>.types.ts        contratos locales
README.md                alcance y relaciones
```

Los controladores no contienen reglas ni acceso directo a datos. Los servicios no dependen de Express. Las transacciones de inventario se resuelven en el servidor. Los archivos deben permanecer pequeños; se dividen por caso de uso cuando mezclan más de una responsabilidad.

## Reutilización

Se comparte un componente o utilidad cuando existen al menos dos consumidores reales y el contrato es estable. No se crea una abstracción anticipada. Formularios, tablas, filtros, confirmaciones, estados vacíos y manejo de errores conservarán una experiencia consistente.
