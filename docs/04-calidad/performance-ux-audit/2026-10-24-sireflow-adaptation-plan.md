# Plan de optimización de Torcly inspirado en Sireflow

Fecha: 24/10/2026  
Estado: en ejecución  
Alcance: rendimiento de lectura, carga inicial y fluidez operativa. No cambia reglas de negocio ni permisos.

## Decisión arquitectónica

Torcly **no** migrará a acceso directo desde el navegador hacia Supabase ni expondrá una clave de servicio. Su API concentra permisos, auditoría, locks transaccionales, idempotencia y reglas de inventario, pagos y taller; esos controles se preservan.

Se adopta de Sireflow únicamente el patrón que sí es transferible:

1. una respuesta de lectura orientada a la vista, en lugar de muchas solicitudes pequeñas;
2. columnas y relaciones explícitamente necesarias;
3. paginación y búsqueda remota;
4. carga diferida de datos que pertenecen a diálogos, pestañas o bloques aún ocultos;
5. caché de interfaz con invalidación después de mutaciones.

```text
Sireflow: renderer -> IPC -> REST/RPC Supabase -> PostgreSQL
Torcly:   navegador -> API Torcly -> Prisma/read model -> PostgreSQL
                                      ^
                         permisos, auditoría e invariantes de dominio
```

El equivalente seguro del RPC `get_my_account_bootstrap()` de Sireflow no es un cliente Supabase en Torcly: es un endpoint de lectura de Torcly que prepara exactamente lo que una pantalla requiere, bajo su autenticación actual.

## Evidencia de partida

La revisión de Sireflow confirma que su bootstrap agrupa perfil, membresía, licencia y capacidades en un RPC; sus listas piden columnas específicas y página acotada. En Torcly, React Query ya usa `staleTime` de 60 segundos, por lo que la caché de UI no explica por sí sola las demoras.

Los logs autenticados de Torcly muestran que el costo dominante está entre la API y PostgreSQL remoto: Dashboard ~4,6--5,6 s, Citas ~3,8--4,7 s, Órdenes ~3,6--4,5 s e Inventario ~2,7--2,9 s incluso con pocos datos. También hubo terminaciones de conexión del proveedor. Por tanto, el plan elimina trabajo y contención, pero no atribuye a código local una latencia propia de red o proveedor.

No se capturaron Core Web Vitals en esta sesión: el perfilador Chrome DevTools MCP no está disponible. La validación se hará con la telemetría HTTP/BD existente y, cuando se habilite el perfilador, con una captura fría y otra caliente.

## Plan por fases

### Fase 1 — carga mínima y consultas que escalan (implementación actual)

| Acción                                                                        | Estado                          | Protección conservada                                       |
| ----------------------------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------- |
| No cargar detalles de atención al montar Dashboard                            | aplicada                        | permisos por módulo; los detalles viven en el módulo origen |
| Cargar catálogos de diálogos/pestañas solo al abrirlos                        | aplicada                        | validación de formularios y caché React Query               |
| Reemplazar lectura completa de kardex por agregados de stock                  | aplicada                        | advisory locks, idempotencia y validación de saldo          |
| Reemplazar conteos repetidos por `groupBy`                                    | aplicada                        | mismos filtros y permisos                                   |
| Evitar escrituras de actividad de sesión en cada request                      | aplicada                        | vencimiento, revocación y cookie segura                     |
| Reutilizar el contexto autenticado en ráfagas de solicitudes                  | aplicada: TTL 10 s y máximo 500 | invalidación en logout, rol, estado y reset                 |
| Separar lecturas de transacciones interactivas                                | aplicada donde no hay escritura | transacciones permanecen en pagos, stock, ventas y taller   |
| Dashboard: usar read-model de conteos, no listas completas de caja/inventario | aplicada                        | saldo sigue derivado en servidor                            |

### Fase 2 — endpoints de vista y autenticación eficiente

1. Consolidar los datos de cada pantalla en contratos de `overview`, sin reutilizar el endpoint de detalle para una tarjeta.
2. Mantener la autorización centralizada. La caché corta del contexto de sesión implementada se invalida ante logout, actualización de perfil/rol, desactivación y reset de contraseña; nunca sustituye la verificación de operaciones críticas.
3. Añadir índices únicamente después de obtener `EXPLAIN ANALYZE` contra una base representativa. No se crearán índices por intuición.
4. Para catálogos grandes, usar búsqueda remota con mínimo de caracteres, límite y debounce; no descargar el catálogo completo para un select.

### Fase 3 — crecimiento de datos

1. Crear read-models SQL o vistas para stock disponible, saldos de cobro y métricas BI si los agregados dejan de cumplir el objetivo de respuesta.
2. Definir refresco/invalidate transaccional después de movimientos de inventario, venta, pago y devolución.
3. Paginar historial, auditoría y reportes por cursor o rango; no resolver sus datos completos en memoria.
4. Medir el pool, región de API y PostgreSQL, cuota del proveedor y errores de conexión. La API debe estar próxima a la base en producción.

## Criterios de aceptación de rendimiento

Los objetivos siguientes se evalúan con datos y red estables; no se consideran superados mientras exista una caída del proveedor:

- una navegación inicial no debe cargar datos de modales, pestañas ni tarjetas invisibles;
- una lectura de lista debe ser paginada y seleccionar solo los campos mostrados;
- Dashboard debe devolver contadores sin serializar listas de pagos o productos;
- toda mutación debe mantener lock, idempotencia, auditoría y validación vigente;
- telemetría registra `module`, `operation`, `route`, `status` y `durationMs`, sin datos personales o secretos;
- se comparan al menos cinco cargas frías y cinco calientes por módulo antes/después, con percentiles p50/p95.

## Fuera de alcance deliberado

- Migrar Torcly a Electron, Supabase directo o RLS como reemplazo de la API.
- Eliminar `requireAuth`, permisos, auditoría, advisory locks o idempotencia para ganar tiempo.
- Aumentar el pool a ciegas: podría empeorar el límite de conexiones del proveedor.
- Declarar una mejora de backend solo con una medición afectada por caída de red o timeout.

## Validación posterior

1. Aplicar migraciones pendientes en el entorno que se vaya a medir.
2. Iniciar web y API una sola vez; confirmar que no hay puertos duplicados.
3. Iniciar sesión, esperar el primer Dashboard y anotar el tiempo HTTP de cada ruta en los logs.
4. Navegar dos veces por Dashboard, Citas, Ventas, Caja, Inventario y Órdenes. La segunda ronda debe aprovechar React Query cuando no haya mutación.
5. Ejecutar una venta, un movimiento y un pago; confirmar que sus listados se invalidan y reflejan el dato correcto.
6. Cuando esté disponible Chrome DevTools MCP, capturar perfil frío/caliente y agregar LCP, INP, CLS y cadena de solicitudes a este documento.
