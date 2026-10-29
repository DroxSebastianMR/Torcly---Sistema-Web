# Plan de aceptación - Sprint 13 Inteligencia de negocio

## Preparación

1. Aplicar y verificar las pruebas manuales pendientes de Sprints 11 y 12.
2. Contar con ventas confirmadas, pagos parciales/completos/compensados, productos con movimientos y órdenes en varias etapas.
3. Iniciar sesión con permisos de lectura de las fuentes que se desean consultar.

## Cobertura automatizada

- **API**: 23 pruebas unitarias de reports (11 de reglas, 9 de servicio, 3 de schemas) + 6 de integración gated a base de datos; suite completa 256 correctas. Typecheck y lint en verde.
- **Web**: 15 pruebas de la feature reports (3 `BarChart`, 7 página, 5 formatters); suite completa 305 pruebas en 63 archivos. Typecheck, lint y build en verde.
- **Formato**: `format:check` en verde sobre `apps`, `docs`, `package.json`, `pnpm-workspace.yaml` y `README.md`; `git diff --check` sin salida.

## Casos

| Caso          | Acción                                              | Resultado esperado                                                               | Estado                                 |
| ------------- | --------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------- |
| Período       | Seleccionar rango válido y uno sin datos.           | Métricas y series coinciden con el período; vacío claro cuando no hay registros. | Automatizado parcial; manual pendiente |
| Ventas        | Comparar importe y cantidad con Ventas confirmadas. | Solo incluye ventas confirmadas y enlaza al origen.                              | Automatizado; manual pendiente         |
| Cobros        | Comparar saldo/cobrado con Caja.                    | Reutiliza pagos y compensaciones; no muestra saldo negativo.                     | Automatizado; manual pendiente         |
| Inventario    | Comparar alertas y movimientos con Inventario.      | Solo usa movimientos confirmados y stock trazable.                               | Automatizado; manual pendiente         |
| Taller        | Comparar estados con Citas y Órdenes.               | Conteos y criterios por etapa son visibles y conciliables.                       | Automatizado; manual pendiente         |
| Permisos      | Probar usuario con acceso parcial.                  | API restringe bloques no autorizados; UI no los presenta como cero.              | Automatizado; manual pendiente         |
| Accesibilidad | Navegar tablas y gráficos con teclado.              | Valores, leyendas y alternativa tabular son legibles.                            | Automatizado; manual pendiente         |
| Solo lectura  | Revisar acciones y red.                             | No existe mutación de datos.                                                     | Automatizado; manual pendiente         |

## Prueba manual

- Pendiente de ejecución por el usuario junto con Sprints 11 y 12. Registrar hallazgos y evidencias en `approval.md`.
