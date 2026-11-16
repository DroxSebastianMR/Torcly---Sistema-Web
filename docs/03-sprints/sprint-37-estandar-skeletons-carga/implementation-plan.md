# Plan de implementación

1. Revisar los componentes de tabla y páginas operativas para identificar
   carga visual, estado vacío y error.
2. Crear primitivas de skeleton accesibles en `components/ui`.
3. Añadir skeleton de tabla a Cotizaciones y aplicar el indicador `loading`
   correcto sólo durante la carga inicial.
4. Refinar el skeleton del Dashboard para que replique encabezado, KPIs y
   paneles, conservando el layout final.
5. Ejecutar typecheck, lint y pruebas dirigidas.

No se modifica API ni modelo de datos.
