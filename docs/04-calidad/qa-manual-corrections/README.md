# Correcciones de prueba manual QA

Rama de trabajo: `feature/qa-manual-corrections`  
Estado: **QA-17, QA-18 y QA-19 implementados; validación manual y con PostgreSQL pendientes.**  
Origen: revisión de `CORRECCIONES DE LA PRUEBA MANUA-TORCLYL.docx` y sus siete capturas.

## Propósito

Concentrar las observaciones surgidas de la prueba manual transversal sin reabrir
ni modificar artificialmente el estado de los Sprints 01 a 16. Este paquete de
correcciones conserva la trazabilidad hacia el sprint que originalmente entregó
cada función y define qué hallazgos son defectos, qué hallazgos requieren una
mejora de experiencia y cuáles necesitan una decisión funcional o de seguridad.

## Distribución propuesta

| Paquete correctivo                                                           | Prioridad | Actividades         | Sprints de origen |
| ---------------------------------------------------------------------------- | --------- | ------------------- | ----------------- |
| [QA-17 - Flujos críticos](qa-17-critical-workflows/README.md)                | Alta      | QA-05, QA-06, QA-07 | 08, 10 y 11       |
| [QA-18 - Formularios y feedback](qa-18-forms-feedback/README.md)             | Media     | QA-03, QA-04        | 03 y 15           |
| [QA-19 - Seguridad y precisión de datos](qa-19-security-precision/README.md) | Media     | QA-01, QA-02, QA-08 | 01, 02, 05 y 16   |

El detalle completo de evidencia está en
[correction-backlog.md](correction-backlog.md). Cada paquete tiene un prompt y
plan de aceptación independientes. La ejecución debe respetar el orden QA-17,
QA-18 y QA-19, salvo que el responsable priorice otro caso.

## Límites obligatorios

1. No se desactiva autenticación, autorización, auditoría, validación de API,
   transacciones, locks ni idempotencia para satisfacer una prueba manual.
2. El login no debe revelar si una cuenta concreta existe, está desactivada o
   cuánto tiempo le falta de bloqueo. La evidencia administrativa/auditable es
   el lugar correcto para comprobar esos estados.
3. La política aprobada en QA-08 permite de cero a tres decimales para toda
   cantidad, incluso `und`. Web y API deben validarla antes de persistir; la
   base ya usa `Decimal(12,3)` y no requiere cambiarse.
4. No aplicar migraciones, semillas, cambios de variables de entorno, cambios de
   datos reales, commit ni push durante la implementación, salvo autorización
   expresa posterior.
5. No incluir, borrar ni alterar `.playwright-cli/`, `.playwright-mcp/`,
   `output/` ni `tmp/`.

## Definición de salida

Una actividad solo puede declararse implementada cuando:

- su caso queda reproducido o su expectativa queda justificada y actualizada;
- la UI, API y reglas de negocio permanecen coherentes;
- se añaden o actualizan pruebas deterministas de regresión;
- se documenta la evidencia en
  [verification-plan.md](verification-plan.md); y
- typecheck, lint, pruebas, build web, `format:check` y `git diff --check`
  terminan sin errores.

La aprobación manual y cualquier actualización del estado de los sprints
originales se realiza después, por una persona autorizada.
