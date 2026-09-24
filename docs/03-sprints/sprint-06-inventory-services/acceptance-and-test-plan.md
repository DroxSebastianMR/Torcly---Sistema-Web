# Aceptación y pruebas - Sprint 06

- El stock coincide con la suma confirmada de entradas menos salidas.
- Cantidades cero/negativas y salidas superiores al stock se rechazan.
- Reintentar la misma operación no descuenta ni suma dos veces.
- Cada movimiento conserva producto, tipo, cantidad, fecha, usuario y origen.
- Una alerta aparece cuando stock ≤ mínimo, con texto además de color.
- Servicio duplicado o precio negativo se rechaza.
- Desactivar servicio lo excluye de nuevas selecciones y conserva su registro.
- Pruebas concurrentes verifican que dos salidas no produzcan stock negativo.
- Test, typecheck, lint y build pasan.

Prueba manual: cargar stock inicial, registrar entrada/salida, forzar insuficiencia, revisar historial/alerta y completar CRUD de servicio.
