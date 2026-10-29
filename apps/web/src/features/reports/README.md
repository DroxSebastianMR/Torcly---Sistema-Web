# Reports (web)

Módulo de reportes: inteligencia de negocio con indicadores trazables por bloque (ventas, cobros, inventario, servicios y taller), filtro por período con presets, gráficos accesibles con tabla equivalente, y estados de carga, vacío, error y restringido.

- Cada bloque es de solo lectura y declara fuente, período, criterio y estados incluidos desde la API; la UI reutiliza las reglas de saldo y stock del servidor sin recalcular nada.
- El período por defecto son los últimos 30 días (`defaultPeriod`); la fecha aplicada la resuelve el servidor y se muestra en cada tarjeta.
- Solo se consultan los bloques cuyos módulos de origen están autorizados para el usuario; si la API rechaza un bloque con `403` se muestra "Sección restringida", nunca ceros.
- Gráficos accesibles: cada serie es un `BarChart` con `role="img"`, etiqueta descriptiva y tabla equivalente; las tablas usan `<caption>` y no exponen UUIDs.
- El acceso a la página está limitado por `reports:read`; las tarjetas enlazan al módulo fuente según su permiso.

Sprint propietario: 13.
