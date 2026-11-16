# Matriz de aceptación y pruebas

## Cotizaciones

**Dado** que la consulta de cotizaciones sigue pendiente, **cuando** se abre el
módulo, **entonces** se muestran cabeceras y filas skeleton, no el estado vacío.

## Dashboard

**Dado** que las consultas de resumen están pendientes, **cuando** se abre el
Dashboard, **entonces** se muestran skeletons equivalentes al encabezado, las
cuatro KPIs y paneles operativos.

## Regresión

1. Con datos disponibles, comprobar que no se muestra skeleton.
2. Con lista vacía, comprobar que se muestra el estado vacío correcto.
3. Simular error de consulta y comprobar que se conserva `ErrorState`.
4. Revisar a 375 px, 768 px y 1280 px sin desbordes.
