# Plan de implementación

1. Aplicar Prettier a los archivos versionados de `apps` y `docs`.
2. Tipar los adaptadores de cotizaciones y los mocks de pruebas para eliminar `any` explícitos.
3. Añadir configuración de Vitest por paquete con ejecución secuencial de archivos.
4. Validar typecheck, lint, formato, build, esquema Prisma, estado de migraciones y pruebas.
5. Ejecutar la matriz manual antes de solicitar la integración.
6. Corregir la restricción parcial de caja abierta para que sea única por
   organización y no global, incluyendo el manejo de conflictos concurrentes.
7. Simplificar la recepción de citas y órdenes directas: kilometraje y
   combustible opcionales; ocultar el peritaje hasta que sea aprobado.
8. Homologar los diálogos de decisión, cobro, cotización y orden directa con
   `Modal`, `SmartSelect`, `DatePicker` y la paleta de acciones primarias.
9. Estandarizar los encabezados de Cotizaciones, Notificaciones y Novedades
   con el patrón de Ventas, sin contadores duplicados fuera del sidebar.
10. Aplicar la regla de superposición en modales: cuando un `SmartSelect` pueda
    ocupar el pie de acciones, el contenido debe reservar espacio mientras su
    menú está abierto; al alcanzar el alto disponible, el cuerpo del `Modal`
    conserva su desplazamiento interno.
11. En Cotizaciones, habilitar el selector de vehículo sólo después de elegir
    un cliente y listar exclusivamente los vehículos asociados a éste.
